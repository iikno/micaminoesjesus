import assert from 'node:assert/strict';
import { test } from 'node:test';
import { can } from '../lib/perm.js';
import { canDecide } from '../lib/review.js';

test('pastoral and peregrinacion are separate scopes', () => {
  assert.ok(can('pastoral', 'retreats', 'write'));
  assert.ok(!can('pastoral', 'pilgrimages', 'read'));
  assert.ok(can('peregrinacion', 'pilgrimages', 'write'));
  assert.ok(!can('peregrinacion', 'retreats', 'read'));
  assert.ok(!can('pastoral', 'team', 'write'));
});

test('asesor sees, approves and fixes typos everywhere, but never edits', () => {
  for (const r of ['retreats', 'sessions', 'pilgrimages', 'team', 'verses']) {
    assert.ok(can('asesor', r, 'read') && can('asesor', r, 'approve') && can('asesor', r, 'quick_fix'));
    assert.ok(!can('asesor', r, 'write'));
  }
  assert.ok(!can('asesor', 'users', 'read'));
});

test('only admin manages users; writers cannot approve', () => {
  assert.ok(can('admin', 'users', 'write'));
  for (const role of ['asesor', 'pastoral', 'peregrinacion']) assert.ok(!can(role, 'users', 'read'));
  assert.ok(!can('pastoral', 'retreats', 'approve'));
  assert.ok(!can('unknown-role', 'retreats', 'read'));
});

test('only admin approves their own submission', () => {
  assert.ok(canDecide({ id: 1, role: 'admin' }, 'retreats', 1)); // admin may decide their own
  assert.ok(!canDecide({ id: 3, role: 'asesor' }, 'pilgrimages', 3));
  assert.ok(canDecide({ id: 2, role: 'admin' }, 'retreats', 1));
  assert.ok(canDecide({ id: 3, role: 'asesor' }, 'pilgrimages', 1));
  assert.ok(!canDecide({ id: 4, role: 'pastoral' }, 'retreats', 1));
});
