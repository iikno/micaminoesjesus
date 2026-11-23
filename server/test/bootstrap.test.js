import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decideBootstrap } from '../lib/bootstrap.js';

const ok = { user: 'Admin@Example.org', pass: 'una-clave-larga-123', adminExists: false, isProd: true };

test('no admin yet and valid vars: create (email lowercased)', () => {
  assert.deepEqual(decideBootstrap(ok), { action: 'create', reason: 'no_admin', email: 'admin@example.org' });
});

test('an admin already exists: skip, even with bad vars (env never overwrites)', () => {
  assert.equal(decideBootstrap({ ...ok, adminExists: true }).reason, 'admin_exists');
  assert.equal(decideBootstrap({ ...ok, adminExists: true, pass: 'x' }).action, 'skip');
});

test('not configured: skip quietly', () => {
  assert.equal(decideBootstrap({ ...ok, user: '', pass: '' }).reason, 'not_configured');
});

test('weak or missing password, or bad email: error in production, skip elsewhere; messages name variables, not values', () => {
  for (const bad of [{ pass: 'corta' }, { pass: '' }, { user: 'no-es-correo' }, { user: '' }]) {
    const r = decideBootstrap({ ...ok, ...bad });
    assert.equal(r.action, 'error');
    assert.match(r.reason, /ADMIN_(USER|PASS)/);
    assert.ok(!r.reason.includes(bad.pass || '@@'));
    assert.equal(decideBootstrap({ ...ok, ...bad, isProd: false }).action, 'skip');
  }
});
