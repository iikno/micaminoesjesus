import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSystemPrompt, draftOnSubmit, keepWarnings, leaves, rebuild, srcHash, translateTexts, TranslateError } from '../lib/translate.js';

const GLOSSARY = [
  { term: 'Dérej', mode: 'keep', en: null }, { term: 'XP Lev', mode: 'keep', en: null },
  { term: 'Hora Santa', mode: 'map', en: 'Holy Hour' },
];
const reply = (texts, extra = {}) => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(texts) }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 }, ...extra }) });

test('system prompt carries the fixed rules and both glossary modes', () => {
  const p = buildSystemPrompt(GLOSSARY);
  assert.match(p, /Dérej \(Guibor, Kavod/);
  assert.match(p, /never translate biblical quotations/i);
  assert.match(p, /Terms to keep exactly as written:\n- Dérej\n- XP Lev/);
  assert.match(p, /Hora Santa => Holy Hour/);
  assert.doesNotMatch(buildSystemPrompt([]), /Terms to keep/);
});

test('leaves and rebuild keep structure, skip icons and numbers, ignore blanks', () => {
  const body = { bloques: [{ title: 'Uno', text: 'Dos' }], fichaTecnica: [{ icon: 'clock', label: 'Duración', value: '2 días' }], cronograma: [{ bloque: 'Misa', duracionMinutos: 60 }], x: ' ', n: null };
  const items = leaves(body);
  assert.deepEqual(items.map((i) => i.text), ['Uno', 'Dos', 'Duración', '2 días', 'Misa']);
  const out = rebuild(body, items, items.map((i) => i.text.toUpperCase()));
  assert.equal(out.fichaTecnica[0].icon, 'clock');
  assert.equal(out.cronograma[0].duracionMinutos, 60);
  assert.equal(out.bloques[0].text, 'DOS');
  assert.equal(body.bloques[0].text, 'Dos'); // input untouched
  assert.equal(srcHash({ a: 1 }), srcHash({ a: 1 }));
  assert.notEqual(srcHash({ a: 1 }), srcHash({ a: 2 }));
});

test('keepWarnings flags a keep term that disappeared, by whole word', () => {
  const w = keepWarnings(['Retiro de XP Lev', 'Dérej Oz', 'Sin nada'], ['XP Lev retreat', 'Derej Oz', 'Nothing'], GLOSSARY);
  assert.deepEqual(w, [{ index: 1, term: 'Dérej' }]);
});

test('translateTexts calls the Messages API with key, model and glossary (fetch mocked)', async () => {
  let seen;
  const fetchImpl = async (url, init) => { seen = { url, init, body: JSON.parse(init.body) }; return reply(['Holy Hour of XP Lev']); };
  const r = await translateTexts(['Hora Santa de XP Lev'], { apiKey: 'test-key', model: 'claude-haiku-5-5', glossary: GLOSSARY, fetchImpl });
  assert.equal(seen.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(seen.init.headers['x-api-key'], 'test-key');
  assert.equal(seen.init.headers['anthropic-version'], '2023-06-01');
  assert.equal(seen.body.model, 'claude-haiku-5-5');
  assert.match(seen.body.system, /Hora Santa => Holy Hour/);
  assert.equal(seen.body.messages[0].content, JSON.stringify(['Hora Santa de XP Lev']));
  assert.deepEqual(r.texts, ['Holy Hour of XP Lev']);
  assert.deepEqual(r.usage, { input: 10, output: 5 });
  assert.deepEqual(r.warnings, []);
});

test('translateTexts is disabled without a key, and rejects malformed or failed provider answers', async () => {
  await assert.rejects(translateTexts(['x'], { fetchImpl: async () => assert.fail('must not be called') }), (e) => e instanceof TranslateError && e.message === 'translate_disabled' && e.status === 503);
  const opts = (fetchImpl) => ({ apiKey: 'k', model: 'm', fetchImpl });
  await assert.rejects(translateTexts(['a', 'b'], opts(async () => reply(['only one']))), { message: 'provider_bad_output' });
  await assert.rejects(translateTexts(['a'], opts(async () => ({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'not json' }] }) }))), { message: 'provider_bad_output' });
  await assert.rejects(translateTexts(['a'], opts(async () => ({ ok: false, status: 429 }))), { message: 'provider_rate_limited' });
  await assert.rejects(translateTexts(['a'], opts(async () => reply(['A'], { stop_reason: 'max_tokens' }))), { message: 'provider_max_tokens' });
});

