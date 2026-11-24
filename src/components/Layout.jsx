import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLang } from '../i18n';
import Header from './Header';
import Footer from './Footer';
import { Loading } from './Status';

export default function Layout() {
  const { pathname, hash } = useLocation();
  const { lang, t } = useLang();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Pages are lazy chunks, so a #hash target may not exist yet when the route changes: wait for it (max 3s).
  useEffect(() => {
    const find = () => hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    const first = find();
    if (first) { first.scrollIntoView(); return undefined; }
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    const done = () => { mo.disconnect(); clearTimeout(timer); };
    const mo = new MutationObserver(() => { const el = find(); if (el) { el.scrollIntoView(); done(); } });
    const timer = setTimeout(done, 3000);
    mo.observe(document.getElementById('contenido'), { childList: true, subtree: true });
    return done;
  }, [pathname, hash]);

  return (
    <>
      <a className="skip" href="#contenido">{t('skip')}</a>
      <Header />
      <main id="contenido">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
