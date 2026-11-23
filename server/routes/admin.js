import { z } from 'zod';
import { audit } from '../lib/audit.js';
import { authenticate, csrf } from '../lib/auth.js';
import { ENTITIES, snapshotOf, toColumns } from '../lib/entities.js';
import { labelOf, notifyDecision, notifySubmitted } from '../lib/notify.js';
import { can } from '../lib/perm.js';
import { FlowError, canDecide, nextStatus, planApproval } from '../lib/review.js';
import * as s from '../lib/schemas.js';
import { inviteUser } from '../lib/users.js';
import { one, q, tx } from '../db.js';

const deny = (reply) => reply.code(403).send({ error: 'forbidden' });
const fail = (code, error) => { throw new FlowError(error, code); };

// preHandler factory: role must hold `action` on the entity's resource.
const needs = (action) => async (req, reply) => (can(req.user.role, req.ent.resource, action) ? undefined : deny(reply));

// Locks the row for the duration of the transaction.
async function lockRow(c, e, id) {
  return (await c.one(`SELECT * FROM ${e.table} WHERE id = ? FOR UPDATE`, [id])) ?? fail(404, 'not_found');
}

const diffOf = (before, after) => {
  const d = {};
  for (const k of Object.keys(after)) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) d[k] = { from: before[k] ?? null, to: after[k] };
  return d;
};

const SET = (cols) => Object.keys(cols).map((k) => `\`${k}\` = ?`).join(', ');

