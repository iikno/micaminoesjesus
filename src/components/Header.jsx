import { Link, NavLink } from 'react-router-dom';
import logotipo from '../assets/logos/logotipo.png';
import { NAV } from '../data/site';
import { useLang } from '../i18n';

export default function Header() {
  const { t, to, other, otherLang } = useLang();
  return (
    <header className="top">
      <div className="wrap">
        <Link to={to('/')} aria-label={t('header.home')}>
          <img src={logotipo} alt="Mi Camino es Jesús" />
        </Link>
        <nav aria-label={t('header.nav')}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={to(n.to)} end={n.end}>{t(n.key)}</NavLink>
          ))}
          {/* Same page in the other language; hrefLang/lang tell assistive tech and crawlers what it is. */}
          <Link className="lang-switch" to={other} hrefLang={otherLang} lang={otherLang} aria-label={`${t('lang.switch')}: ${DICT_NAME[otherLang]}`}>
            {otherLang.toUpperCase()}
          </Link>
        </nav>
      </div>
    </header>
  );
}

const DICT_NAME = { es: 'Español', en: 'English' };
