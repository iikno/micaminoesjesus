import { Link, NavLink } from 'react-router-dom';
import logotipo from '../assets/logos/logotipo.png';
import { NAV } from '../data/site';

export default function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <Link to="/" aria-label="Mi Camino es Jesús, inicio">
          <img src={logotipo} alt="Mi Camino es Jesús" />
        </Link>
        <nav aria-label="Principal">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>{n.label}</NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
