// Panel endpoints for registrations (scoped by role and kind) and the contact inbox (admin only).
// Registered inside adminRoutes, so CSRF and authentication are already applied.
import { z } from 'zod';
import { tx, q, one } from '../db.js';
import { audit } from '../lib/audit.js';
import { toCsv } from '../lib/csv.js';
import { decrypt } from '../lib/crypto.js';
import { can } from '../lib/perm.js';
import * as R from '../lib/regrules.js';
import * as svc from '../lib/regsvc.js';

const forbidden = (reply) => reply.code(403).send({ error: 'forbidden' });
const kindOf = z.enum(['session', 'pilgrimage']);

// Decrypts the sensitive part. A row whose data was already wiped (retention) simply has none.
const sensitive = (r) => {
  if (!svc.KEY) return null;
  const c = r.contact_enc ? decrypt(svc.KEY, r.contact_enc) : null;
  return { emergency: c?.emergency ?? null, guardian: c?.guardian ?? null, allergies: r.allergies_enc ? decrypt(svc.KEY, r.allergies_enc) : null };
};
const plain = ({ contact_enc: _c, allergies_enc: _a, ...r }) => ({ ...r, has_allergies: !!_a });

export default async function regAdminRoutes(app) {
  // kind + event_id from the query, checked against the role's scope.
  const scope = async (req, reply) => {
    const p = z.object({ kind: kindOf, event_id: z.coerce.number().int().positive() }).safeParse(req.query);
    if (!p.success) return reply.code(400).send({ error: 'validation' });
    if (!can(req.user.role, 'registrations', 'read') || !R.canRead(req.user.role, p.data.kind)) return forbidden(reply);
    req.scope = p.data;
  };

  // Events with their counts, only the kinds the role may see.
  app.get('/api/admin/registrations/events', async (req, reply) => {
    if (!can(req.user.role, 'registrations', 'read')) return forbidden(reply);
    const counts = await q('SELECT kind, event_id, status, COUNT(*) n FROM registrations GROUP BY kind, event_id, status');
    const out = [];
    for (const kind of R.scopeOf(req.user.role)) {
      const rows = kind === 'session'
        ? await q(`SELECT e.id, COALESCE(e.title, r.title) title, e.starts_on, e.ends_on, e.cupo, e.registration_mode, e.published_snapshot snap FROM retreat_sessions e LEFT JOIN retreats r ON r.id = e.retreat_id ORDER BY e.starts_on DESC`)
        : await q('SELECT id, title, starts_on, ends_on, cupo, registration_mode, published_snapshot snap FROM pilgrimages ORDER BY starts_on DESC');
      for (const e of rows) {
        const n = Object.fromEntries(counts.filter((c) => c.kind === kind && c.event_id === e.id).map((c) => [c.status, c.n]));
        if (e.registration_mode !== 'own' && !Object.keys(n).length) continue;
        out.push({
          kind, id: e.id, title: e.title, starts_on: e.starts_on, ends_on: e.ends_on, mode: e.registration_mode,
          cupo: e.snap ? e.snap.cupo ?? null : e.cupo, published: !!e.snap, counts: n,
        });
      }
    }
    return out;
  });

  app.get('/api/admin/registrations', { preHandler: scope }, async (req) => {
    const { kind, event_id: id } = req.scope;
    const rows = await q('SELECT * FROM registrations WHERE kind = ? AND event_id = ? ORDER BY FIELD(status, "confirmado","oferta","lista_espera","pendiente_verificacion","cancelado","expirado"), queue_at, id', [kind, id]);
    const wl = rows.filter((r) => r.status === 'lista_espera');
    return { manage: R.canManage(req.user.role, kind), rows: rows.map((r) => ({ ...plain(r), position: r.status === 'lista_espera' ? R.position(wl, r.id) : null })) };
  });

  app.get('/api/admin/registrations/export.csv', { preHandler: scope }, async (req, reply) => {
    const { kind, event_id: id } = req.scope;
    if (!R.canManage(req.user.role, kind)) return forbidden(reply);
    const rows = await q("SELECT * FROM registrations WHERE kind = ? AND event_id = ? AND status <> 'expirado' ORDER BY id", [kind, id]);
    const cols = ['id', 'estado', 'nombre', 'telefono', 'correo', 'idioma', 'emergencia_nombre', 'emergencia_telefono', 'tutor_nombre', 'tutor_telefono', 'menor_de_18', 'permiso_tutor', 'alergias', 'inscrito'];
    const data = rows.map((r) => {
      const s = sensitive(r);
      return { id: r.id, estado: r.status, nombre: r.name, telefono: r.phone, correo: r.email, idioma: r.lang, emergencia_nombre: s?.emergency?.name, emergencia_telefono: s?.emergency?.phone,
        tutor_nombre: s?.guardian?.name, tutor_telefono: s?.guardian?.phone, menor_de_18: r.under18 == null ? '' : r.under18 ? 'si' : 'no', permiso_tutor: r.minor_permission == null ? '' : r.minor_permission ? 'si' : 'no',
        alergias: s?.allergies, inscrito: new Date(r.created_at).toISOString() };
    });
    await tx((c) => audit(c, req, 'export', 'registrations', id, { kind, rows: rows.length }));
    return reply.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="inscripciones-${kind}-${id}.csv"`).header('Cache-Control', 'no-store').send(toCsv(cols, data));
  });

  // One registration with its decrypted data (audited).
  app.get('/api/admin/registrations/:id', async (req, reply) => {
    const r = await one('SELECT * FROM registrations WHERE id = ?', [Number(req.params.id)]);
    if (!r || !R.canRead(req.user.role, r.kind)) return reply.code(r ? 403 : 404).send({ error: r ? 'forbidden' : 'not_found' });
    if (!R.canManage(req.user.role, r.kind)) return plain(r);
    await tx((c) => audit(c, req, 'view_sensitive', 'registrations', r.id));
    return { ...plain(r), ...sensitive(r) };
  });

  app.post('/api/admin/registrations/:id/action', async (req, reply) => {
    const { action } = z.strictObject({ action: z.enum(['confirm', 'cancel', 'waitlist']) }).parse(req.body);
    const r = await one('SELECT kind FROM registrations WHERE id = ?', [Number(req.params.id)]);
    if (!r) return reply.code(404).send({ error: 'not_found' });
    if (!can(req.user.role, 'registrations', 'write') || !R.canManage(req.user.role, r.kind)) return forbidden(reply);
    return svc.manual(Number(req.params.id), action, req);
  });

  // ---- contact inbox (admin) ----
  const inbox = (action) => async (req, reply) => (can(req.user.role, 'contact', action) ? undefined : forbidden(reply));

  app.get('/api/admin/contact/summary', { preHandler: inbox('read') }, async () => {
    const today = new Date().toISOString().slice(0, 10);
    const s = await one(`SELECT SUM(status = 'nuevo') nuevos, SUM(is_arco AND status IN ('nuevo','leido')) arco_abiertos,
      SUM(is_arco AND status IN ('nuevo','leido') AND due_on < ?) arco_vencidos FROM contact_messages WHERE status <> 'spam'`, [today]);
    return { nuevos: Number(s.nuevos ?? 0), arco_abiertos: Number(s.arco_abiertos ?? 0), arco_vencidos: Number(s.arco_vencidos ?? 0) };
  });

  app.get('/api/admin/contact', { preHandler: inbox('read') }, async (req) => {
    const { status, arco } = req.query;
    return q(`SELECT id, name, email, subject, status, is_arco, due_on, lang, score, created_at, LEFT(message, 120) preview FROM contact_messages
      WHERE (? IS NULL OR status = ?) AND (? IS NULL OR is_arco = 1) ORDER BY id DESC LIMIT 300`, [status || null, status || null, arco ? 1 : null]);
  });

  app.get('/api/admin/contact/:id', { preHandler: inbox('read') }, async (req, reply) =>
    (await one('SELECT * FROM contact_messages WHERE id = ?', [Number(req.params.id)])) ?? reply.code(404).send({ error: 'not_found' }));

  app.patch('/api/admin/contact/:id', { preHandler: inbox('write') }, async (req, reply) => {
    const { status } = z.strictObject({ status: z.enum(['nuevo', 'leido', 'respondido', 'spam']) }).parse(req.body);
    const id = Number(req.params.id);
    const hit = await tx(async (c) => {
      const before = await c.one('SELECT status FROM contact_messages WHERE id = ? FOR UPDATE', [id]);
      if (!before) return false;
      await c.q('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
      await audit(c, req, 'update', 'contact_messages', id, { status: { from: before.status, to: status } });
      return true;
    });
    return hit ? reply.code(204).send() : reply.code(404).send({ error: 'not_found' });
  });
}
