// npm run seed  (node --import ./server/seed-loader.js server/seed.js)
// Imports the static site data. Idempotent and non-destructive: derej/seasons are upserted, content rows
// that already exist (matched by slug/name/title) are skipped so editors' changes are never overwritten.
import { config } from './config.js';
import { pool, tx } from './db.js';
import { ENTITIES, snapshotOf } from './lib/entities.js';
import { CALENDARIO } from '../src/data/calendario.js';
import { EQUIPO } from '../src/data/equipo.js';
import { VERSO } from '../src/data/site.js';
import { DEREJ, SEASONS, retreats } from '../src/data/retreats.js';

// Seeding a real database by accident would be a disaster: only local hosts unless explicitly allowed.
if (!['localhost', '127.0.0.1', 'db'].includes(config.DB_HOST) && process.env.ALLOW_REMOTE_SEED !== '1') {
  console.error('Refusing to seed a non-local DB_HOST (set ALLOW_REMOTE_SEED=1 to override).');
  process.exit(1);
}

// Approximate start/end per CALENDARIO entry (same order); the static file only has free text.
const CAL_DATES = [
  ['2026-11-29', null], ['2026-12-01', null], ['2027-01-25', null], ['2027-02-01', null],
  ['2027-03-01', null], ['2027-03-21', '2027-03-27'], ['2027-04-01', null],
];
if (CAL_DATES.length !== CALENDARIO.length) throw new Error('calendario.js changed: update CAL_DATES in seed.js');

const json = (v) => (v == null ? null : JSON.stringify(v));

async function insertPublished(c, key, row, exists) {
  const e = ENTITIES[key];
  if (await c.one(exists.sql, exists.params)) return 0;
  const now = new Date();
  const r = await c.q(`INSERT INTO ${e.table} SET ?, status = 'publicado', live_from = ?`, [row, now]);
  await c.q(`UPDATE ${e.table} SET published_snapshot = ? WHERE id = ?`, [JSON.stringify(snapshotOf(e, { ...row, id: r.insertId, ...Object.fromEntries(e.json.map((k) => [k, row[k] == null ? null : JSON.parse(row[k])])) })), r.insertId]);
  return 1;
}

const out = await tx(async (c) => {
  let sort = 0;
  for (const [slug, d] of Object.entries(DEREJ)) {
    await c.q('INSERT INTO derej SET ? ON DUPLICATE KEY UPDATE name=VALUES(name), subtitle=VALUES(subtitle), audience=VALUES(audience), esquema=VALUES(esquema), paso_total=VALUES(paso_total), color=VALUES(color), foto=VALUES(foto), who=VALUES(who), more=VALUES(more), sort=VALUES(sort)',
      [{ slug, name: d.name, subtitle: d.subtitle, audience: d.audience, esquema: d.esquema, paso_total: d.pasoTotal, color: d.color, foto: d.foto, who: d.who, more: d.more, sort: sort++ }]);
  }
  sort = 0;
  for (const [slug, s] of Object.entries(SEASONS)) {
    await c.q('INSERT INTO seasons SET ? ON DUPLICATE KEY UPDATE name = VALUES(name), sort = VALUES(sort)', [{ slug, name: s.name, sort: sort++ }]);
  }

  let nRetreats = 0;
  for (const r of retreats) {
    const row = {
      slug: r.id, codigo: r.codigo, derej_slug: r.derej, tipo: r.tipo, paso: r.paso, tema_paso: r.sequenceTheme,
      title: r.title, summary: r.conceptoCentral, season_slug: r.season, season_secondary: json(r.seasonSecondary),
      corte_simja: r.corte ?? null, cover: r.image, estado_catalogo: r.estado === 'proximamente' ? 'proximamente' : 'publicado', // one entry uses the stray value 'disponible'
      body: json({ basadoEn: r.basadoEn, bloques: r.bloques, temas: r.temas, cronograma: r.cronograma, fichaTecnica: r.fichaTecnica, chips: r.chips, chipsLabel: r.chipsLabel }),
    };
    nRetreats += await insertPublished(c, 'retreats', row, { sql: 'SELECT id FROM retreats WHERE slug = ?', params: [r.id] });
  }

  let nTeam = 0;
  for (const [i, m] of EQUIPO.entries()) {
    nTeam += await insertPublished(c, 'team', { name: m.nombre, role_title: m.rol, photo: m.foto, sort: i }, { sql: 'SELECT id FROM team_members WHERE name = ?', params: [m.nombre] });
  }

  let nCal = 0;
  for (const [i, it] of CALENDARIO.entries()) {
    const [starts_on, ends_on] = CAL_DATES[i];
    nCal += await insertPublished(c, 'sessions', {
      title: it.titulo, note: it.nota, starts_on, ends_on, date_text: it.cuando, cal_state: it.estado, highlight: !!it.destacado,
    }, { sql: 'SELECT id FROM retreat_sessions WHERE title = ? AND starts_on = ?', params: [it.titulo, starts_on] });
  }
  // The home page verse. text_en stays empty: the RSV-2CE text is typed by hand in the panel, never machine-translated.
  const nVerse = await insertPublished(c, 'verses', { ref: 'Josué 1:9', text_es: VERSO.texto, version_en: 'RSV-2CE' }, { sql: 'SELECT id FROM verses WHERE ref = ?', params: ['Josué 1:9'] });
  return { nRetreats, nTeam, nCal, nVerse };
});

const [[n]] = await pool.query('SELECT (SELECT COUNT(*) FROM retreats) retreats, (SELECT COUNT(*) FROM derej) derej, (SELECT COUNT(*) FROM seasons) seasons, (SELECT COUNT(*) FROM team_members) team, (SELECT COUNT(*) FROM retreat_sessions) sessions');
console.log('inserted this run:', out, '| totals:', n);
await pool.end();
