import { Link } from 'react-router-dom';
import isotipoBn from '../assets/logos/isotipo-bn.png';
import { CONTACTO, INSTAGRAM_URL, NAV } from '../data/site';
import { useLang } from '../i18n';

// Same order as the header: Inicio, Proyectos (XP Lev, Peregrinos, Otros proyectos), Calendario, Nosotros, Contacto.
const LINKS = [...NAV.flatMap((n) => [{ ...n, sub: undefined }, ...(n.sub ?? []).map((s) => ({ ...s, child: true }))]), CONTACTO];

export default function Footer() {
  const { t, to } = useLang();
  return (
    <footer className="site-foot">
      <div className="wrap foot-grid">
        <img className="foot-logo" src={isotipoBn} alt="Mi Camino es Jesús" />
        <nav aria-label={t('footer.nav')}>
          <h2>{t('footer.explore')}</h2>
          <ul>
            {LINKS.map((n) => <li key={n.to} className={n.child ? 'child' : undefined}><Link to={to(n.to)}>{t(n.key)}</Link></li>)}
          </ul>
        </nav>
        <div>
          <h2>{t('nav.contacto')}</h2>
          <ul>
            <li><span>{t('con.place')}</span></li>
            <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@micaminoesjesus</a></li>
            <li><Link to={to('/aviso-de-privacidad')}>{t('footer.privacy')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="wrap"><div className="foot-end"><small>{t('footer.copy')}</small><small>{t('footer.tag')}</small></div></div>
    </footer>
  );
}
