import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { decrypt, encrypt, parseKey } from '../lib/crypto.js';

const key = randomBytes(32);

test('round trip, random IV, ciphertext hides the plaintext', () => {
  const v = { emergency: { name: 'Luz', phone: '222' }, allergies: 'cacahuate ñ' };
  const a = encrypt(key, v), b = encrypt(key, v);
  assert.notEqual(a, b);
  assert.ok(!a.includes('cacahuate'));
  assert.deepEqual(decrypt(key, a), v);
});

test('a wrong key or a tampered blob fails (GCM authenticates)', () => {
  const blob = encrypt(key, 'secreto');
  assert.throws(() => decrypt(randomBytes(32), blob));
  const parts = blob.split('.');
  parts[3] = Buffer.from('xxxxxxxxx').toString('base64url');
  assert.throws(() => decrypt(key, parts.join('.')));
});

test('key parsing: hex and base64 of 32 bytes, nothing else', () => {
  assert.equal(parseKey(key.toString('hex')).length, 32);
  assert.equal(parseKey(key.toString('base64')).length, 32);
  assert.equal(parseKey(''), null);
  assert.throws(() => parseKey('abcd'));
});
