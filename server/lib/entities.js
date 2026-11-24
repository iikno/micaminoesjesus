import * as s from './schemas.js';

// Reviewable content. `snap` = columns published to the site, `text` = columns a quick fix may touch
// (never dates, capacity, state or media).
export const ENTITIES = {
  retreats: {
    table: 'retreats', resource: 'retreats', schema: s.retreat, patch: s.retreat.partial(), json: ['season_secondary', 'body'],
    snap: ['slug', 'codigo', 'derej_slug', 'tipo', 'paso', 'tema_paso', 'title', 'subtitle', 'summary', 'season_slug', 'season_secondary', 'corte_simja', 'cover', 'estado_catalogo', 'body'],
    text: ['title', 'subtitle', 'summary', 'tema_paso'],
    tr: ['title', 'subtitle', 'summary', 'tema_paso', 'body'], // fields with an English version (translations table)
  },
  sessions: {
    table: 'retreat_sessions', resource: 'sessions', schema: s.session, patch: s.sessionObj.partial(), json: [],
    snap: ['retreat_id', 'title', 'note', 'starts_on', 'ends_on', 'date_text', 'cal_state', 'highlight', 'place', 'registration_mode', 'cupo', 'cost_info'],
    text: ['title', 'note', 'place', 'cost_info'], bool: ['highlight'], tr: ['title', 'note', 'place', 'cost_info', 'date_text'],
  },
  pilgrimages: {
    table: 'pilgrimages', resource: 'pilgrimages', schema: s.pilgrimage, patch: s.pilgrimage.partial(), json: ['itinerary'],
    snap: ['slug', 'title', 'summary', 'itinerary', 'place', 'starts_on', 'ends_on', 'cupo', 'cost_info', 'registration_mode', 'state', 'cover'],
    text: ['title', 'summary', 'place', 'cost_info'],
    tr: ['title', 'summary', 'place', 'cost_info', 'itinerary'],
  },
  team: {
    table: 'team_members', resource: 'team', schema: s.team, patch: s.team.partial(), json: [],
    snap: ['name', 'role_title', 'photo', 'sort'], text: ['name', 'role_title'], tr: ['role_title'],
  },
  verses: {
    table: 'verses', resource: 'verses', schema: s.verse, patch: s.verse.partial(), json: [],
    snap: ['ref', 'text_es', 'text_en', 'version_en'], text: ['text_es', 'text_en'], tr: [], // Scripture is typed by hand, never machine-translated
  },
};

// `en` = reviewed English fields; they go live together with the Spanish ones when the item is approved.
export const snapshotOf = (e, row, en = null) => {
  const out = { id: row.id };
  for (const k of e.snap) out[k] = e.bool?.includes(k) ? !!row[k] : row[k];
  if (en && Object.keys(en).length) out.en = en;
  return out;
};

// Row ready for INSERT/UPDATE: JSON columns serialized, publish_at as Date.
export function toColumns(e, data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === 'publish_at') out[k] = v ? new Date(v) : null;
    else out[k] = e.json.includes(k) && v != null ? JSON.stringify(v) : v;
  }
  return out;
}
