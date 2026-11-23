import { buildCalendar } from '../lib/calendar.js';
import { published } from '../lib/content.js';
import { normLang } from '../lib/i18n.js';
import { q } from '../db.js';

export default async function publicRoutes(app) {
  app.addHook('onSend', async (req, reply, payload) => {
    if (reply.statusCode === 200) reply.header('Cache-Control', 'public, max-age=60');
    return payload;
  });
  const rl = { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } };
  const lang = (req) => normLang(req.query.lang);

  app.get('/api/public/derej', rl, () => q('SELECT * FROM derej ORDER BY sort'));
  app.get('/api/public/seasons', rl, () => q('SELECT * FROM seasons ORDER BY sort'));

  // Filters: derej, tipo, season (principal or secondary), estado, q (title/summary). ?lang=en falls back to Spanish per field.
  app.get('/api/public/retreats', rl, async (req) => {
    const { derej, tipo, season, estado, q: text } = req.query;
    const needle = text?.toLowerCase();
    return (await published('retreats', lang(req)))
      .filter((r) => (!derej || r.derej_slug === derej) && (!tipo || r.tipo === tipo) && (!estado || r.estado_catalogo === estado)
        && (!season || r.season_slug === season || r.season_secondary?.includes(season))
        && (!needle || `${r.title} ${r.summary ?? ''}`.toLowerCase().includes(needle)))
      .map(({ body: _body, ...light }) => light);
  });

  app.get('/api/public/retreats/:slug', rl, async (req, reply) =>
    (await published('retreats', lang(req))).find((r) => r.slug === req.params.slug) ?? reply.code(404).send({ error: 'not_found' }));

  app.get('/api/public/calendar', rl, async (req) => {
    const l = lang(req);
    const [sessions, retreats, pilgrimages, derej] = await Promise.all([published('retreat_sessions', l), published('retreats', l), published('pilgrimages', l), q('SELECT slug, name FROM derej')]);
    return buildCalendar({
      sessions, pilgrimages, today: new Date().toISOString().slice(0, 10), lang: l,
      retreats: new Map(retreats.map((r) => [r.id, r])), derej: new Map(derej.map((d) => [d.slug, d])),
    });
  });

  app.get('/api/public/team', rl, async (req) => (await published('team_members', lang(req))).sort((a, b) => a.sort - b.sort || a.id - b.id));
  app.get('/api/public/pilgrimages', rl, (req) => published('pilgrimages', lang(req), 'starts_on'));
  app.get('/api/public/pilgrimages/:slug', rl, async (req, reply) =>
    (await published('pilgrimages', lang(req))).find((p) => p.slug === req.params.slug) ?? reply.code(404).send({ error: 'not_found' }));

  // ?ref=Juan 3,16&lang=en. English comes only from text_en (typed by hand, never machine-translated); without it, Spanish is returned.
  app.get('/api/public/verse', rl, async (req, reply) => {
    const v = (await published('verses')).find((x) => x.ref === req.query.ref);
    if (!v) return reply.code(404).send({ error: 'not_found' });
    const en = lang(req) === 'en' && v.text_en;
    return { ref: v.ref, lang: en ? 'en' : 'es', text: en ? v.text_en : v.text_es, version: en ? v.version_en : 'LBLA' };
  });
}
