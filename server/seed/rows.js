// Rows of the original static site (src/data/*), ready for the DB. Shared by `npm run seed` (local) and
// `npm run seed:sql` (writes the idempotent migration that loads them in production). Dev-only: src/data is not in the image.
import { CALENDARIO } from '../../src/data/calendario.js';
import { EQUIPO } from '../../src/data/equipo.js';
import { VERSO } from '../../src/data/site.js';
import { DEREJ, SEASONS, retreats } from '../../src/data/retreats.js';

// Approximate start/end per CALENDARIO entry (same order); the static file only has free text.
const CAL_DATES = [
  ['2026-11-29', null], ['2026-12-01', null], ['2027-01-25', null], ['2027-02-01', null],
  ['2027-03-01', null], ['2027-03-21', '2027-03-27'], ['2027-04-01', null],
];
if (CAL_DATES.length !== CALENDARIO.length) throw new Error('calendario.js changed: update CAL_DATES in server/seed/rows.js');

const json = (v) => (v == null ? null : JSON.stringify(v));

export function seedRows() {
  return {
    derej: Object.entries(DEREJ).map(([slug, d], sort) => ({
      slug, name: d.name, subtitle: d.subtitle, audience: d.audience, esquema: d.esquema, paso_total: d.pasoTotal,
      color: d.color, foto: d.foto, who: d.who, more: d.more, sort,
    })),
    seasons: Object.entries(SEASONS).map(([slug, s], sort) => ({ slug, name: s.name, sort })),
    // Talleres, retiros, horas santas, vivenciales y estaciones: todos viven en `retreats` (columna tipo).
    retreats: retreats.map((r) => ({
      slug: r.id, codigo: r.codigo, derej_slug: r.derej, tipo: r.tipo, paso: r.paso, tema_paso: r.sequenceTheme ?? null,
      title: r.title, subtitle: r.subtitle ?? null, summary: r.conceptoCentral ?? null, season_slug: r.season ?? null,
      season_secondary: json(r.seasonSecondary), corte_simja: r.corte ?? null, cover: r.image ?? null,
      estado_catalogo: r.estado === 'proximamente' ? 'proximamente' : 'publicado', // one entry uses the stray value 'disponible'
      body: json({ basadoEn: r.basadoEn, bloques: r.bloques, temas: r.temas, cronograma: r.cronograma, fichaTecnica: r.fichaTecnica, chips: r.chips, chipsLabel: r.chipsLabel }),
    })),
    team: EQUIPO.map((m, sort) => ({ name: m.nombre, role_title: m.rol, photo: m.foto, sort })),
    sessions: CALENDARIO.map((it, i) => ({
      title: it.titulo, note: it.nota, starts_on: CAL_DATES[i][0], ends_on: CAL_DATES[i][1], date_text: it.cuando,
      cal_state: it.estado, highlight: !!it.destacado,
    })),
    // text_en stays empty: the RSV-2CE text is typed by hand in the panel, never machine-translated.
    verses: [{ ref: VERSO.cita, text_es: VERSO.texto, version_en: 'RSV-2CE' }],
  };
}
