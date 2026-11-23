import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSitemap, headTags, injectHead, parsePath, robotsTxt, routeOf } from '../lib/seo.js';

const base = 'https://micaminoesjesus.org';

test('parsePath and routeOf understand the /en prefix and detail pages', () => {
  assert.deepEqual(parsePath('/en/proyectos/sanson/'), { lang: 'en', path: '/proyectos/sanson' });
  assert.deepEqual(parsePath('/en'), { lang: 'en', path: '/' });
  assert.deepEqual(parsePath('/entrada'), { lang: 'es', path: '/entrada' });
  assert.deepEqual(routeOf('/proyectos/xp-lev'), { key: 'xplev' });
  assert.deepEqual(routeOf('/proyectos/sanson'), { key: 'retreat', slug: 'sanson' });
  assert.deepEqual(routeOf('/proyectos/peregrinos/camino'), { key: 'pilgrimage', slug: 'camino' });
  assert.equal(routeOf('/panel/login'), null);
});

test('sitemap lists both languages with alternates, published content only', () => {
  const xml = buildSitemap({ base, retreats: [{ slug: 'sanson' }], pilgrimages: [{ slug: 'camino' }], lastmod: '2026-11-23' });
  assert.match(xml, /<loc>https:\/\/micaminoesjesus\.org\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/micaminoesjesus\.org\/en<\/loc>/);
  assert.match(xml, /<loc>https:\/\/micaminoesjesus\.org\/en\/proyectos\/sanson<\/loc>/);
  assert.match(xml, /hreflang="en" href="https:\/\/micaminoesjesus\.org\/en\/proyectos\/peregrinos\/camino"/);
  assert.equal(xml.match(/<url>/g).length, (8 + 2) * 2);
  assert.ok(!xml.includes('/panel'));
});

test('head tags: title, description, canonical, hreflang, og; injected into index.html', () => {
  const item = { title: 'Sansón "fuerte"', summary: 'La fuerza no es el músculo', cover: '/uploads/a.webp' };
  const tags = headTags({ base, lang: 'en', path: '/proyectos/sanson', route: { key: 'retreat' }, item });
  assert.match(tags, /<title>Sansón &quot;fuerte&quot; · XP Lev · Mi Camino es Jesús<\/title>/);
  assert.match(tags, /rel="canonical" href="https:\/\/micaminoesjesus\.org\/en\/proyectos\/sanson"/);
  assert.match(tags, /hreflang="es" href="https:\/\/micaminoesjesus\.org\/proyectos\/sanson"/);
  assert.match(tags, /og:image" content="https:\/\/micaminoesjesus\.org\/uploads\/a\.webp"/);
  const html = '<html lang="es"><head><meta name="description" content="x" /><title>Old</title></head><body></body></html>';
  const out = injectHead(html, { lang: 'en', tags });
  assert.match(out, /^<html lang="en">/);
  assert.ok(!out.includes('Old'));
  assert.equal(out.match(/<title>/g).length, 1);
  assert.match(out, /og:title/);
});

test('robots.txt hides the panel and points at the sitemap', () => {
  const r = robotsTxt(base);
  assert.match(r, /Disallow: \/panel/);
  assert.match(r, /Disallow: \/inscripcion\//);
  assert.match(r, /Disallow: \/en\/inscripcion\//);
  assert.match(r, /Sitemap: https:\/\/micaminoesjesus\.org\/sitemap\.xml/);
});

test('sitemap never lists registration links', () => {
  assert.ok(!buildSitemap({ base, retreats: [], pilgrimages: [], lastmod: '2026-01-01' }).includes('/inscripcion'));
});
