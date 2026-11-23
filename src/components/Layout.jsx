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

  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
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
