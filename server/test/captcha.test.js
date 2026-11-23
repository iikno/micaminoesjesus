import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyCaptcha } from '../lib/captcha.js';

const mock = (body) => async () => ({ json: async () => body });
const run = (body, extra = {}) => verifyCaptcha({ secret: 's', token: 't', action: 'register', fetchFn: mock(body), ...extra });

test('accepts a good score for the right action', async () => {
  assert.deepEqual(await run({ success: true, score: 0.9, action: 'register' }), { ok: true, score: 0.9, reason: null });
});

test('rejects low score, wrong action, failed token and missing token', async () => {
  assert.equal((await run({ success: true, score: 0.3, action: 'register' })).reason, 'low_score');
  assert.equal((await run({ success: true, score: 0.9, action: 'contact' })).reason, 'action');
  assert.equal((await run({ success: false })).reason, 'rejected');
  assert.equal((await verifyCaptcha({ secret: 's', token: '', action: 'register', fetchFn: mock({}) })).reason, 'missing');
});

test('threshold is configurable and the call goes to the given URL, never to Google', async () => {
  assert.equal((await run({ success: true, score: 0.3, action: 'register' }, { minScore: 0.2 })).ok, true);
  const calls = [];
  await verifyCaptcha({ secret: 's', token: 't', action: 'a', ip: '1.2.3.4', url: 'http://fake/verify', fetchFn: async (u, o) => { calls.push([u, o.body]); return { json: async () => ({}) }; } });
  assert.equal(calls[0][0], 'http://fake/verify');
  assert.match(calls[0][1], /remoteip=1.2.3.4/);
});

test('a network failure is "unavailable", not a pass', async () => {
  const r = await verifyCaptcha({ secret: 's', token: 't', action: 'a', fetchFn: async () => { throw new Error('down'); } });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'unavailable');
});
