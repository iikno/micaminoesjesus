import { createHash } from 'node:crypto';

// ---- leaves: every translatable string of a value, addressed by path, so structure and non-text data are preserved ----
const SKIP_KEYS = new Set(['icon', 'duracionMinutos']); // identifiers and numbers, never prose

export function leaves(value, path = [], out = []) {
  if (typeof value === 'string') { if (value.trim()) out.push({ path, text: value }); }
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, [...path, i], out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (!SKIP_KEYS.has(k)) leaves(v, [...path, k], out);
  return out;
}

// Deep copy of `value` with the string at each leaf path replaced by the matching translation.
export function rebuild(value, items, texts) {
  const out = structuredClone(value);
  items.forEach(({ path }, i) => {
    let o = out;
    for (const k of path.slice(0, -1)) o = o[k];
    o[path.at(-1)] = texts[i];
  });
  return out;
}

export const srcHash = (fields) => createHash('sha256').update(JSON.stringify(fields)).digest('hex');

// ---- glossary: keep = never translate, map = fixed translation ----
const SPECIAL = new Set('.*+?^${}()|[]\\');
const escapeRe = (s) => [...s].map((ch) => (SPECIAL.has(ch) ? `\\${ch}` : ch)).join('');
const hasTerm = (text, term) => new RegExp(String.raw`(?<![\p{L}\p{N}])${escapeRe(term)}(?![\p{L}\p{N}])`, 'u').test(text);

export function buildSystemPrompt(glossary = []) {
  const keep = glossary.filter((g) => g.mode === 'keep').map((g) => `- ${g.term}`);
  const map = glossary.filter((g) => g.mode === 'map' && g.en).map((g) => `- ${g.term} => ${g.en}`);
  return [
    'You translate public website copy of "Mi Camino es Jesús", a Catholic school of New Evangelization in Mexico, from Spanish to English.',
    'Register: warm, direct, faithful to Catholic usage. Do not improve, shorten, explain or add anything.',
    'Input is a JSON array of strings. Reply with ONLY a JSON array of strings: same length, same order, no code fences, no commentary.',
    'Preserve formatting exactly: line breaks, punctuation, quotation marks, leading and trailing spaces, numbers and dates.',
    'Never translate (copy exactly as written): the names of the Dérej (Guibor, Kavod, Mesharét, Simjá, Oz, Jaím), Hebrew words, "XP Lev", "Peregrinos" and "Mi Camino es Jesús".',
    'Scripture: never translate biblical quotations. Leave quoted verses and their references exactly as in the source; a human adds the approved English text later.',
    keep.length ? `Terms to keep exactly as written:\n${keep.join('\n')}` : '',
    map.length ? `Fixed translations (always use these):\n${map.join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
}

// Source `keep` terms that vanished from the output; the caller shows them as warnings for the human reviewer.
export function keepWarnings(sources, outputs, glossary) {
  const keep = glossary.filter((g) => g.mode === 'keep').map((g) => g.term);
  const out = [];
  sources.forEach((s, i) => { for (const t of keep) if (hasTerm(s, t) && !hasTerm(outputs[i] ?? '', t)) out.push({ index: i, term: t }); });
  return out;
}

export class TranslateError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.status = status;
  }
}

// ---- Claude adapter: Messages API over fetch (the project has no SDK dependency; the call is one POST) ----
const API_BASE = 'https://api.anthropic.com';
const BATCH_CHARS = 30000;

function batches(texts) {
  const out = [];
  let cur = [], n = 0;
  texts.forEach((t, i) => {
    if (cur.length && n + t.length > BATCH_CHARS) { out.push(cur); cur = []; n = 0; }
    cur.push(i);
    n += t.length;
  });
  if (cur.length) out.push(cur);
  return out;
}

async function claudeBatch(texts, { apiKey, model, system, fetchImpl, baseUrl = API_BASE }) {
  const res = await fetchImpl(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    // No thinking/temperature: translation needs neither, and low effort keeps the small model fast and cheap.
    body: JSON.stringify({ model, max_tokens: 16000, system, output_config: { effort: 'low' }, messages: [{ role: 'user', content: JSON.stringify(texts) }] }),
  });
  if (!res.ok) throw new TranslateError(res.status === 429 ? 'provider_rate_limited' : 'provider_error');
  const body = await res.json();
  if (body.stop_reason === 'max_tokens' || body.stop_reason === 'refusal') throw new TranslateError(`provider_${body.stop_reason}`);
  const raw = (body.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  let parsed;
  try { parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { throw new TranslateError('provider_bad_output'); }
  if (!Array.isArray(parsed) || parsed.length !== texts.length || parsed.some((x) => typeof x !== 'string')) throw new TranslateError('provider_bad_output');
  return { texts: parsed, usage: { input: body.usage?.input_tokens ?? 0, output: body.usage?.output_tokens ?? 0 } };
}

export const PROVIDERS = { claude: claudeBatch };

// translateTexts(texts[], { provider, apiKey, model, glossary, fetchImpl }) -> { texts[], warnings[], usage }
export async function translateTexts(texts, { provider = 'claude', apiKey, model, glossary = [], fetchImpl = globalThis.fetch, baseUrl }) {
  if (!apiKey) throw new TranslateError('translate_disabled', 503);
  const run = PROVIDERS[provider] ?? (() => { throw new TranslateError('unknown_provider', 500); });
  const system = buildSystemPrompt(glossary);
  const out = new Array(texts.length);
  const usage = { input: 0, output: 0 };
  for (const idx of batches(texts)) {
    const r = await run(idx.map((i) => texts[i]), { apiKey, model, system, fetchImpl, baseUrl });
    idx.forEach((i, j) => { out[i] = r.texts[j]; });
    usage.input += r.usage.input;
    usage.output += r.usage.output;
  }
  return { texts: out, warnings: keepWarnings(texts, out, glossary), usage };
}
