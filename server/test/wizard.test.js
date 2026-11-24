import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import { layout, locate, minimalOk, slugify, withSuffix } from '../../src/panel/wizard.js';

let vite, RES;
before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  RES = (await vite.ssrLoadModule('/src/panel/resources.jsx')).RESOURCES;
});
after(() => vite.close());

const ctx = { derej: [{ slug: 'guibor', esquema: 'secuencial' }, { slug: 'simja', esquema: 'estaciones' }, { slug: 'oz', esquema: 'catalogo_sugerido' }], seasons: [], retreats: [] };
const names = (fs) => fs.map((f) => f.n);

test('slugify: no accents, hyphens, valid for the server regex, empty when too short', () => {
  assert.equal(slugify('  Retiro «Levántate, Hombre»: ¡Paso 1! '), 'retiro-levantate-hombre-paso-1');
  assert.equal(slugify('Dérej Mesharét'), 'derej-mesharet');
  assert.equal(slugify('¿?'), '');
  assert.equal(slugify('A'), '');
  const long = slugify('palabra '.repeat(30));
  assert.ok(long.length <= 80 && /^[a-z0-9-]{2,80}$/.test(long) && !long.endsWith('-'));
});

test('withSuffix numbers a taken address and stays within 80 characters', () => {
  assert.equal(withSuffix('retiro', 1), 'retiro');
  assert.equal(withSuffix('retiro', 3), 'retiro-3');
  const s = withSuffix('a'.repeat(80), 12);
  assert.equal(s.length, 80);
  assert.ok(s.endsWith('-12') && /^[a-z0-9-]{2,80}$/.test(s));
});

test('no field is ever lost: every field of every resource is in exactly one place', () => {
  for (const res of Object.values(RES).filter((r) => r.steps)) {
    // Worst cases for the hide rules: nothing filled, and everything filled (including values that hide other fields).
    const empty = Object.fromEntries(res.fields.map((f) => [f.n, f.t === 'multi' || f.t === 'itin' ? [] : '']));
    const full = Object.fromEntries(res.fields.map((f) => [f.n, f.t === 'multi' ? ['x'] : f.t === 'itin' ? [{}] : f.t === 'bool' ? true : f.n === 'derej_slug' ? 'oz' : f.n === 'registration_mode' ? 'none' : f.n === 'retreat_id' ? '3' : 'x']));
    for (const st of [empty, full]) {
      const lay = layout(res, st, ctx);
      const where = lay.steps.flatMap((s) => names(s.fields)).concat(names(lay.more));
      assert.equal(new Set(where).size, where.length, `${res.entity}: a field appears twice`);
      for (const f of res.fields) {
        const visible = !f.when || f.when(st, ctx);
        const filled = Array.isArray(st[f.n]) ? st[f.n].length > 0 : !!st[f.n];
        const inStep = res.steps.some((s) => s.fields?.includes(f.n));
        if (!inStep || visible || filled) assert.ok(where.includes(f.n), `${res.entity}.${f.n} is nowhere`);
      }
      // the address is built from the title (its error is reported on the title), so it may live under Más opciones
      for (const f of res.fields.filter((x) => x.req && x.n !== 'slug')) assert.ok(names(lay.steps.flatMap((s) => s.fields)).includes(f.n), `${res.entity}.${f.n} is required and must sit in a step`);
    }
    assert.ok(res.steps.at(-1).preview, `${res.entity}: the last step is the summary`);
  }
});

test('retreats keep their exact values and hide rules', () => {
  const r = RES.retreats;
  assert.deepEqual(r.fields.find((f) => f.n === 'tipo').opts().map(([v]) => v), ['taller', 'retiro', 'hora_santa', 'vivencial', 'experiencial', 'estaciones']);
  assert.deepEqual(r.fields.find((f) => f.n === 'corte_simja').opts().map(([v]) => v), ['kinder', 'primaria', 'ambos']);
  const st = { derej_slug: 'oz', corte_simja: 'ambos', paso: '', tema_paso: '', title: 't' };
  const a = layout(r, st, ctx);
  assert.ok(!names(a.steps[0].fields).includes('corte_simja'), 'Simjá cut only for Simjá');
  assert.ok(names(a.more).includes('corte_simja'), 'a stored value of a hidden field stays visible under Más opciones');
  assert.ok(names(a.steps[0].fields).includes('paso') && names(a.steps[0].fields).includes('tema_paso'), 'Oz (1-10) can set paso and tema_paso like Guibor/Kavod');
  const sj = layout(r, { ...st, derej_slug: 'simja', paso: '' }, ctx);
  assert.ok(!names(sj.steps[0].fields).includes('paso') && !names(sj.more).includes('paso'), 'Simjá has no numbered steps');
  assert.ok(names(layout(r, { ...st, derej_slug: 'simja', paso: '3' }, ctx).more).includes('paso'), 'a saved paso is never hidden');
  const b = layout(r, { ...st, derej_slug: 'guibor', corte_simja: '' }, ctx);
  assert.ok(names(b.steps[0].fields).includes('paso') && names(b.steps[0].fields).includes('tema_paso'));
  assert.ok(names(layout(r, { ...st, derej_slug: 'simja' }, ctx).steps[0].fields).includes('corte_simja'));
});

test('a server error on a field leads to the step that shows it', () => {
  const lay = layout(RES.retreats, { derej_slug: 'guibor' }, ctx);
  assert.equal(locate(lay, 'title'), 0);
  assert.equal(locate(lay, 'cover'), 1);
  assert.equal(locate(lay, 'summary'), 2);
  assert.equal(locate(lay, 'body'), 3);
  assert.equal(locate(lay, 'slug'), -1);
  assert.equal(locate(lay, 'publish_at'), -1);
  const s = layout(RES.sessions, { retreat_id: '', registration_mode: 'own' }, ctx);
  assert.equal(locate(s, 'starts_on'), 1);
  assert.equal(locate(s, 'cupo'), 2);
  assert.equal(locate(s, 'title'), 0);
  assert.equal(locate(layout(RES.sessions, { retreat_id: '4' }, ctx), 'title'), -1);
});

test('autosave waits for the server minimum', () => {
  assert.equal(minimalOk(RES.retreats, { cover: 'x', body: 'x' }), true);
  assert.equal(minimalOk(RES.retreats, { title: 'Obligatorio' }), false);
  assert.equal(minimalOk(RES.retreats, { slug: 'mal' }), false);
  assert.equal(minimalOk(RES.sessions, { starts_on: 'Obligatorio' }), false);
  assert.equal(minimalOk(RES.sessions, { title: 'Elige un retiro o escribe un título.' }), false);
  assert.equal(minimalOk(RES.sessions, { place: 'largo' }), true);
});
