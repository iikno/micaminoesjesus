import { q } from '../db.js';

export const MEDIA_REF = /^media:(\d+)$/;
// Snapshot fields that may hold an image: a 'media:ID' reference, or a legacy bundled filename.
const IMAGE_FIELDS = ['cover', 'photo'];

// Replaces 'media:ID' with its public URL (plus _thumb/_alt/_w/_h). Photos with minors, or missing, become null
// so the site never serves them. Legacy filenames pass through; the client falls back to its bundled assets.
export async function resolveMedia(items, lang = 'es') {
  const ids = new Set();
  for (const it of items) for (const f of IMAGE_FIELDS) { const m = MEDIA_REF.exec(it[f] ?? ''); if (m) ids.add(Number(m[1])); }
  if (!ids.size) return items;
  const rows = await q('SELECT id, file, thumb, width, height, alt_es, alt_en, has_minors FROM media WHERE id IN (?)', [[...ids]]);
  const by = new Map(rows.map((r) => [r.id, r]));
  return items.map((it) => {
    const out = { ...it };
    for (const f of IMAGE_FIELDS) {
      const m = MEDIA_REF.exec(it[f] ?? '');
      if (!m) continue;
      const r = by.get(Number(m[1]));
      const ok = r && !r.has_minors;
      out[f] = ok ? `/uploads/${r.file}` : null;
      if (ok) Object.assign(out, { [`${f}_thumb`]: `/uploads/${r.thumb}`, [`${f}_w`]: r.width, [`${f}_h`]: r.height, [`${f}_alt`]: (lang === 'en' && r.alt_en) || r.alt_es || null });
    }
    return out;
  });
}
