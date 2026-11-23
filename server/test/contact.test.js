import assert from 'node:assert/strict';
import { test } from 'node:test';
import { arcoDue, contactSchema } from '../lib/contact.js';
import { toCsv } from '../lib/csv.js';

test('ARCO due date: 20 business days, weekends skipped', () => {
  assert.equal(arcoDue('2026-03-02T15:00:00Z'), '2026-03-30'); // Monday + 20 business days = Monday 4 weeks later
  assert.equal(arcoDue('2026-03-07T15:00:00Z'), '2026-04-03'); // Saturday: counting starts Monday (day 1)
  assert.equal(arcoDue('2026-03-06T15:00:00Z', 1), '2026-03-09'); // Friday + 1 = Monday
});

test('contact schema: consent required, subject from the list, phone optional', () => {
  const ok = { name: 'Ana', email: 'A@x.org', subject: 'arco', message: 'Quiero acceso a mis datos', consent_privacy: true };
  assert.equal(contactSchema.parse(ok).email, 'a@x.org');
  assert.doesNotThrow(() => contactSchema.parse({ ...ok, phone: '' }));
  assert.throws(() => contactSchema.parse({ ...ok, consent_privacy: false }));
  assert.throws(() => contactSchema.parse({ ...ok, subject: 'otra-cosa' }));
});

test('CSV: quotes, commas, newlines and formula injection are neutralised', () => {
  const out = toCsv(['a', 'b'], [{ a: 'x,"y"', b: '=HYPERLINK("evil")' }, { a: 'l1\nl2', b: null }]);
  assert.ok(out.includes('"x,""y"""'));
  assert.ok(out.includes("'=HYPERLINK"));
  assert.ok(out.includes('"l1\nl2"'));
});
