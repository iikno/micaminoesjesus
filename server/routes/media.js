import { randomBytes } from 'node:crypto';
import { createReadStream, mkdirSync } from 'node:fs';
import { rename, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import multipart from '@fastify/multipart';
import { audit } from '../lib/audit.js';
import { ImageError, processImage } from '../lib/images.js';
import { MEDIA_REF } from '../lib/media.js';
import { can } from '../lib/perm.js';
import * as s from '../lib/schemas.js';
import { config } from '../config.js';
import { one, q, tx } from '../db.js';

// pub/ is what /uploads serves; private/ (photos with minors) is only reachable through the authenticated /raw route.
export const dirs = () => {
  const root = resolve(config.uploadsDir);
  return { pub: join(root, 'pub'), priv: join(root, 'private') };
};
const where = (row) => (row.has_minors ? dirs().priv : dirs().pub);

// Image columns that can point at a media row, in the live row and in both snapshots.
const REFS = [['retreats', 'cover'], ['pilgrimages', 'cover'], ['team_members', 'photo']];
export async function referencedIds() {
  const ids = new Set();
  for (const [t, col] of REFS) {
    const j = (c) => `JSON_UNQUOTE(JSON_EXTRACT(${c}, '$.${col}'))`;
    for (const r of await q(`SELECT ${col} a, ${j('published_snapshot')} b, ${j('pending_snapshot')} c FROM ${t}`)) {
      for (const v of [r.a, r.b, r.c]) { const m = MEDIA_REF.exec(v ?? ''); if (m) ids.add(Number(m[1])); }
    }
  }
  return ids;
}

export default async function mediaRoutes(app) {
  mkdirSync(dirs().pub, { recursive: true });
  mkdirSync(dirs().priv, { recursive: true });
  await app.register(multipart, { limits: { fileSize: config.UPLOAD_MAX_MB * 1024 * 1024, files: 1, fields: 0 } });
  const guard = (action) => async (req, reply) => (can(req.user.role, 'media', action) ? undefined : reply.code(403).send({ error: 'forbidden' }));

  app.get('/api/admin/media', { preHandler: guard('read') }, async () => {
    const used = await referencedIds();
    return (await q('SELECT * FROM media ORDER BY id DESC')).map((m) => ({ ...m, has_minors: !!m.has_minors, used: used.has(m.id) }));
  });

  app.post('/api/admin/media', { preHandler: guard('write') }, async (req, reply) => {
    const part = await req.file();
    if (!part) throw new ImageError('no_file');
    const buf = await part.toBuffer(); // throws 413 past UPLOAD_MAX_MB
    const img = await processImage(buf); // magic bytes first, then re-encode
    const name = randomBytes(16).toString('hex');
    const file = `${name}.webp`, thumb = `${name}-t.webp`;
    const { pub } = dirs();
    await writeFile(join(pub, file), img.full);
    await writeFile(join(pub, thumb), img.thumb);
    try {
      const id = await tx(async (c) => {
        const r = await c.q('INSERT INTO media (file, thumb, width, height, bytes, uploaded_by) VALUES (?,?,?,?,?,?)', [file, thumb, img.width, img.height, img.full.length, req.user.id]);
        await audit(c, req, 'upload', 'media', r.insertId, { file, bytes: img.full.length });
        return r.insertId;
      });
      return reply.code(201).send({ ...(await one('SELECT * FROM media WHERE id = ?', [id])), has_minors: false, used: false });
    } catch (e) {
      await Promise.all([unlink(join(pub, file)), unlink(join(pub, thumb))].map((p) => p.catch(() => {})));
      throw e;
    }
  });

  app.patch('/api/admin/media/:id', { preHandler: guard('write') }, async (req, reply) => {
    const patch = s.mediaPatch.parse(req.body);
    if (!Object.keys(patch).length) return reply.code(400).send({ error: 'empty_patch' });
    await tx(async (c) => {
      const row = await c.one('SELECT * FROM media WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!row) throw Object.assign(new Error('not_found'), { status: 404 });
      if (patch.has_minors !== undefined && patch.has_minors !== !!row.has_minors) {
        const from = where(row), to = where({ has_minors: patch.has_minors });
        for (const f of [row.file, row.thumb]) await rename(join(from, f), join(to, f));
      }
      await c.q('UPDATE media SET ? WHERE id = ?', [patch, row.id]);
      await audit(c, req, 'update', 'media', row.id, patch);
    });
    return reply.code(204).send();
  });

  app.delete('/api/admin/media/:id', { preHandler: guard('write') }, async (req, reply) => {
    const row = await one('SELECT * FROM media WHERE id = ?', [req.params.id]);
    if (!row) return reply.code(404).send({ error: 'not_found' });
    if ((await referencedIds()).has(row.id)) return reply.code(409).send({ error: 'media_in_use' });
    await tx(async (c) => {
      await c.q('DELETE FROM media WHERE id = ?', [row.id]);
      await audit(c, req, 'delete', 'media', row.id, { file: row.file });
    });
    for (const f of [row.file, row.thumb]) await unlink(join(where(row), f)).catch(() => {});
    return reply.code(204).send();
  });

  // Panel previews, including photos that must not be public.
  app.get('/api/admin/media/:id/raw', { preHandler: guard('read') }, async (req, reply) => {
    const row = await one('SELECT * FROM media WHERE id = ?', [req.params.id]);
    if (!row) return reply.code(404).send({ error: 'not_found' });
    return reply.type('image/webp').header('Cache-Control', 'private, max-age=3600').send(createReadStream(join(where(row), req.query.thumb ? row.thumb : row.file)));
  });
}