export default async function adminRoutes(app) {
  app.addHook('preHandler', csrf);
  app.addHook('preHandler', authenticate);

  // ---- users (admin only) ----
  const userGuard = (action) => async (req, reply) => (can(req.user.role, 'users', action) ? undefined : deny(reply));

  app.get('/api/admin/users', { preHandler: userGuard('read') }, () =>
    q('SELECT id, email, name, role, status, email_verified_at, locked_until, created_at FROM users ORDER BY id'));

  app.post('/api/admin/users', { preHandler: userGuard('write') }, async (req, reply) => {
    const data = s.invite.parse(req.body);
    const r = await tx(async (c) => {
      const out = await inviteUser(c, data);
      if (!out.exists) await audit(c, req, 'invite', 'users', out.id, { email: data.email, role: data.role });
      return out;
    });
    return r.exists ? reply.code(409).send({ error: 'user_exists' }) : reply.code(201).send({ id: r.id });
  });

  app.patch('/api/admin/users/:id', { preHandler: userGuard('write') }, async (req, reply) => {
    const id = Number(req.params.id);
    const patch = s.userPatch.parse(req.body);
    if (id === req.user.id && (patch.role || patch.status)) return reply.code(409).send({ error: 'cannot_change_self' });
    if (!Object.keys(patch).length) return reply.code(400).send({ error: 'empty_patch' });
    await tx(async (c) => {
      const before = await c.one('SELECT name, role, status FROM users WHERE id = ? FOR UPDATE', [id]) ?? fail(404, 'not_found');
      if (before.status === 'invited' && patch.status) fail(409, 'user_not_active_yet');
      await c.q(`UPDATE users SET ${SET(patch)} WHERE id = ?`, [...Object.values(patch), id]);
      if (patch.status === 'disabled' || patch.role) await c.q('DELETE FROM sessions WHERE user_id = ?', [id]);
      await audit(c, req, 'update', 'users', id, diffOf(before, patch));
    });
    return reply.code(204).send();
  });

  // ---- review queue and audit log ----
  app.get('/api/admin/reviews/pending', async (req, reply) => {
    const mine = Object.entries(ENTITIES).filter(([, e]) => can(req.user.role, e.resource, 'approve'));
    if (!mine.length) return deny(reply);
    const out = [];
    for (const [key, e] of mine) {
      const rows = await q(
        `SELECT r.id review_id, r.entity_id, r.version rv_version, r.submitted_by rv_by, r.created_at rv_at, t.*
           FROM reviews r JOIN ${e.table} t ON t.id = r.entity_id WHERE r.entity = ? AND r.decision = 'pendiente' ORDER BY r.created_at`, [key]);
      for (const r of rows) {
        out.push({ review_id: r.review_id, entity: key, id: r.entity_id, label: labelOf(r), version: r.rv_version,
          submitted_by: r.rv_by, own: r.rv_by === req.user.id, hours: Math.floor((Date.now() - new Date(r.rv_at)) / 3600e3) });
      }
    }
    return out;
  });

  // Items the caller submitted that are currently rejected, with the reviewer's comment.
  app.get('/api/admin/reviews/mine', async (req) => {
    const out = [];
    for (const [key, e] of Object.entries(ENTITIES)) {
      if (!can(req.user.role, e.resource, 'write')) continue;
      const rows = await q(
        `SELECT r.entity_id, r.comment, r.decided_at, t.* FROM reviews r JOIN ${e.table} t ON t.id = r.entity_id
          WHERE r.entity = ? AND r.submitted_by = ? AND r.decision = 'rechazado' AND t.status = 'rechazado'
            AND r.id = (SELECT MAX(id) FROM reviews WHERE entity = r.entity AND entity_id = r.entity_id)`, [key, req.user.id]);
      for (const r of rows) out.push({ entity: key, id: r.entity_id, label: labelOf(r), comment: r.comment, decided_at: r.decided_at });
    }
    return out;
  });

  app.get('/api/admin/audit', async (req, reply) => {
    if (!can(req.user.role, 'audit', 'read')) return deny(reply);
    const { entity, entity_id: id, user_id: uid, action, from, to, limit = '100' } = req.query;
    const day = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d ?? '') ? d : null);
    return q(`SELECT a.*, u.name user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
               WHERE (? IS NULL OR a.entity = ?) AND (? IS NULL OR a.entity_id = ?) AND (? IS NULL OR a.user_id = ?) AND (? IS NULL OR a.action = ?)
                 AND (? IS NULL OR a.created_at >= ?) AND (? IS NULL OR a.created_at < DATE_ADD(?, INTERVAL 1 DAY))
               ORDER BY a.id DESC LIMIT ?`,
      [entity ?? null, entity ?? null, id ?? null, id ?? null, uid ?? null, uid ?? null, action ?? null, action ?? null,
        day(from), day(from), day(to), day(to), Math.min(Number(limit) || 100, 500)]);
  });

  // ---- content entities ----
  app.register(async (g) => {
    g.addHook('preHandler', async (req, reply) => {
      req.ent = Object.hasOwn(ENTITIES, req.params.entity) ? ENTITIES[req.params.entity] : null;
      if (!req.ent) return reply.code(404).send({ error: 'unknown_entity' });
    });

    g.get('/api/admin/:entity', { preHandler: needs('read') }, async (req) => {
      const rows = await q(`SELECT * FROM ${req.ent.table} ORDER BY id`);
      return rows.map(({ body: _b, published_snapshot: _s, ...r }) => r); // heavy JSON only on single-item reads
    });

    g.get('/api/admin/:entity/:id', { preHandler: needs('read') }, async (req, reply) =>
      (await one(`SELECT * FROM ${req.ent.table} WHERE id = ?`, [req.params.id])) ?? reply.code(404).send({ error: 'not_found' }));

    g.get('/api/admin/:entity/:id/reviews', { preHandler: needs('read') }, (req) =>
      q(`SELECT r.id, r.version, r.decision, r.comment, r.created_at, r.decided_at, s.name submitted_by_name, v.name reviewer_name
           FROM reviews r JOIN users s ON s.id = r.submitted_by LEFT JOIN users v ON v.id = r.reviewer_id
          WHERE r.entity = ? AND r.entity_id = ? ORDER BY r.id DESC`, [req.params.entity, req.params.id]));

    g.post('/api/admin/:entity', { preHandler: needs('write') }, async (req, reply) => {
      const cols = toColumns(req.ent, req.ent.schema.parse(req.body));
      const id = await tx(async (c) => {
        const r = await c.q(`INSERT INTO ${req.ent.table} SET ?, created_by = ?, updated_by = ?`, [cols, req.user.id, req.user.id]);
        await audit(c, req, 'create', req.params.entity, r.insertId, cols);
        return r.insertId;
      });
      return reply.code(201).send({ id });
    });

    g.patch('/api/admin/:entity/:id', { preHandler: needs('write') }, async (req, reply) => {
      const cols = toColumns(req.ent, req.ent.patch.parse(req.body));
      if (!Object.keys(cols).length) return reply.code(400).send({ error: 'empty_patch' });
      await tx(async (c) => {
        const row = await lockRow(c, req.ent, req.params.id);
        const status = nextStatus(row.status, 'edit'); // throws while under review
        await c.q(`UPDATE ${req.ent.table} SET ?, status = ?, version = version + 1, updated_by = ? WHERE id = ?`, [cols, status, req.user.id, row.id]);
        await audit(c, req, 'update', req.params.entity, row.id, diffOf(row, cols));
      });
      return reply.code(204).send();
    });

    // Only never-published items can be deleted; unpublishing live content is a later phase.
    g.delete('/api/admin/:entity/:id', { preHandler: needs('write') }, async (req, reply) => {
      await tx(async (c) => {
        const row = await lockRow(c, req.ent, req.params.id);
        if (row.published_snapshot) fail(409, 'already_published');
        await c.q(`DELETE FROM ${req.ent.table} WHERE id = ?`, [row.id]);
        await c.q('DELETE FROM reviews WHERE entity = ? AND entity_id = ?', [req.params.entity, row.id]);
        await audit(c, req, 'delete', req.params.entity, row.id, { label: labelOf(row) });
      });
      return reply.code(204).send();
    });

    g.post('/api/admin/:entity/:id/submit', { preHandler: needs('write') }, async (req, reply) => {
      const row = await tx(async (c) => {
        const r = await lockRow(c, req.ent, req.params.id);
        const status = nextStatus(r.status, 'submit');
        await c.q(`UPDATE ${req.ent.table} SET status = ? WHERE id = ?`, [status, r.id]);
        await c.q('INSERT INTO reviews (entity, entity_id, version, submitted_by, created_at) VALUES (?,?,?,?,?)',
          [req.params.entity, r.id, r.version, req.user.id, new Date()]);
        await audit(c, req, 'submit', req.params.entity, r.id, { version: r.version });
        return r;
      });
      await notifySubmitted(req.params.entity, row, req.user);
      return reply.code(202).send({ status: 'en_revision' });
    });

    const decide = (event) => async (req, reply) => {
      const { comment = '', publish_at: publishAt } = (event === 'reject' ? s.rejection : s.decision).parse(req.body ?? {});
      const { row, review } = await tx(async (c) => {
        const r = await lockRow(c, req.ent, req.params.id);
        if (event === 'approve' && publishAt !== undefined) r.publish_at = publishAt ? new Date(publishAt) : null; // reviewer picks now vs schedule
        const rv = await c.one("SELECT * FROM reviews WHERE entity = ? AND entity_id = ? AND decision = 'pendiente' ORDER BY id DESC LIMIT 1 FOR UPDATE",
          [req.params.entity, r.id]) ?? fail(409, 'no_pending_review');
        if (!canDecide(req.user, req.ent.resource, rv.submitted_by)) fail(403, 'cannot_decide_own_or_forbidden');
        const status = nextStatus(r.status, event, { publishAt: r.publish_at, comment });
        const now = new Date();
        if (event === 'approve') {
          const plan = planApproval(r, now);
          const snap = JSON.stringify(snapshotOf(req.ent, r));
          if (plan.slot === 'pending') {
            await c.q(`UPDATE ${req.ent.table} SET status = ?, publish_at = ?, pending_snapshot = ?, pending_from = ? WHERE id = ?`, [status, r.publish_at, snap, plan.from, r.id]);
          } else {
            await c.q(`UPDATE ${req.ent.table} SET status = ?, live_from = ?, publish_at = ?, published_snapshot = ?, pending_snapshot = NULL, pending_from = NULL WHERE id = ?`,
              [status, plan.from, r.publish_at, snap, r.id]);
          }
        } else {
          await c.q(`UPDATE ${req.ent.table} SET status = ? WHERE id = ?`, [status, r.id]);
        }
        await c.q('UPDATE reviews SET decision = ?, reviewer_id = ?, comment = ?, decided_at = ? WHERE id = ?',
          [event === 'approve' ? 'aprobado' : 'rechazado', req.user.id, comment || null, now, rv.id]);
        await audit(c, req, event, req.params.entity, r.id, { version: rv.version, comment: comment || null });
        return { row: r, review: rv };
      });
      await notifyDecision(req.params.entity, row, review.submitted_by, req.user, event === 'approve' ? 'aprobado' : 'rechazado', comment);
      return reply.code(200).send({ ok: true });
    };
    g.post('/api/admin/:entity/:id/approve', { preHandler: needs('approve') }, decide('approve'));
    g.post('/api/admin/:entity/:id/reject', { preHandler: needs('approve') }, decide('reject'));

    // Typo fix on live content without review: text columns only, comment required, diff audited.
    g.post('/api/admin/:entity/:id/quick-fix', { preHandler: needs('quick_fix') }, async (req, reply) => {
      const fields = Object.fromEntries(req.ent.text.map((k) => [k, z.string().trim().max(20000).nullable()]));
      const { comment, patch } = z.strictObject({ comment: z.string().trim().min(1).max(2000), patch: z.strictObject(fields).partial() }).parse(req.body);
      if (!Object.keys(patch).length) return reply.code(400).send({ error: 'empty_patch' });
      await tx(async (c) => {
        const row = await lockRow(c, req.ent, req.params.id);
        if (!row.published_snapshot) fail(409, 'not_published');
        // Patch the live snapshot itself so unreviewed draft edits never go live through here.
        const snap = { ...row.published_snapshot, ...patch };
        const pend = row.pending_snapshot && JSON.stringify({ ...row.pending_snapshot, ...patch }); // the fix must survive the scheduled promotion
        await c.q(`UPDATE ${req.ent.table} SET ?, published_snapshot = ?, pending_snapshot = COALESCE(?, pending_snapshot), updated_by = ? WHERE id = ?`, [patch, JSON.stringify(snap), pend, req.user.id, row.id]);
        await audit(c, req, 'quick_fix', req.params.entity, row.id, { comment, changes: diffOf(row.published_snapshot, patch) });
      });
      return reply.code(204).send();
    });
  });
}
