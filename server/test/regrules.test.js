import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as R from '../lib/regrules.js';

const H = 3600e3;
const base = { kind: 'session', event_id: 1, name: 'Ana', phone: '2221234567', email: 'A@x.org', emergency: { name: 'Luz', phone: '2227654321' }, consent_privacy: true };

test('capacity: confirmed while there are spots, waitlist when full, null cupo is unlimited', () => {
  assert.equal(R.decide(2, 1), 'confirmado');
  assert.equal(R.decide(2, 2), 'lista_espera');
  assert.equal(R.decide(0, 0), 'lista_espera');
  assert.equal(R.decide(null, 999), 'confirmado');
  assert.equal(R.freeSpots(5, 7), 0);
  assert.equal(R.freeSpots(null, 7), Infinity);
});

test('waitlist order is verification time, then id; promotion takes only the free spots', () => {
  const wl = [{ id: 3, queue_at: '2026-01-02T10:00:00Z' }, { id: 1, queue_at: '2026-01-02T09:00:00Z' }, { id: 2, queue_at: '2026-01-02T09:00:00Z' }];
  assert.deepEqual(R.nextInLine(wl, 2).map((r) => r.id), [1, 2]);
  assert.equal(R.nextInLine(wl, 0).length, 0);
  assert.equal(R.nextInLine(wl, Infinity).length, 3);
  assert.equal(R.position(wl, 3), 3);
});

test('state machine: allowed and forbidden transitions', () => {
  assert.deepEqual(R.transition('pendiente_verificacion', 'verify'), { ok: true, to: null }); // target comes from decide()
  assert.equal(R.transition('lista_espera', 'offer').to, 'oferta');
  assert.equal(R.transition('oferta', 'accept').to, 'confirmado');
  assert.equal(R.transition('oferta', 'expire_offer').to, 'expirado');
  assert.equal(R.transition('confirmado', 'cancel').to, 'cancelado');
  assert.equal(R.transition('cancelado', 'cancel').ok, false);
  assert.equal(R.transition('expirado', 'confirm').ok, false);
  assert.equal(R.transition('confirmado', 'accept').ok, false);
  assert.equal(R.transition('confirmado', 'nope').ok, false);
});

test('timing: reminder at 24h (once), expiry at 72h, offer at its deadline', () => {
  const now = new Date('2026-03-10T12:00:00Z');
  const pend = (h, extra = {}) => ({ status: 'pendiente_verificacion', created_at: new Date(now - h * H), ...extra });
  assert.equal(R.reminderDue(pend(23), now), false);
  assert.equal(R.reminderDue(pend(24), now), true);
  assert.equal(R.reminderDue(pend(30, { verify_reminded_at: now }), now), false);
  assert.equal(R.verifyExpired(pend(71), now), false);
  assert.equal(R.verifyExpired(pend(72), now), true);
  assert.equal(R.verifyExpired({ status: 'confirmado', created_at: new Date(now - 99 * H) }, now), false);
  assert.equal(R.offerExpired({ status: 'oferta', offer_expires_at: new Date(now - 1) }, now), true);
  assert.equal(R.offerExpired({ status: 'oferta', offer_expires_at: new Date(+now + 1) }, now), false);
});

test('retention: 30 days for sensitive data, 90 for the registration, from the event end', () => {
  const now = new Date('2026-06-30T00:00:00Z');
  assert.equal(R.retentionCutoff(now, R.SENSITIVE_DAYS), '2026-05-31'); // events ending on/before this date are due
  assert.equal(R.retentionCutoff(now, R.REG_DAYS), '2026-04-01');
  assert.equal(R.monthsAgo(new Date('2026-06-15T00:00:00Z'), 12).toISOString().slice(0, 10), '2025-06-15');
  assert.equal(R.monthsAgo(new Date('2026-06-15T00:00:00Z'), R.AUDIT_MONTHS).toISOString().slice(0, 10), '2024-06-15');
});

test('roles: scope per kind; asesor reads but never manages (decrypt/export)', () => {
  assert.equal(R.canRead('pastoral', 'session'), true);
  assert.equal(R.canRead('pastoral', 'pilgrimage'), false);
  assert.equal(R.canManage('peregrinacion', 'pilgrimage'), true);
  assert.equal(R.canManage('peregrinacion', 'session'), false);
  assert.equal(R.canRead('asesor', 'session'), true);
  assert.equal(R.canManage('asesor', 'session'), false);
  assert.equal(R.canManage('admin', 'pilgrimage'), true);
});

test('adults: the base form is enough; email lowercased; guardian field is refused', () => {
  const ok = R.registrationSchema().parse(base);
  assert.equal(ok.email, 'a@x.org');
  assert.throws(() => R.registrationSchema().parse({ ...base, guardian: { name: 'X', phone: '2221112222' } }));
  assert.throws(() => R.registrationSchema().parse({ ...base, consent_privacy: false }));
});

test('Simja: a guardian is required', () => {
  const s = R.registrationSchema({ derej: 'simja' });
  assert.throws(() => s.parse(base));
  assert.doesNotThrow(() => s.parse({ ...base, guardian: { name: 'Mama', phone: '2221112222' } }));
});

test('Oz: must say if under 18; under 18 needs the permission checkbox', () => {
  const s = R.registrationSchema({ derej: 'oz' });
  assert.throws(() => s.parse(base));
  assert.throws(() => s.parse({ ...base, under18: true }));
  assert.throws(() => s.parse({ ...base, under18: true, permission: false }));
  assert.doesNotThrow(() => s.parse({ ...base, under18: true, permission: true }));
  assert.doesNotThrow(() => s.parse({ ...base, under18: false }));
});

test('allergies: refused while disabled; need their own explicit consent when enabled', () => {
  assert.throws(() => R.registrationSchema().parse({ ...base, allergies: 'nueces' }));
  const on = R.registrationSchema({ allergiesEnabled: true });
  assert.throws(() => on.parse({ ...base, allergies: 'nueces' }));
  assert.throws(() => on.parse({ ...base, allergies: 'nueces', consent_health: false }));
  assert.doesNotThrow(() => on.parse({ ...base, allergies: 'nueces', consent_health: true }));
  assert.doesNotThrow(() => on.parse({ ...base, allergies: '' }));
});

test('emails exist in both languages for every step', () => {
  for (const l of ['es', 'en']) {
    for (const k of Object.keys(R.MAILS.es)) {
      const [subject, text] = R.MAILS[l][k]('Ana', 'Retiro', 'https://x/y', 2);
      assert.ok(subject && text.includes('Retiro'));
    }
  }
});
