import { useState } from 'react';
import { ApiError, errText, fieldErrors, get, patch, post } from './api';
import { useAuth } from './session';
import { RESOURCES } from './resources';
import { Async, Confirm, Empty, Field, PageHead, ROLE, fmtDateTime, useLoad, useToast } from './ui';

// ------------------------------------------------------------ Usuarios
const userState = (u) => {
  if (u.status === 'invited') return ['invitado', 'programado'];
  if (u.status === 'disabled') return ['deshabilitado', 'borrador'];
  if (u.locked_until && new Date(u.locked_until) > new Date()) return ['bloqueado', 'rechazado'];
  return ['activo', 'publicado'];
};

function InviteForm({ onDone }) {
  const toast = useToast();
  const [v, setV] = useState({ email: '', name: '', role: 'pastoral' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(v.email)) er.email = 'Escribe un correo válido.';
    if (!v.name.trim()) er.name = 'Escribe el nombre.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await post('/api/admin/users', { email: v.email.trim(), name: v.name.trim(), role: v.role });
      toast(`Invitación enviada a ${v.email.trim()}.`);
      setV({ email: '', name: '', role: 'pastoral' });
      onDone();
    } catch (x) {
      setErrors(x instanceof ApiError && x.code === 'validation' ? fieldErrors(x) : { email: errText(x) });
    } finally { setBusy(false); }
  };
  return (
    <form className="card inline-form" onSubmit={submit} noValidate>
      <h2>Invitar a una persona</h2>
      <div className="p-grid">
        <Field label="Correo" error={errors.email} required>{(p) => <input {...p} type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />}</Field>
        <Field label="Nombre" error={errors.name} required>{(p) => <input {...p} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />}</Field>
        <Field label="Rol" help="Define a qué secciones tiene acceso." required>{(p) => <select {...p} value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })}>{Object.entries(ROLE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field>
      </div>
      <button className="p-btn p-btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar invitación'}</button>
    </form>
  );
}

