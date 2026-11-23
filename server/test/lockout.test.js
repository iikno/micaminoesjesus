import assert from 'node:assert/strict';
import { test } from 'node:test';
import { afterFailure, isLocked } from '../lib/lockout.js';

const now = new Date('2026-01-01T12:00:00Z');

test('failures 1-4 only count; the 5th locks for 15 minutes and resets the counter', () => {
  let u = { failed_logins: 0, locked_until: null };
  for (let i = 1; i <= 4; i++) {
    u = { ...u, ...afterFailure(u, now) };
    assert.equal(u.failed_logins, i);
    assert.equal(isLocked(u, now), false);
  }
  u = { ...u, ...afterFailure(u, now) };
  assert.equal(u.failed_logins, 0);
  assert.equal(u.locked_until.getTime(), now.getTime() + 15 * 60e3);
  assert.equal(isLocked(u, now), true);
  assert.equal(isLocked(u, new Date(now.getTime() + 14 * 60e3)), true);
  assert.equal(isLocked(u, new Date(now.getTime() + 15 * 60e3 + 1)), false);
});
