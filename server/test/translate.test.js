import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSystemPrompt, keepWarnings, leaves, rebuild, srcHash, translateTexts, TranslateError } from '../lib/translate.js';

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
