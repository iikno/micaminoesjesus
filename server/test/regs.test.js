import assert from 'node:assert/strict';
import { test } from 'node:test';
import { capacity, mailtoLink, telLink, waLink, waNumber } from '../../src/panel/regs.js';

test('waNumber: 10 Mexican digits get 52, "+" keeps its country, anything doubtful is null', () => {
  assert.equal(waNumber('55 1234 5678'), '525512345678');
  assert.equal(waNumber('(55) 1234-5678'), '525512345678');
  assert.equal(waNumber('+1 (415) 555-2671'), '14155552671');
  assert.equal(waNumber('+52 55 1234 5678'), '525512345678');
  for (const bad of ['', null, '12345', '044 55 1234 5678', '0052 55 1234 5678', '525512345678', '1234567890', '55+1234567', '+0 55 1234 5678', '+12', '+1234567890123456', '55 1234 56ab', '555.123.45678']) assert.equal(waNumber(bad), null, String(bad));
  assert.equal(waLink('5512345678'), 'https://wa.me/525512345678');
  assert.equal(waLink('abc'), null);
});

test('telLink keeps a leading + and needs enough digits', () => {
  assert.equal(telLink('+52 55 1234 5678'), 'tel:+525512345678');
  assert.equal(telLink('(55) 1234-5678'), 'tel:5512345678');
  assert.equal(telLink('123'), null);
});

test('mailtoLink encodes subject and body, keeps the address readable', () => {
  assert.equal(mailtoLink('ana@correo.mx', 'Re: Retiros & talleres', 'Hola Ana,\n\n'), 'mailto:ana@correo.mx?subject=Re%3A%20Retiros%20%26%20talleres&body=Hola%20Ana%2C%0A%0A');
  assert.equal(mailtoLink('a+b@x.mx'), 'mailto:a%2Bb@x.mx');
});

test('capacity: text, bar width, full, over and no limit', () => {
  assert.deepEqual(capacity(18, 25), { text: '18 de 25 lugares', pct: 72, full: false, over: false });
  assert.deepEqual(capacity(25, 25), { text: '25 de 25 lugares · lleno', pct: 100, full: true, over: false });
  assert.deepEqual(capacity(27, 25), { text: '27 de 25 lugares (se pasó del cupo)', pct: 100, full: true, over: true });
  assert.deepEqual(capacity(0, 0), { text: '0 de 0 lugares · lleno', pct: 100, full: true, over: false });
  assert.deepEqual(capacity(3, null), { text: '3 lugares ocupados · sin límite de lugares', pct: null, full: false, over: false });
  assert.equal(capacity(1, null).text, '1 lugar ocupado · sin límite de lugares');
});
