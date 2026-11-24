import { config } from '../config.js';
import { one, q, tx } from '../db.js';
import { audit } from './audit.js';
import { draftOnSubmit, leaves, rebuild, srcHash, translateTexts, TranslateError } from './translate.js';

export const translateEnabled = () => !!config.CLAUDE;
const month = (d = new Date()) => d.toISOString().slice(0, 7);

// The Spanish fields of an item that have an English version, as one plain object.
export const sourceFields = (e, row) => Object.fromEntries(e.tr.filter((k) => row[k] != null).map((k) => [k, row[k]]));

export async function usage() {
  const [u] = await q('SELECT chars, input_tokens, output_tokens, calls FROM translate_usage WHERE ym = ?', [month()]);
  return {
    enabled: translateEnabled(), provider: config.TRANSLATE_PROVIDER, model: config.TRANSLATE_MODEL, month: month(),
    used: Number(u?.chars ?? 0), limit: config.TRANSLATE_MONTHLY_LIMIT, input_tokens: Number(u?.input_tokens ?? 0), output_tokens: Number(u?.output_tokens ?? 0), calls: u?.calls ?? 0,
  };
}

// Current EN draft plus whether the Spanish changed since it was made (stale).
export async function getTranslation(c, e, entityKey, row, lang = 'en') {
  const t = await c.one('SELECT fields, source, src_hash, auto_state, auto_error, updated_at FROM translations WHERE entity = ? AND entity_id = ? AND lang = ?', [entityKey, row.id, lang]);
  const hash = srcHash(sourceFields(e, row));
  const blank = !!t && !Object.keys(t.fields ?? {}).length; // marker row (or one left by mark(null)): no draft yet
  const lost = t?.auto_state === 'pendiente' && Date.now() - new Date(t.updated_at) > 10 * 60e3; // the server restarted mid-call
  return {
    fields: blank ? null : t?.fields ?? null, source: blank ? null : t?.source ?? null, stale: !!t && !blank && t.src_hash !== hash,
    src_hash: t?.src_hash ?? null, current_hash: hash, updated_at: t?.updated_at ?? null,
    auto: { state: lost ? 'fallo' : t?.auto_state ?? null, error: lost ? 'timeout' : t?.auto_error ?? null },
  };
}

export const putTranslation = (c, entityKey, id, fields, source, hash, lang = 'en') =>
  c.q(`INSERT INTO translations (entity, entity_id, lang, fields, source, src_hash) VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE fields = VALUES(fields), source = VALUES(source), src_hash = VALUES(src_hash), auto_state = NULL, auto_error = NULL`, [entityKey, id, lang, JSON.stringify(fields), source, hash]);

// Calls the provider (never inside a DB transaction) and returns the draft; the caller stores it.
export async function autoTranslate(e, row) {
  if (!translateEnabled()) throw new TranslateError('translate_disabled', 503);
  const src = sourceFields(e, row);
  const items = leaves(src);
  if (!items.length) return { fields: {}, warnings: [], hash: srcHash(src), chars: 0 };
  const chars = items.reduce((n, i) => n + i.text.length, 0);
  const u = await usage();
  if (u.used + chars > u.limit) throw new TranslateError('translate_limit', 429);
  const glossary = await q('SELECT term, mode, en FROM glossary');
  const r = await translateTexts(items.map((i) => i.text), { provider: config.TRANSLATE_PROVIDER, apiKey: config.CLAUDE, model: config.TRANSLATE_MODEL, glossary, baseUrl: config.isProd ? undefined : config.ANTHROPIC_BASE_URL || undefined });
  await q(`INSERT INTO translate_usage (ym, chars, input_tokens, output_tokens, calls) VALUES (?,?,?,?,1)
           ON DUPLICATE KEY UPDATE chars = chars + VALUES(chars), input_tokens = input_tokens + VALUES(input_tokens), output_tokens = output_tokens + VALUES(output_tokens), calls = calls + 1`,
    [month(), chars, r.usage.input, r.usage.output]);
  return { fields: rebuild(src, items, r.texts), warnings: r.warnings.map((w) => ({ term: w.term, text: items[w.index].text.slice(0, 80) })), hash: srcHash(src), chars };
}

// Fire-and-forget after a submit (the caller does not await it). The draft is stored without touching the item's
// status or version: it is under review, and the reviewer approves the English together with the Spanish.
export const translateOnSubmit = (e, key, id, req) => draftOnSubmit({
  enabled: translateEnabled() && !!e.tr?.length,
  read: async () => {
    const row = await one(`SELECT * FROM ${e.table} WHERE id = ?`, [id]);
    return { row, cur: await getTranslation({ one }, e, key, row) };
  },
  translate: (row) => autoTranslate(e, row),
  mark: (state, error = null) => q(`INSERT INTO translations (entity, entity_id, lang, fields, source, auto_state, auto_error) VALUES (?,?,'en','{}','auto',?,?)
    ON DUPLICATE KEY UPDATE auto_state = VALUES(auto_state), auto_error = VALUES(auto_error)`, [key, id, state, error]),
  save: (r) => tx(async (c) => {
    const row = await c.one(`SELECT * FROM ${e.table} WHERE id = ? FOR UPDATE`, [id]);
    const cur = await c.one("SELECT source FROM translations WHERE entity = ? AND entity_id = ? AND lang = 'en'", [key, id]);
    if (!row || srcHash(sourceFields(e, row)) !== r.hash || cur?.source === 'humano') return false; // Spanish or a human draft changed meanwhile
    await putTranslation(c, key, id, r.fields, 'auto', r.hash);
    await audit(c, req, 'translate_auto', key, id, { source: 'auto', chars: r.chars, on: 'submit' });
    return true;
  }),
});
