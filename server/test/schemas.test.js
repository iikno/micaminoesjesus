import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ENTITIES, toColumns } from '../lib/entities.js';
import * as s from '../lib/schemas.js';

const ok = (schema, v) => assert.ok(schema.safeParse(v).success, JSON.stringify(schema.safeParse(v).error?.issues));
const bad = (schema, v) => assert.ok(!schema.safeParse(v).success);

test('retreat: required fields, enums, unknown keys rejected', () => {
  const base = { slug: 'retiro-uno', derej_slug: 'jaim', tipo: 'retiro', title: 'Uno' };
  ok(s.retreat, base);
  bad(s.retreat, { ...base, tipo: 'otro' });
  bad(s.retreat, { ...base, slug: 'Con Espacios' });
  bad(s.retreat, { ...base, title: '' });
  bad(s.retreat, { ...base, status: 'publicado' }); // status only changes through the review endpoints
  bad(s.retreat, { ...base, published_snapshot: {} });
});

test('session: needs a retreat or a title, dates in order, registration_mode none|own', () => {
  ok(s.session, { retreat_id: 1, starts_on: '2027-03-21', ends_on: '2027-03-27', registration_mode: 'own' });
  ok(s.session, { title: 'Libre', starts_on: '2027-03-21', registration_mode: 'none' });
  bad(s.session, { starts_on: '2027-03-21' });
  bad(s.session, { title: 'x', starts_on: '2027-03-21', ends_on: '2027-03-20' });
  bad(s.session, { title: 'x', starts_on: '2027-3-21' });
  bad(s.session, { title: 'x', starts_on: '2027-03-21', registration_mode: 'maybe' });
});

test('patch schemas are partial and apply no defaults, so omitted fields stay untouched', () => {
  assert.deepEqual(ENTITIES.sessions.patch.parse({ highlight: true }), { highlight: true });
  assert.deepEqual(ENTITIES.retreats.patch.parse({}), {});
  bad(ENTITIES.retreats.patch, { tipo: 'otro' });
});

test('verse and pilgrimage', () => {
  ok(s.verse, { ref: 'Juan 3,16', text_es: 'Porque...', text_en: 'For...', version_en: 'RSV-2CE' });
  bad(s.verse, { ref: 'Juan 3,16' });
  ok(s.pilgrimage, { slug: 'tierra-santa', title: 'Tierra Santa', itinerary: [{ day: 1 }] });
  bad(s.pilgrimage, { slug: 'x', title: 'Mal', state: 'cerrada-y-media' });
});

test('auth payloads: password >= 12, email normalized, invite needs a valid role', () => {
  assert.equal(s.login.parse({ email: 'A@B.org', password: 'x' }).email, 'a@b.org');
  ok(s.setPassword, { token: 'a'.repeat(43), password: 'a-long-enough-pass' });
  bad(s.setPassword, { token: 'a'.repeat(43), password: 'short' });
  ok(s.invite, { email: 'x@y.org', name: 'X', role: 'asesor' });
  bad(s.invite, { email: 'x@y.org', name: 'X', role: 'root' });
  bad(s.rejection, { comment: '' });
  ok(s.rejection, { comment: 'Falta algo' });
});

test('toColumns serializes JSON columns and publish_at', () => {
  const c = toColumns(ENTITIES.retreats, { body: { a: 1 }, season_secondary: ['pascua'], publish_at: '2027-01-01T00:00:00Z', title: 'T' });
  assert.equal(c.body, '{"a":1}');
  assert.equal(c.season_secondary, '["pascua"]');
  assert.ok(c.publish_at instanceof Date);
  assert.equal(c.title, 'T');
});
