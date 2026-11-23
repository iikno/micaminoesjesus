import assert from 'node:assert/strict';
import { test } from 'node:test';
import '../seed-loader.js'; // lets Node import the static data (its image imports resolve to file names)
import { retreat, retreatBody, translationFields } from '../lib/schemas.js';

const { retreats } = await import('../../src/data/retreats.js');
const ok = (schema, v) => assert.ok(schema.safeParse(v).success, JSON.stringify(schema.safeParse(v).error?.issues));
const bad = (schema, v) => assert.ok(!schema.safeParse(v).success);

test('every seeded retreat body fits the structured body schema (editor and seed stay in sync)', () => {
  for (const r of retreats) {
    ok(retreatBody, { basadoEn: r.basadoEn, bloques: r.bloques, temas: r.temas, cronograma: r.cronograma, fichaTecnica: r.fichaTecnica, chips: r.chips, chipsLabel: r.chipsLabel });
  }
});

test('body schema: known shapes only, bounded sizes', () => {
  ok(retreatBody, {});
  ok(retreatBody, { temas: [{ titulo: 'T', puntos: ['a'], simbolos: [] }], fichaTecnica: [{ icon: 'clock', label: 'L', value: 'V' }] });
  bad(retreatBody, { extra: 1 });
  bad(retreatBody, { temas: [{ resumen: 'sin título' }] });
  bad(retreatBody, { temas: [{ titulo: 'T', puntos: 'no es lista' }] });
  bad(retreatBody, { fichaTecnica: [{ icon: 'rocket', label: 'L', value: 'V' }] });
  bad(retreatBody, { bloques: Array.from({ length: 21 }, () => ({ title: 'x' })) });
});

test('retreat schema validates body with it; translation fields reuse it', () => {
  const base = { slug: 'retiro-uno', derej_slug: 'jaim', tipo: 'retiro', title: 'Uno' };
  ok(retreat, { ...base, body: { bloques: [{ title: 'A', text: 'B' }] } });
  bad(retreat, { ...base, body: { bloques: [{ text: 'sin título' }] } });
  ok(translationFields.retreats, { title: 'One', body: { temas: [{ titulo: 'One' }] } });
  bad(translationFields.retreats, { slug: 'no' });
  bad(translationFields.team, { name: 'Persona' }); // names are never translated
});

// ---- the panel's structured editor must not lose or invent content ----
const { bodyErrors, bodyToForm, formToBody } = await import('../../src/panel/body.js');
const strip = (v) => {
  if (Array.isArray(v)) { const a = v.map(strip).filter((x) => x !== undefined); return a.length ? a : undefined; }
  if (v && typeof v === 'object') { const o = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, strip(x)]).filter(([, x]) => x !== undefined)); return Object.keys(o).length ? o : undefined; }
  return v === null || v === '' ? undefined : v;
};

test('editor round-trip: every seeded body survives form -> payload unchanged (empties dropped)', () => {
  for (const r of retreats) {
    const body = { basadoEn: r.basadoEn, bloques: r.bloques, temas: r.temas, cronograma: r.cronograma, fichaTecnica: r.fichaTecnica, chips: r.chips, chipsLabel: r.chipsLabel };
    const back = formToBody(bodyToForm(body));
    assert.deepEqual(back, strip(body) ?? null, r.id);
    if (back) ok(retreatBody, back);
  }
});

test('editor: blank rows disappear, required titles are flagged, no body becomes null', () => {
  assert.equal(formToBody(bodyToForm(null)), null);
  const f = bodyToForm({});
  f.temas.push({ titulo: '', resumen: 'sin título', puntos: [''], evocacion: '', actividadIntroductoria: '', contenido: '', actividadesAdicionales: '', simbolos: [], reflexion: '' });
  assert.match(bodyErrors(f), /tema necesita título/);
  f.temas[0].titulo = 'Uno';
  assert.equal(bodyErrors(f), null);
  assert.deepEqual(formToBody(f), { temas: [{ titulo: 'Uno', resumen: 'sin título' }] });
  f.fichaTecnica.push({ icon: '', label: 'Solo etiqueta', value: '', desc: '' });
  assert.match(bodyErrors(f), /etiqueta y valor/);
});
