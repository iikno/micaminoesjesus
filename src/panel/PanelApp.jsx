import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import logo from '../assets/logos/logotipo.png';
import './panel.css';
import { Audit, Users } from './Admin';
import { Forgot, Invite, Login, Reset } from './Auth';
import { ContentForm, ContentList } from './Content';
import Dashboard from './Dashboard';
import Glossary from './Glossary';
import MediaPage from './Media';
import Review from './Review';
import { RESOURCES } from './resources';
import { AuthProvider, RequireAuth, useAuth } from './session';
import { PNavLink, ROLE, ToastProvider } from './ui';

const Icon = ({ d }) => <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  review: 'M5 4h14v16H5zM9 9l2 2 4-4M9 15h6',
  retreats: 'M4 5h16v14H4zM4 9h16M8 3v4M16 3v4',
  sessions: 'M4 6h16M4 12h16M4 18h10',
  pilgrimages: 'M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 10m-2 0a2 2 0 104 0 2 2 0 10-4 0',
  team: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 100-5M21 19c0-2-1.5-3.5-4-4',
  verses: 'M5 4h10a4 4 0 014 4v12H9a4 4 0 01-4-4zM9 8h6M9 12h6',
  media: 'M4 5h16v14H4zM8 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4 17l5-5 4 4 3-3 4 4',
  glossary: 'M5 4h12a2 2 0 012 2v14H7a2 2 0 01-2-2zM9 8h6M9 12h6',
  users: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  audit: 'M12 8v5l3 2M21 12a9 9 0 11-3-6.7M21 4v5h-5',
};

function Shell() {
  const { user, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const approver = Object.keys(user.perms).some((k) => can(k, 'approve'));
  const items = [
    ['/panel', 'Inicio', 'home', true, true],
    ['/panel/revision', 'Revisión', 'review', approver],
    ...Object.values(RESOURCES).map((r) => [`/panel/${r.path}`, r.title, r.entity, can(r.perm, 'read')]),
    ['/panel/imagenes', 'Imágenes', 'media', can('media', 'read')],
    ['/panel/glosario', 'Glosario', 'glossary', can('glossary', 'read')],
    ['/panel/usuarios', 'Usuarios', 'users', can('users', 'read')],
    ['/panel/historial', 'Historial', 'audit', can('audit', 'read')],
  ].filter((i) => i[3]);
  return (
    <div className="shell">
      <a className="p-skip" href="#main">Saltar al contenido</a>
      <header className="topbar">
        <button className="p-btn p-btn-icon" aria-expanded={open} aria-controls="side-nav" onClick={() => setOpen(!open)}>
          <span aria-hidden="true">☰</span><span className="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
        </button>
        <span className="topbar-title">Panel MCJ</span>
      </header>
      <aside id="side-nav" className={`sidebar${open ? ' is-open' : ''}`}>
        <Link to="/panel" className="logo-chip" aria-label="Panel Mi Camino es Jesús, inicio"><img src={logo} alt="" /></Link>
        <p className="side-title">Panel</p>
        <nav aria-label="Secciones">
          <ul>
            {items.map(([to, label, ico, , end]) => (
              <li key={to}><PNavLink to={to} end={!!end} onClick={() => setOpen(false)}><Icon d={ICONS[ico]} />{label}</PNavLink></li>
            ))}
          </ul>
        </nav>
        <div className="side-foot">
          <p className="p-who"><strong>{user.name}</strong><br /><span>{ROLE[user.role]}</span></p>
          <a href="/" className="side-link">Ver el sitio</a>
          <button className="p-btn p-btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>
      {open && <button className="scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
      <main id="main" className="main" tabIndex={-1}><Guarded /></main>
    </div>
  );
}

// 403-style screen for sections the role does not have, even when typing the URL by hand.
function Allowed({ ok, children }) {
  return ok ? children : <div className="state"><p className="state-title">No tienes acceso a esta sección.</p><Link to="/panel">Volver al inicio</Link></div>;
}

function Guarded() {
  const { user, can } = useAuth();
  const approver = Object.keys(user.perms).some((k) => can(k, 'approve'));
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="revision" element={<Allowed ok={approver}><Review /></Allowed>} />
      {Object.values(RESOURCES).flatMap((r) => [
        <Route key={r.path} path={r.path} element={<Allowed ok={can(r.perm, 'read')}><ContentList res={r} /></Allowed>} />,
        <Route key={`${r.path}-id`} path={`${r.path}/:id`} element={<Allowed ok={can(r.perm, 'read')}><ContentForm res={r} /></Allowed>} />,
      ])}
      <Route path="imagenes" element={<Allowed ok={can('media', 'read')}><MediaPage /></Allowed>} />
      <Route path="glosario" element={<Allowed ok={can('glossary', 'read')}><Glossary /></Allowed>} />
      <Route path="usuarios" element={<Allowed ok={can('users', 'read')}><Users /></Allowed>} />
      <Route path="historial" element={<Allowed ok={can('audit', 'read')}><Audit /></Allowed>} />
      <Route path="*" element={<div className="state"><p className="state-title">Esta página no existe.</p><Link to="/panel">Volver al inicio</Link></div>} />
    </Routes>
  );
}

export default function PanelApp() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Panel · Mi Camino es Jesús';
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex,nofollow';
    document.head.append(m);
    return () => { document.title = prev; m.remove(); };
  }, []);
  return (
    <div className="panel">
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="invitacion" element={<Invite />} />
            <Route path="restablecer" element={<Reset />} />
            <Route path="olvide" element={<Forgot />} />
            <Route path="*" element={<RequireAuth><Shell /></RequireAuth>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </div>
  );
}
