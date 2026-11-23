import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatRange } from '../lib/calendar.js';
import { fallbackDeep, localize, normLang } from '../lib/i18n.js';

const snap = {
  id: 1, title: 'Título', summary: 'Resumen',
  body: { temas: [{ titulo: 'Uno', resumen: 'R1' }, { titulo: 'Dos', resumen: 'R2' }] },
  en: { title: 'Title', summary: '', body: { temas: [{ titulo: 'One', resumen: '' }] } },
};

test('Spanish never sees the en block; English overrides field by field and falls back to Spanish', () => {
  const es = localize(snap, 'es');
  assert.equal(es.title, 'Título');
  assert.ok(!('en' in es));
  const en = localize(snap, 'en');
  assert.equal(en.title, 'Title');
  assert.equal(en.summary, 'Resumen'); // blank English leaf -> Spanish
  assert.equal(en.body.temas[0].titulo, 'One');
  assert.equal(en.body.temas[0].resumen, 'R1');
  assert.ok(!('en' in en));
});

test('items without an English version are served in Spanish', () => {
  assert.deepEqual(localize({ id: 2, title: 'Solo ES' }, 'en'), { id: 2, title: 'Solo ES' });
  assert.equal(fallbackDeep('es', null), 'es');
  assert.equal(normLang('fr'), 'es');
  assert.equal(normLang('en'), 'en');
});

test('English date ranges', () => {
  assert.equal(formatRange('2027-03-21', '2027-03-27', 'en'), '21 to 27 Mar 2027');
});
