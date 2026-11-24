import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import logo from '../assets/logos/logotipo.png';
import './panel.css';
import { Audit, Users } from './Admin';
import Avisos from './Avisos';
import { ChangePassword, Forgot, Invite, Login, Reset } from './Auth';
import { ContentForm, ContentList } from './Content';
import Bandeja from './Bandeja';
import Dashboard from './Dashboard';
import Glossary from './Glossary';
import Instalar from './Instalar';
import { RegistrationEvents, RegistrationList } from './Inscripciones';
import Mas from './Mas';
import MediaPage from './Media';
import { activeTo, mainNav } from './nav';
import { registerPanelWorker, syncPush } from './pwa';
import Pendientes, { PendingProvider, pendingCount, usePendingLoad } from './Pendientes';
import Review from './Review';
import { RESOURCES } from './resources';
import { AuthProvider, RequireAuth, useAuth } from './session';
import { ICONS, Icon, PLink, ROLE, ToastProvider } from './ui';

function Shell() {
  const { user, can, logout } = useAuth();
  const pend = usePendingLoad();
  useEffect(() => { syncPush().catch(() => {}); }, [user.id]); // a shared phone: its subscription follows whoever is signed in now
  const main = mainNav(can);
  const on = activeTo(main, useLocation().pathname);
  const count = pendingCount(pend.data);
  const item = (i) => (
    <PLink key={i.to} to={i.to} aria-current={on === i.to ? 'page' : undefined}>
      <Icon d={ICONS[i.ico]} /><span>{i.label}</span>
      {i.to === '/panel/pendientes' && count > 0 && <span className="badge p-num">{count}<span className="sr-only"> pendientes</span></span>}
    </PLink>
  );
  return (
    <PendingProvider value={pend}>
      <div className="shell">
        <a className="p-skip" href="#main">Saltar al contenido</a>
        <header className="topbar"><span className="topbar-title">Panel MCJ</span></header>
        <aside className="sidebar">
          <Link to="/panel" className="logo-chip" aria-label="Panel Mi Camino es Jesús, inicio"><img src={logo} alt="" /></Link>
          <p className="side-title">Panel</p>
          <nav aria-label="Secciones"><ul>{main.map((i) => <li key={i.to}>{item(i)}</li>)}</ul></nav>
          <div className="side-foot">
            <p className="p-who"><strong>{user.name}</strong><br /><span>{ROLE[user.role]}</span></p>
            <a href="/" className="side-link">Ver el sitio</a>
            <button className="p-btn p-btn-ghost" onClick={logout}>Cerrar sesión</button>
          </div>
        </aside>
        <main id="main" className="main" tabIndex={-1}><Guarded /></main>
        <nav className="bottombar" aria-label="Secciones">{main.map(item)}</nav>
      </div>
    </PendingProvider>
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
      <Route path="inscripciones" element={<Allowed ok={can('registrations', 'read')}><RegistrationEvents /></Allowed>} />
      <Route path="inscripciones/:kind/:id" element={<Allowed ok={can('registrations', 'read')}><RegistrationList /></Allowed>} />
      <Route path="contacto" element={<Allowed ok={can('contact', 'read')}><Bandeja /></Allowed>} />
      <Route path="pendientes" element={<Pendientes />} />
      <Route path="mas" element={<Mas />} />
      <Route path="instalar" element={<Instalar />} />
      <Route path="avisos" element={<Avisos />} />
      <Route path="contrasena" element={<ChangePassword />} />
      <Route path="imagenes" element={<Allowed ok={can('media', 'read')}><MediaPage /></Allowed>} />
      <Route path="glosario" element={<Allowed ok={can('glossary', 'read')}><Glossary /></Allowed>} />
      <Route path="usuarios" element={<Allowed ok={can('users', 'read')}><Users /></Allowed>} />
      <Route path="historial" element={<Allowed ok={can('audit', 'read')}><Audit /></Allowed>} />
      <Route path="*" element={<div className="state"><p className="state-title">Esta página no existe.</p><Link to="/panel">Volver al inicio</Link></div>} />
    </Routes>
  );
}

export default function PanelApp() {
  useEffect(registerPanelWorker, []);
  useEffect(() => {
    const prev = document.title;
    document.title = 'Panel · Mi Camino es Jesús';
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex,nofollow';
    document.head.append(m);
    const vp = document.querySelector('meta[name=viewport]'); // env(safe-area-inset-*) needs viewport-fit=cover
    const vpPrev = vp?.content;
    if (vp) vp.content = `${vpPrev}, viewport-fit=cover`;
    return () => { document.title = prev; m.remove(); if (vp) vp.content = vpPrev; };
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
