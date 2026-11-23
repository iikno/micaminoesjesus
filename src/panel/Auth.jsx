import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/logos/logotipo.png';
import { ApiError, errText, get, post } from './api';
import { useAuth } from './session';
import { Field, PageHead, useToast } from './ui';

function Card({ title, children, foot }) {
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <span className="logo-chip"><img src={logo} alt="Mi Camino es Jesús" /></span>
        <h1>{title}</h1>
        {children}
        {foot && <p className="auth-foot">{foot}</p>}
      </div>
    </main>
  );
}

function useSubmit(fn) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try { await fn(new FormData(e.target)); } catch (x) { setErr(x instanceof ApiError ? errText(x) : 'Ocurrió un error inesperado.'); } finally { setBusy(false); }
  };
  return { busy, err, run };
}
const Err = ({ children }) => (children ? <p className="form-error" role="alert">{children}</p> : null);

export function Login() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from ?? '/panel';
  const f = useSubmit(async (d) => {
    await post('/api/auth/login', { email: d.get('email'), password: d.get('password') });
    setUser(await get('/api/auth/me')); // perms come from /me; also proves the cookie stuck
    nav(from, { replace: true });
  });
  if (user) return <Navigate to={from} replace />;
  return (
    <Card title="Panel de administración" foot={<Link to="/panel/olvide">¿Olvidaste tu contraseña?</Link>}>
      <form onSubmit={f.run} noValidate>
        <Field label="Correo" required>{(p) => <input {...p} name="email" type="email" autoComplete="username" autoFocus />}</Field>
        <Field label="Contraseña" required>{(p) => <input {...p} name="password" type="password" autoComplete="current-password" />}</Field>
        <Err>{f.err}</Err>
        <button className="p-btn p-btn-primary p-btn-block" disabled={f.busy}>{f.busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </Card>
  );
}

// Shared by /invitacion (first password) and /restablecer.
function SetPassword({ title, endpoint, done }) {
  const [sp] = useSearchParams();
  const token = sp.get('token') ?? '';
  const [ok, setOk] = useState(false);
  const [local, setLocal] = useState({});
  const f = useSubmit(async (d) => {
    const pw = d.get('password');
    const e = {};
    if (pw.length < 12) e.password = 'Mínimo 12 caracteres.';
    if (pw !== d.get('again')) e.again = 'Las contraseñas no coinciden.';
    setLocal(e);
    if (Object.keys(e).length) return;
    await post(endpoint, { token, password: pw });
    setOk(true);
  });
  if (!token) return <Card title={title}><p className="form-error">Falta el enlace. Abre el enlace completo que recibiste por correo.</p></Card>;
  if (ok) return <Card title="Listo"><p>{done}</p><Link className="p-btn p-btn-primary p-btn-block" to="/panel/login">Ir a iniciar sesión</Link></Card>;
  return (
    <Card title={title}>
      <form onSubmit={f.run} noValidate>
        <Field label="Contraseña nueva" help="Mínimo 12 caracteres." error={local.password} required>{(p) => <input {...p} name="password" type="password" autoComplete="new-password" autoFocus />}</Field>
        <Field label="Repite la contraseña" error={local.again} required>{(p) => <input {...p} name="again" type="password" autoComplete="new-password" />}</Field>
        <Err>{f.err}</Err>
        <button className="p-btn p-btn-primary p-btn-block" disabled={f.busy}>Guardar contraseña</button>
      </form>
    </Card>
  );
}
export const Invite = () => <SetPassword title="Crea tu contraseña" endpoint="/api/auth/accept-invite" done="Tu cuenta quedó activa." />;
export const Reset = () => <SetPassword title="Restablecer contraseña" endpoint="/api/auth/reset" done="Tu contraseña cambió y se cerraron las sesiones anteriores." />;

export function Forgot() {
  const [sent, setSent] = useState(false);
  const f = useSubmit(async (d) => { await post('/api/auth/forgot', { email: d.get('email') }); setSent(true); });
  if (sent) return <Card title="Revisa tu correo" foot={<Link to="/panel/login">Volver</Link>}><p>Si el correo tiene una cuenta activa, enviamos un enlace válido por 1 hora.</p></Card>;
  return (
    <Card title="Restablecer contraseña" foot={<Link to="/panel/login">Volver a iniciar sesión</Link>}>
      <form onSubmit={f.run} noValidate>
        <Field label="Correo" required>{(p) => <input {...p} name="email" type="email" autoComplete="username" autoFocus />}</Field>
        <Err>{f.err}</Err>
        <button className="p-btn p-btn-primary p-btn-block" disabled={f.busy}>Enviar enlace</button>
      </form>
    </Card>
  );
}

// Inside the panel: the logged-in user changes their own password (other sessions are closed).
export function ChangePassword() {
  const toast = useToast();
  const [local, setLocal] = useState({});
  const f = useSubmit(async (d) => {
    const pw = d.get('password');
    const e = {};
    if (pw.length < 12) e.password = 'Mínimo 12 caracteres.';
    if (pw !== d.get('again')) e.again = 'Las contraseñas no coinciden.';
    setLocal(e);
    if (Object.keys(e).length) return;
    await post('/api/auth/change-password', { current: d.get('current'), password: pw });
    toast('Contraseña actualizada. Se cerraron tus otras sesiones.');
  });
  return (
    <>
      <PageHead title="Cambiar contraseña" sub="Se cerrarán tus sesiones en otros dispositivos." />
      <form onSubmit={f.run} noValidate style={{ maxWidth: 420 }}>
        <Field label="Contraseña actual" required>{(p) => <input {...p} name="current" type="password" autoComplete="current-password" />}</Field>
        <Field label="Contraseña nueva" help="Mínimo 12 caracteres." error={local.password} required>{(p) => <input {...p} name="password" type="password" autoComplete="new-password" />}</Field>
        <Field label="Repite la contraseña nueva" error={local.again} required>{(p) => <input {...p} name="again" type="password" autoComplete="new-password" />}</Field>
        <Err>{f.err}</Err>
        <button className="p-btn p-btn-primary" disabled={f.busy}>Guardar contraseña</button>
      </form>
    </>
  );
}
