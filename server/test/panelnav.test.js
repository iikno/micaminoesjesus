import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PERMS } from '../lib/perm.js';
import { activeTo, mainNav, moreNav } from '../../src/panel/nav.js';

const nav = (role) => {
  const can = (r, a) => PERMS[role][r]?.includes(a) ?? false;
  const main = mainNav(can);
  return { main, labels: main.map((i) => i.label.replace(/\u00AD/g, '')), more: moreNav(can, main).map((i) => i.label) };
};

test('each role sees only what its permissions allow', () => {
  assert.deepEqual(nav('admin').labels, ['Inicio', 'Retiros', 'Inscritos', 'Pendientes', 'Más']);
  assert.deepEqual(nav('asesor').labels, ['Inicio', 'Retiros', 'Inscritos', 'Pendientes', 'Más']);
  assert.deepEqual(nav('pastoral').labels, ['Inicio', 'Retiros', 'Inscritos', 'Pendientes', 'Más']);
  assert.deepEqual(nav('peregrinacion').labels, ['Inicio', 'Peregrinaciones', 'Inscritos', 'Pendientes', 'Más']);
});

test('Más lists the rest, without repeating the bar', () => {
  assert.ok(nav('admin').more.includes('Usuarios') && nav('admin').more.includes('Peregrinaciones'));
  assert.ok(!nav('pastoral').more.includes('Usuarios') && !nav('pastoral').more.includes('Peregrinaciones'));
  assert.ok(!nav('peregrinacion').more.includes('Peregrinaciones'));
  assert.ok(nav('peregrinacion').more.includes('Cambiar contraseña'));
});

test('the active destination follows the URL', () => {
  const { main } = nav('admin');
  assert.equal(activeTo(main, '/panel'), '/panel');
  assert.equal(activeTo(main, '/panel/retiros/12'), '/panel/retiros');
  assert.equal(activeTo(main, '/panel/fechas'), '/panel/retiros');
  assert.equal(activeTo(main, '/panel/inscripciones/session/3'), '/panel/inscripciones');
  assert.equal(activeTo(main, '/panel/revision'), '/panel/pendientes');
  assert.equal(activeTo(main, '/panel/contacto'), '/panel/pendientes');
  assert.equal(activeTo(main, '/panel/versiculos/4'), '/panel/mas');
  assert.equal(activeTo(main, '/panel/contrasena'), '/panel/mas');
});
