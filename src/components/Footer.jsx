import { Link } from 'react-router-dom';
import logotipo from '../assets/logos/logotipo.png';
import { NAV, INSTAGRAM_URL } from '../data/site';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        {/* Logotipo sobre chip crema: nunca se recolorea. */}
        <img className="chip" src={logotipo} alt="Mi Camino es Jesús" />
        <nav aria-label="Pie">
          {NAV.map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
          <Link to="/aviso-de-privacidad">Aviso de privacidad</Link>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>
        </nav>
        <small>© 2026 Mi Camino es Jesús · Puebla, México</small>
      </div>
    </footer>
  );
}
