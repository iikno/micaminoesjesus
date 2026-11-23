import { audit } from '../lib/audit.js';
import { can } from '../lib/perm.js';
import * as s from '../lib/schemas.js';
import { usage } from '../lib/translations.js';
import { q, tx } from '../db.js';

// Translation usage (any role that edits translatable content) and the glossary (admin only).
export default async function translateRoutes(app) {
  const guard = (resource, action) => async (req, reply) => (can(req.user.role, resource, action) ? undefined : reply.code(403).send({ error: 'forbidden' }));
  const canTranslate = async (req, reply) => (['retreats', 'sessions', 'pilgrimages', 'team'].some((r) => can(req.user.role, r, 'write')) ? undefined : reply.code(403).send({ error: 'forbidden' }));
  const norm = (d) => ({ ...d, en: d.mode === 'map' ? d.en : null, note: d.note ?? null });

  app.get('/api/admin/translate/status', { preHandler: canTranslate }, () => usage());

  app.get('/api/admin/glossary', { preHandler: guard('glossary', 'read') }, () => q('SELECT * FROM glossary ORDER BY mode, term'));

  app.post('/api/admin/glossary', { preHandler: guard('glossary', 'write') }, async (req, reply) => {
    const data = norm(s.glossaryTerm.parse(req.body));
    const id = await tx(async (c) => {
      const r = await c.q('INSERT INTO glossary SET ?', [data]);
      await audit(c, req, 'create', 'glossary', r.insertId, data);
      return r.insertId;
    });
    return reply.code(201).send({ id });
  });

  app.patch('/api/admin/glossary/:id', { preHandler: guard('glossary', 'write') }, async (req, reply) => {
    const data = norm(s.glossaryTerm.parse(req.body));
    await tx(async (c) => {
      const r = await c.q('UPDATE glossary SET ? WHERE id = ?', [data, req.params.id]);
      if (!r.affectedRows) throw Object.assign(new Error('not_found'), { status: 404 });
      await audit(c, req, 'update', 'glossary', Number(req.params.id), data);
    });
    return reply.code(204).send();
  });

  app.delete('/api/admin/glossary/:id', { preHandler: guard('glossary', 'write') }, async (req, reply) => {
    await tx(async (c) => {
      await c.q('DELETE FROM glossary WHERE id = ?', [req.params.id]);
      await audit(c, req, 'delete', 'glossary', Number(req.params.id));
    });
    return reply.code(204).send();
  });
}
