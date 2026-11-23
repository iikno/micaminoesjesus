import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import en from './en';
import es from './es';
import { PAGE_META, pageTitle, SITE_NAME } from './meta';

const DICT = { es, en };
export const langOf = (pathname) => (pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'es');
const strip = (pathname) => (langOf(pathname) === 'en' ? pathname.slice(3) || '/' : pathname);

// Language comes from the URL (/en/...), so every page is linkable and crawlable in both languages.
// t(key, vars): dictionary lookup, English falls back to Spanish. r(key, render): '*word*' marks the emphasized parts.
// to(path): same-language link. other: the current page in the other language.
export function useLang() {
  const { pathname, search } = useLocation();
  const lang = langOf(pathname);
  return useMemo(() => {
    const t = (key, vars) => {
      let s = DICT[lang][key] ?? es[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
      return s;
    };
    // td: like t, but returns `fallback` (not the key) when the dictionary has no such entry, e.g. a Dérej added later.
    const td = (key, fallback) => DICT[lang][key] ?? es[key] ?? fallback;
    const r = (key, render = (s) => <span className="jesus">{s}</span>) =>
      t(key).split('*').map((part, i) => (i % 2 ? <span key={i}>{render(part)}</span> : part));
    const to = (path) => (lang === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path);
    const rest = strip(pathname);
    const other = lang === 'en' ? `${rest}${search}` : `${rest === '/' ? '/en' : `/en${rest}`}${search}`;
    return { lang, t, td, r, to, other, otherLang: lang === 'en' ? 'es' : 'en' };
  }, [lang, pathname, search]);
}

// Sets <html lang>, the title and the description for the current page. `key` is a PAGE_META key;
// detail pages pass their own { title, desc } once the item has loaded.
export function useMeta(key, custom) {
  const { lang } = useLang();
  const title = custom?.title ?? (key && PAGE_META[lang][key] ? (key === 'home' ? `${SITE_NAME} — ${PAGE_META[lang].home[0]}` : pageTitle(PAGE_META[lang][key][0])) : null);
  const desc = custom?.desc ?? (key ? PAGE_META[lang][key]?.[1] : null);
  useEffect(() => {
    document.documentElement.lang = lang;
    if (title) document.title = title;
    if (desc) document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
  }, [lang, title, desc]);
}
