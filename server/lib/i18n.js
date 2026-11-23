export const LANGS = ['es', 'en'];
export const normLang = (v) => (v === 'en' ? 'en' : 'es');

const plain = (v) => v && typeof v === 'object' && !Array.isArray(v);

// English value wins; an empty or missing English leaf falls back to the Spanish one (arrays by position).
export function fallbackDeep(es, en) {
  if (en == null || en === '') return es;
  if (Array.isArray(en) && Array.isArray(es)) return en.map((v, i) => fallbackDeep(es[i], v));
  if (plain(en) && plain(es)) return Object.fromEntries([...new Set([...Object.keys(es), ...Object.keys(en)])].map((k) => [k, fallbackDeep(es[k], en[k])]));
  return en;
}

// A snapshot carries `en` (the reviewed English fields, same shape as the Spanish ones). `en` never leaks out.
export function localize(snap, lang) {
  const { en, ...rest } = snap;
  if (lang !== 'en' || !plain(en)) return rest;
  const out = { ...rest };
  for (const [k, v] of Object.entries(en)) out[k] = fallbackDeep(rest[k], v);
  return out;
}
