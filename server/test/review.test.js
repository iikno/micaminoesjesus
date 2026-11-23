import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FlowError, nextStatus, reminderDue } from '../lib/review.js';

const H = 3600e3;

test('happy path: borrador -> en_revision -> publicado', () => {
  assert.equal(nextStatus('borrador', 'submit'), 'en_revision');
  assert.equal(nextStatus('en_revision', 'approve'), 'publicado');
});

test('approve with a future publish_at schedules instead of publishing', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  assert.equal(nextStatus('en_revision', 'approve', { now, publishAt: new Date('2026-02-01T00:00:00Z') }), 'programado');
  assert.equal(nextStatus('en_revision', 'approve', { now, publishAt: new Date('2025-12-01T00:00:00Z') }), 'publicado');
});

test('reject needs a comment; rechazado can be edited back to borrador and resubmitted', () => {
  assert.throws(() => nextStatus('en_revision', 'reject', { comment: '  ' }), (e) => e instanceof FlowError && e.status === 400);
  assert.equal(nextStatus('en_revision', 'reject', { comment: 'Falta el resumen' }), 'rechazado');
  assert.equal(nextStatus('rechazado', 'edit'), 'borrador');
  assert.equal(nextStatus('rechazado', 'submit'), 'en_revision');
});

test('illegal transitions are refused', () => {
  assert.throws(() => nextStatus('borrador', 'approve'), FlowError);
  assert.throws(() => nextStatus('publicado', 'submit'), FlowError);
  assert.throws(() => nextStatus('en_revision', 'submit'), FlowError);
  assert.throws(() => nextStatus('en_revision', 'edit'), FlowError); // locked while under review
  assert.throws(() => nextStatus('publicado', 'reject', { comment: 'x' }), FlowError);
  assert.equal(nextStatus('publicado', 'edit'), 'borrador'); // the live copy is protected by its snapshot
});

test('reminders: due after 48h, then every 48h from the last one', () => {
  const created = new Date('2026-01-01T00:00:00Z');
  const at = (h) => new Date(created.getTime() + h * H);
  assert.equal(reminderDue({ created_at: created, last_reminded_at: null }, at(47)), false);
  assert.equal(reminderDue({ created_at: created, last_reminded_at: null }, at(48)), true);
  assert.equal(reminderDue({ created_at: created, last_reminded_at: at(48) }, at(95)), false);
  assert.equal(reminderDue({ created_at: created, last_reminded_at: at(48) }, at(96)), true);
});

import { planApproval, promotionDue } from '../lib/review.js';

test('planApproval: future edit of live content goes to pending, everything else is live', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  const future = '2026-02-01T00:00:00Z';
  assert.deepEqual(planApproval({ publish_at: future, published_snapshot: { a: 1 } }, now), { slot: 'pending', from: new Date(future) });
  assert.deepEqual(planApproval({ publish_at: future, published_snapshot: null }, now), { slot: 'live', from: new Date(future) });
  assert.deepEqual(planApproval({ publish_at: null, published_snapshot: { a: 1 } }, now), { slot: 'live', from: now });
  assert.deepEqual(planApproval({ publish_at: '2025-12-01T00:00:00Z', published_snapshot: { a: 1 } }, now), { slot: 'live', from: now });
});

test('promotionDue only when a pending snapshot exists and its time passed', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  assert.ok(promotionDue({ pending_snapshot: {}, pending_from: '2025-12-31T00:00:00Z' }, now));
  assert.ok(!promotionDue({ pending_snapshot: {}, pending_from: '2026-01-02T00:00:00Z' }, now));
  assert.ok(!promotionDue({ pending_snapshot: null, pending_from: '2025-12-31T00:00:00Z' }, now));
});