test('long inputs are split in batches and reassembled in order; code fences are tolerated', async () => {
  const texts = ['a'.repeat(20000), 'b'.repeat(20000), 'c'];
  let calls = 0;
  const fetchImpl = async (_u, init) => {
    calls++;
    const sent = JSON.parse(JSON.parse(init.body).messages[0].content);
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: '```json\n' + JSON.stringify(sent.map((t) => t.toUpperCase())) + '\n```' }], usage: {} }) };
  };
  const r = await translateTexts(texts, { apiKey: 'k', model: 'm', fetchImpl });
  assert.equal(calls, 2);
  assert.deepEqual(r.texts, texts.map((t) => t.toUpperCase()));
});

// ---- English draft prepared when an item is sent to review ----
const sub = (over = {}) => {
  const calls = [];
  const deps = {
    enabled: true,
    read: async () => ({ row: { id: 1 }, cur: { fields: null, source: null, stale: false } }),
    translate: async () => { calls.push('translate'); return { fields: { title: 'Holy Hour' }, hash: 'h' }; },
    mark: async (state, code) => { calls.push(`mark:${state}${code ? `:${code}` : ''}`); },
    save: async () => { calls.push('save'); return true; },
    ...over,
  };
  return { deps, calls };
};

test('submit: a new draft is marked pending, translated and saved', async () => {
  const { deps, calls } = sub();
  assert.equal(await draftOnSubmit(deps), 'saved');
  assert.deepEqual(calls, ['mark:pendiente', 'translate', 'save']);
});

test('submit: a failing provider is recorded and never raised, so the send still works', async () => {
  const { deps, calls } = sub({ translate: async () => { throw new TranslateError('provider_error'); } });
  assert.equal(await draftOnSubmit(deps), 'failed');
  assert.deepEqual(calls, ['mark:pendiente', 'mark:fallo:provider_error']);
  const boom = sub({ translate: async () => { throw new Error('socket hang up'); }, mark: async () => { throw new Error('db down'); } });
  assert.equal(await draftOnSubmit(boom.deps), 'failed'); // even the bookkeeping failing does not escape
});

test('submit: nothing happens without the API key, and a hand-written or fresh draft is never touched', async () => {
  const off = sub({ enabled: false });
  assert.equal(await draftOnSubmit(off.deps), 'off');
  assert.deepEqual(off.calls, []);
  const manual = sub({ read: async () => ({ row: {}, cur: { fields: { title: 'A mano' }, source: 'humano', stale: true } }) });
  assert.equal(await draftOnSubmit(manual.deps), 'manual');
  assert.deepEqual(manual.calls, []); // no provider call, no write, not even when the Spanish changed since
  const fresh = sub({ read: async () => ({ row: {}, cur: { fields: { title: 'Ya' }, source: 'auto', stale: false } }) });
  assert.equal(await draftOnSubmit(fresh.deps), 'cached');
  assert.deepEqual(fresh.calls, []);
  const stale = sub({ read: async () => ({ row: {}, cur: { fields: { title: 'Viejo' }, source: 'auto', stale: true } }) });
  assert.equal(await draftOnSubmit(stale.deps), 'saved'); // an old machine draft is refreshed
});

test('submit: if a person wrote the English meanwhile, the machine draft is dropped and the marker cleared', async () => {
  const { deps, calls } = sub({ save: async () => false });
  assert.equal(await draftOnSubmit(deps), 'skipped');
  assert.deepEqual(calls, ['mark:pendiente', 'translate', 'mark:null']);
});

test('getTranslation: a marker row with empty fields is "no translation", whatever its auto_state', async () => {
  Object.assign(process.env, { DB_HOST: 'x', DB_USER: 'x', DB_PASS: 'x', DB_NAME: 'x', SESSION_SECRET: 'x'.repeat(40), MAIL_DISABLED: '1' }); // config is validated on import; no DB is touched
  const { getTranslation } = await import('../lib/translations.js');
  const e = { tr: ['title'] };
  for (const auto_state of [null, 'pendiente', 'fallo']) {
    const c = { one: async () => ({ fields: {}, source: 'auto', src_hash: null, auto_state, auto_error: null, updated_at: new Date() }) };
    const t = await getTranslation(c, e, 'x', { id: 1, title: 'Hola' });
    assert.equal(t.fields, null);
    assert.equal(t.source, null);
    assert.equal(t.stale, false);
  }
  const real = { one: async () => ({ fields: { title: 'Hi' }, source: 'auto', src_hash: 'zz', auto_state: null, auto_error: null, updated_at: new Date() }) };
  assert.deepEqual((await getTranslation(real, e, 'x', { id: 1, title: 'Hola' })).fields, { title: 'Hi' });
});
