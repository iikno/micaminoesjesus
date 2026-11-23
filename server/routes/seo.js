import { config } from '../config.js';
import { publishedBySlug, snaps } from '../lib/content.js';
import { buildSitemap, headTags, injectHead, parsePath, robotsTxt, routeOf } from '../lib/seo.js';

const base = () => new URL(config.PUBLIC_URL).origin;

export default async function seoRoutes(app) {
  app.get('/robots.txt', async (req, reply) => reply.type('text/plain; charset=utf-8').header('Cache-Control', 'public, max-age=3600').send(robotsTxt(base())));

  app.get('/sitemap.xml', async (req, reply) => {
    const [retreats, pilgrimages] = await Promise.all([snaps('retreats'), snaps('pilgrimages')]);
    return reply.type('application/xml; charset=utf-8').header('Cache-Control', 'public, max-age=3600')
      .send(buildSitemap({ base: base(), retreats, pilgrimages, lastmod: new Date().toISOString().slice(0, 10) }));
  });
}

// index.html with the tags of the requested public route. Unknown paths and the panel get the file untouched.
export async function renderPage(url, indexHtml) {
  const { lang, path } = parsePath(new URL(url, 'http://x').pathname);
  const route = routeOf(path);
  if (!route) return { status: 200, html: indexHtml };
  let item = null;
  if (route.key === 'retreat' || route.key === 'pilgrimage') {
    item = await publishedBySlug(route.key === 'retreat' ? 'retreats' : 'pilgrimages', route.slug, lang);
    if (!item) return { status: 404, html: indexHtml };
  }
  return { status: 200, html: injectHead(indexHtml, { lang, tags: headTags({ base: base(), lang, path, route, item }) }) };
}
