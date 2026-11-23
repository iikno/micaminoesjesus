import { Link } from 'react-router-dom';
import logotipo from '../assets/logos/logotipo.png';
import { NAV, INSTAGRAM_URL } from '../data/site';
import { useLang } from '../i18n';

export default function Footer() {
  const { t, to } = useLang();
  return (
    <footer>
      <div className="wrap">
        {/* Logotipo sobre chip crema: nunca se recolorea. */}
        <img className="chip" src={logotipo} alt="Mi Camino es Jesús" />
        <nav aria-label={t('footer.nav')}>
          {NAV.map((n) => <Link key={n.to} to={to(n.to)}>{t(n.key)}</Link>)}
          <Link to={to('/aviso-de-privacidad')}>{t('footer.privacy')}</Link>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>
        </nav>
        <small>{t('footer.copy')}</small>
      </div>
    </footer>
  );
}
