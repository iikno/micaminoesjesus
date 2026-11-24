import { config } from '../config.js';
import { publishedBySlug, snaps } from '../lib/content.js';
import { injectPanel, isPanelHost, isPanelPath } from '../lib/pwa.js';
import { PANEL_ROBOTS, buildSitemap, headTags, injectHead, parsePath, robotsTxt, routeOf } from '../lib/seo.js';

const base = () => new URL(config.PUBLIC_URL).origin;
export const onPanelHost = (req) => isPanelHost(req.hostname, config.panelUrl);

export default async function seoRoutes(app) {
  app.get('/robots.txt', async (req, reply) => reply.type('text/plain; charset=utf-8').header('Cache-Control', 'public, max-age=3600').send(onPanelHost(req) ? PANEL_ROBOTS : robotsTxt(base())));

  app.get('/sitemap.xml', async (req, reply) => {
    if (onPanelHost(req)) return reply.code(404).send({ error: 'not_found' });
    const [retreats, pilgrimages] = await Promise.all([snaps('retreats'), snaps('pilgrimages')]);
    return reply.type('application/xml; charset=utf-8').header('Cache-Control', 'public, max-age=3600')
      .send(buildSitemap({ base: base(), retreats, pilgrimages, lastmod: new Date().toISOString().slice(0, 10) }));
  });
}

// index.html with the tags of the requested public route. On the panel host every page is the installable panel shell.
export async function renderPage(url, indexHtml, panel = false) {
  const pathname = new URL(url, 'http://x').pathname;
  if (panel || isPanelPath(pathname)) return { status: 200, html: injectPanel(indexHtml) };
  const { lang, path } = parsePath(pathname);
  const route = routeOf(path);
  if (!route) return { status: 200, html: indexHtml };
  let item = null;
  if (route.key === 'retreat' || route.key === 'pilgrimage') {
    item = await publishedBySlug(route.key === 'retreat' ? 'retreats' : 'pilgrimages', route.slug, lang);
    if (!item) return { status: 404, html: indexHtml };
  }
  return { status: 200, html: injectHead(indexHtml, { lang, tags: headTags({ base: base(), lang, path, route, item }) }) };
}
