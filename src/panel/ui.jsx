import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { errText } from './api';

export const STATUS = {
  borrador: 'Borrador', en_revision: 'En revisión', programado: 'Programado', publicado: 'Publicado', rechazado: 'Rechazado',
};
export const ROLE = { admin: 'Administración', asesor: 'Asesoría', pastoral: 'Pastoral', peregrinacion: 'Peregrinaciones' };

export const StatusPill = ({ status }) => <span className={`pill pill-${status}`}>{STATUS[status] ?? status}</span>;
export const Dot = ({ color, label }) => (
  <span className="p-dot-label"><span className="p-dot" style={{ background: color ?? 'var(--color-gray)' }} aria-hidden="true" />{label}</span>
);

// ---- dates (server sends DATE as 'YYYY-MM-DD' and DATETIME as UTC ISO) ----
export const fmtDate = (v) => (v ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00` : v).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const toLocalInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

// ---- unsaved-changes guard: links ask before leaving a dirty form ----
let dirty = false;
export function useDirty(isDirty) {
  useEffect(() => {
    dirty = isDirty;
    const warn = (e) => { if (isDirty) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => { dirty = false; window.removeEventListener('beforeunload', warn); };
  }, [isDirty]);
}
// Called right after a successful save/delete so the following navigation does not prompt.
export const clearDirty = () => { dirty = false; };
const guard = (e) => { if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Salir sin guardarlos?')) e.preventDefault(); };
export const PLink = (p) => <Link {...p} onClick={(e) => { guard(e); p.onClick?.(e); }} />;
export const PNavLink = (p) => <NavLink {...p} onClick={(e) => { guard(e); p.onClick?.(e); }} />;

// ---- toasts (role=status so screen readers announce them) ----
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, kind = 'ok') => {
    const id = Math.random();
    setItems((x) => [...x, { id, text, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), kind === 'error' ? 8000 : 4500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast toast-${t.kind}`}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

// ---- data loading ----
export function useLoad(fn, deps) {
  const [s, set] = useState({ loading: true, data: null, error: null });
  const [n, setN] = useState(0);
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    let live = true;
    set((x) => ({ ...x, loading: true, error: null }));
    ref.current().then((data) => live && set({ loading: false, data, error: null }), (error) => live && set({ loading: false, data: null, error }));
    return () => { live = false; };
  }, [...deps, n]); // eslint-disable-line
  return { ...s, reload: () => setN((x) => x + 1) };
}

export function Skeleton({ rows = 5 }) {
  return (
    <div className="skel" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skel-row" />)}
    </div>
  );
}
export const ErrorBox = ({ error, retry }) => (
  <div className="state state-error" role="alert">
    <p>{errText(error)}</p>
    {retry && <button className="p-btn" onClick={retry}>Reintentar</button>}
  </div>
);
export const Empty = ({ title, children }) => (
  <div className="state"><p className="state-title">{title}</p>{children && <p>{children}</p>}</div>
);
// Renders children(data) once loaded; skeleton / error+retry otherwise.
export function Async({ load, rows, children }) {
  if (load.loading && !load.data) return <Skeleton rows={rows} />;
  if (load.error) return <ErrorBox error={load.error} retry={load.reload} />;
  return children(load.data);
}

export const PageHead = ({ title, children, sub }) => (
  <header className="p-page-head">
    <div><h1>{title}</h1>{sub && <p className="p-sub">{sub}</p>}</div>
    {children && <div className="page-actions">{children}</div>}
  </header>
);

// ---- form field with label, help and error wired by aria ----
export function Field({ label, help, error, required, children }) {
  const id = useId();
  const dec = [help && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`p-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden="true"> *</span>}</label>
      {children({ id, 'aria-describedby': dec, 'aria-invalid': error ? true : undefined, required })}
      {help && <p className="help" id={`${id}-h`}>{help}</p>}
      {error && <p className="p-err" id={`${id}-e`}>{error}</p>}
    </div>
  );
}

export function Confirm({ title, children, confirmLabel, danger, onConfirm, onCancel, busy }) {
  const ref = useRef();
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.showModal();
    return () => prev?.focus?.();
  }, []);
  return (
    <dialog ref={ref} className="dialog" onClose={onCancel} aria-labelledby="dlg-t">
      <h2 id="dlg-t">{title}</h2>
      <div>{children}</div>
      <div className="p-row end">
        <button className="p-btn" onClick={onCancel}>Cancelar</button>
        <button className={`p-btn ${danger ? 'p-btn-danger' : 'p-btn-primary'}`} onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
