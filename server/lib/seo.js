import { PAGE_META, pageTitle, ROUTES, SITE_NAME } from '../../src/i18n/meta.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const trim = (s, n = 160) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };

// '/en/proyectos/x/' -> { lang: 'en', path: '/proyectos/x' }
export function parsePath(pathname) {
  let p = pathname.replace(/\/+$/, '') || '/';
  let lang = 'es';
  if (p === '/en' || p.startsWith('/en/')) { lang = 'en'; p = p.slice(3) || '/'; }
  return { lang, path: p };
}

// Which public page a (language-less) path is. null = not a public page (panel, api, assets, unknown).
export function routeOf(path) {
  const key = Object.keys(ROUTES).find((k) => ROUTES[k] === path);
  if (key) return { key };
  let m = /^\/proyectos\/peregrinos\/([a-z0-9-]+)$/.exec(path);
  if (m) return { key: 'pilgrimage', slug: m[1] };
  m = /^\/proyectos\/([a-z0-9-]+)$/.exec(path);
  return m ? { key: 'retreat', slug: m[1] } : null;
}

export const urlFor = (base, lang, path) => `${base}${lang === 'en' ? '/en' : ''}${path === '/' && lang === 'en' ? '' : path}` || `${base}/`;

// Head tags for one page: canonical, hreflang alternates, Open Graph. `item` is the localized snapshot for detail pages.
export function headTags({ base, lang, path, route, item }) {
  const meta = PAGE_META[lang];
  let title, desc, image;
  if (route.key === 'retreat') {
    title = pageTitle(`${item.title} · XP Lev`); desc = trim(item.summary || item.subtitle) || meta.xplev[1]; image = item.cover;
  } else if (route.key === 'pilgrimage') {
    title = pageTitle(`${item.title} · Peregrinos`); desc = trim(item.summary) || meta.peregrinos[1]; image = item.cover;
  } else {
    title = route.key === 'home' ? `${SITE_NAME} — ${meta.home[0]}` : pageTitle(meta[route.key][0]); desc = meta[route.key][1];
  }
  const abs = image?.startsWith('/') ? `${base}${image}` : null; // legacy bundled filenames have no stable public URL
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(urlFor(base, lang, path))}" />`,
    `<link rel="alternate" hreflang="es" href="${esc(urlFor(base, 'es', path))}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(urlFor(base, 'en', path))}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(urlFor(base, 'es', path))}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(urlFor(base, lang, path))}" />`,
    `<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'es_MX'}" />`,
    abs ? `<meta property="og:image" content="${esc(abs)}" />` : '',
    `<meta name="twitter:card" content="${abs ? 'summary_large_image' : 'summary'}" />`,
  ].filter(Boolean);
  return tags.join('\n    ');
}

// Swaps <html lang>, drops the static title/description and adds the per-route tags.
export function injectHead(html, { lang, tags }) {
  return html
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `    ${tags}\n  </head>`);
}

export const PANEL_ROBOTS = 'User-agent: *\nDisallow: /\n';

export function robotsTxt(base) {
  return `User-agent: *\nAllow: /\nDisallow: /panel\nDisallow: /inscripcion/\nDisallow: /en/inscripcion/\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
}

// Sitemap with both languages and xhtml alternates; callers pass published content only.
export function buildSitemap({ base, retreats = [], pilgrimages = [], lastmod }) {
  const paths = [...Object.values(ROUTES), ...retreats.map((r) => `/proyectos/${r.slug}`), ...pilgrimages.map((p) => `/proyectos/peregrinos/${p.slug}`)];
  const urls = paths.flatMap((path) => ['es', 'en'].map((lang) => {
    const alt = ['es', 'en'].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(urlFor(base, l, path))}"/>`).join('');
    return `<url><loc>${esc(urlFor(base, lang, path))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${alt}</url>`;
  }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}
