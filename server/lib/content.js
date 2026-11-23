import { q } from '../db.js';
import { localize } from './i18n.js';
import { resolveMedia } from './media.js';

// Only published_snapshot is ever served, and only once live_from has passed.
export async function snaps(table, order = 'id') {
  const rows = await q(`SELECT id, published_snapshot FROM ${table} WHERE published_snapshot IS NOT NULL AND live_from <= ? ORDER BY ${order}`, [new Date()]);
  return rows.map((r) => ({ ...r.published_snapshot, id: r.id }));
}

// Published items in one language (English falls back to Spanish field by field), image references resolved.
export async function published(table, lang = 'es', order = 'id') {
  return resolveMedia((await snaps(table, order)).map((s) => localize(s, lang)), lang);
}

// One published item by slug (for SEO tags), same localization as the API.
export async function publishedBySlug(table, slug, lang = 'es') {
  const [r] = await q(`SELECT id, published_snapshot FROM ${table} WHERE published_snapshot IS NOT NULL AND live_from <= ? AND JSON_UNQUOTE(JSON_EXTRACT(published_snapshot, '$.slug')) = ? LIMIT 1`, [new Date(), slug]);
  return r ? (await resolveMedia([localize({ ...r.published_snapshot, id: r.id }, lang)], lang))[0] : null;
}
