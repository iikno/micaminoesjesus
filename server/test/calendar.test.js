import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCalendar, formatRange } from '../lib/calendar.js';

test('formatRange', () => {
  assert.equal(formatRange('2027-03-21', '2027-03-27'), '21 a 27 mar 2027');
  assert.equal(formatRange('2027-02-28', '2027-03-02'), '28 feb a 2 mar 2027');
  assert.equal(formatRange('2026-11-29', null), '29 nov 2026');
  assert.equal(formatRange('2026-12-30', '2027-01-02'), '30 dic 2026 a 2 ene 2027');
});

test('buildCalendar derives from sessions + pilgrimages, drops the past, sorts, shows Entrada libre', () => {
  const out = buildCalendar({
    today: '2027-01-01',
    retreats: new Map([[7, { slug: 'sanson', title: 'Sansón', derej_slug: 'guibor' }]]),
    derej: new Map([['guibor', { name: 'Dérej Guibor' }]]),
    sessions: [
      { id: 1, retreat_id: 7, starts_on: '2027-04-01', ends_on: '2027-04-03', registration_mode: 'own', cal_state: 'confirmada', highlight: false },
      { id: 2, retreat_id: null, title: 'Pasado', starts_on: '2026-05-01', registration_mode: 'own', cal_state: 'lista' },
      { id: 3, title: 'Taller abierto', note: 'Nota', starts_on: '2027-02-01', date_text: 'Feb 2027', registration_mode: 'none', cal_state: 'por-confirmar' },
    ],
    pilgrimages: [
      { id: 9, slug: 'camino', title: 'Camino', place: 'Santiago', starts_on: '2027-03-01', ends_on: '2027-03-09', registration_mode: 'own', state: 'abierta' },
      { id: 10, slug: 'x', title: 'Cancelada', starts_on: '2027-03-01', state: 'cancelada' },
    ],
  });
  assert.deepEqual(out.map((i) => i.titulo), ['Taller abierto', 'Camino', 'Sansón']);
  assert.equal(out[0].nota, 'Nota · Entrada libre');
  assert.equal(out[0].cuando, 'Feb 2027');
  assert.equal(out[2].nota, 'Dérej Guibor');
  assert.equal(out[2].cuando, '1 a 3 abr 2027');
});