export function Users() {
  const { user } = useAuth();
  const toast = useToast();
  const load = useLoad(() => get('/api/admin/users'), []);
  const [confirm, setConfirm] = useState(null);

  const change = async (u, body, ok) => {
    try { await patch(`/api/admin/users/${u.id}`, body); toast(ok); load.reload(); } catch (x) { toast(errText(x), 'error'); load.reload(); }
    setConfirm(null);
  };
  const reinvite = async (u) => {
    try { await post('/api/admin/users', { email: u.email, name: u.name, role: u.role }); toast(`Invitación reenviada a ${u.email}.`); } catch (x) { toast(errText(x), 'error'); }
  };

  return (
    <>
      <PageHead title="Usuarios" sub="Solo Administración gestiona accesos. Cambiar un rol o deshabilitar cierra sus sesiones." />
      <InviteForm onDone={load.reload} />
      <Async load={load}>
        {(rows) => (!rows.length ? <Empty title="Aún no hay usuarios." /> : (
          <div className="table-wrap">
            <table className="tbl stack">
              <caption className="sr-only">Usuarios</caption>
              <thead><tr><th scope="col">Nombre</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Alta</th><th scope="col">Acciones</th></tr></thead>
              <tbody>
                {rows.map((u) => {
                  const [label, cls] = userState(u);
                  const me = u.id === user.id;
                  return (
                    <tr key={u.id}>
                      <td data-label="Nombre"><strong>{u.name}</strong><br /><span className="help">{u.email}{me ? ' · eres tú' : ''}</span></td>
                      <td data-label="Rol">
                        <select aria-label={`Rol de ${u.name}`} value={u.role} disabled={me} onChange={(e) => setConfirm({ u, body: { role: e.target.value }, text: `Cambiar el rol de ${u.name} a ${ROLE[e.target.value]} cerrará sus sesiones abiertas.`, ok: 'Rol actualizado.' })}>
                          {Object.entries(ROLE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                      </td>
                      <td data-label="Estado"><span className={`pill pill-${cls}`}>{label}</span></td>
                      <td data-label="Alta" className="p-num">{fmtDateTime(u.created_at)}</td>
                      <td data-label="Acciones" className="cell-actions">
                        {u.status === 'invited' && <button className="p-btn p-btn-sm" onClick={() => reinvite(u)}>Reenviar invitación</button>}
                        {u.status === 'active' && !me && <button className="p-btn p-btn-sm" onClick={() => setConfirm({ u, body: { status: 'disabled' }, text: `${u.name} ya no podrá entrar al panel.`, ok: 'Usuario deshabilitado.', danger: true, label: 'Deshabilitar' })}>Deshabilitar</button>}
                        {u.status === 'disabled' && <button className="p-btn p-btn-sm" onClick={() => change(u, { status: 'active' }, 'Usuario habilitado.')}>Habilitar</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </Async>
      {confirm && <Confirm title="Confirmar cambio" danger={confirm.danger} confirmLabel={confirm.label ?? 'Confirmar'} onCancel={() => { setConfirm(null); load.reload(); }} onConfirm={() => change(confirm.u, confirm.body, confirm.ok)}><p>{confirm.text}</p></Confirm>}
    </>
  );
}

// ------------------------------------------------------------ Historial
const ACTIONS = { create: 'Crear', update: 'Editar', delete: 'Eliminar', submit: 'Enviar a revisión', approve: 'Aprobar', reject: 'Rechazar', quick_fix: 'Corregir errata', invite: 'Invitar', accept_invite: 'Aceptar invitación', reset_password: 'Restablecer contraseña', lockout: 'Bloqueo de cuenta', register: 'Inscripción pública', cancel: 'Cancelar inscripción', reg_confirm: 'Confirmar inscripción', reg_cancel: 'Cancelar inscripción (panel)', reg_waitlist: 'Mover a lista de espera', export: 'Exportar CSV', view_sensitive: 'Ver datos sensibles', contact: 'Mensaje de contacto' };
const ENTITY_NAME = { ...Object.fromEntries(Object.entries(RESOURCES).map(([k, r]) => [k, r.title])), users: 'Usuarios', registrations: 'Inscripciones', contact_messages: 'Contacto' };

export function Audit() {
  const { can } = useAuth();
  const [f, setF] = useState({ user_id: '', action: '', entity: '', from: '', to: '' });
  const qs = new URLSearchParams([['limit', '200'], ...Object.entries(f).filter(([, v]) => v)]).toString();
  const load = useLoad(() => get(`/api/admin/audit?${qs}`), [qs]);
  const users = useLoad(() => (can('users', 'read') ? get('/api/admin/users') : Promise.resolve([])), []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <PageHead title="Historial" sub="Todo cambio queda registrado: quién, qué y cuándo." />
      <div className="filters" role="search">
        {can('users', 'read') && <label>Usuario<select value={f.user_id} onChange={set('user_id')}><option value="">Todos</option>{(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}
        <label>Acción<select value={f.action} onChange={set('action')}><option value="">Todas</option>{Object.entries(ACTIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Sección<select value={f.entity} onChange={set('entity')}><option value="">Todas</option>{Object.entries(ENTITY_NAME).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Desde<input type="date" value={f.from} onChange={set('from')} /></label>
        <label>Hasta<input type="date" value={f.to} onChange={set('to')} /></label>
      </div>
      <Async load={load}>
        {(rows) => (!rows.length ? <Empty title="No hay registros con esos filtros." /> : (
          <div className="table-wrap">
            <table className="tbl stack">
              <caption className="sr-only">Bitácora de cambios</caption>
              <thead><tr><th scope="col">Cuándo</th><th scope="col">Quién</th><th scope="col">Acción</th><th scope="col">Sobre</th><th scope="col">Detalle</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Cuándo" className="p-num">{fmtDateTime(r.created_at)}</td>
                    <td data-label="Quién">{r.user_name ?? (r.user_id ? `#${r.user_id}` : 'Sistema')}</td>
                    <td data-label="Acción">{ACTIONS[r.action] ?? r.action}</td>
                    <td data-label="Sobre">{ENTITY_NAME[r.entity] ?? r.entity} <span className="p-num">#{r.entity_id ?? '—'}</span></td>
                    <td data-label="Detalle">{r.diff ? <details><summary>Ver</summary><pre className="val">{JSON.stringify(r.diff, null, 1)}</pre></details> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Async>
    </>
  );
}
