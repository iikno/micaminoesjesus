import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { errText } from './api';

export const Icon = ({ d }) => <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
export const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  review: 'M5 4h14v16H5zM9 9l2 2 4-4M9 15h6',
  retreats: 'M4 5h16v14H4zM4 9h16M8 3v4M16 3v4',
  pilgrimages: 'M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 10m-2 0a2 2 0 104 0 2 2 0 10-4 0',
  team: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 100-5M21 19c0-2-1.5-3.5-4-4',
  verses: 'M5 4h10a4 4 0 014 4v12H9a4 4 0 01-4-4zM9 8h6M9 12h6',
  media: 'M4 5h16v14H4zM8 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4 17l5-5 4 4 3-3 4 4',
  glossary: 'M5 4h12a2 2 0 012 2v14H7a2 2 0 01-2-2zM9 8h6M9 12h6',
  users: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  regs: 'M9 11l3 3 8-8M4 12v7h14M4 5h10',
  audit: 'M12 8v5l3 2M21 12a9 9 0 11-3-6.7M21 4v5h-5',
  bell: 'M6 17h12l-1.5-2v-4a4.5 4.5 0 00-9 0v4zM10 20h4',
  more: 'M5 12m-1.5 0a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0M12 12m-1.5 0a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0M19 12m-1.5 0a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0',
  key: 'M15 9m-4 0a4 4 0 108 0 4 4 0 10-8 0M12 12l-8 8M7 17l2 2',
  out: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  plus: 'M12 5v14M5 12h14',
  draft: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  clock: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
  live: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12l3 3 5-6',
  alert: 'M12 4l9 16H3zM12 10v4M12 17.5v.01',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  chat: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  down: 'M12 4v11M7 11l5 5 5-5M5 20h14',
};

// Status = color + icon + words, never color alone. Labels are for people; the keys are the DB values.
export const STATUS = {
  borrador: 'Escribiendo', en_revision: 'En revisión', programado: 'Programado', publicado: 'En el sitio', rechazado: 'Necesita cambios',
};
const STATUS_ICON = { borrador: ICONS.draft, en_revision: ICONS.clock, programado: ICONS.retreats, publicado: ICONS.live, rechazado: ICONS.alert };
export const ROLE = { admin: 'Administración', asesor: 'Asesoría', pastoral: 'Pastoral', peregrinacion: 'Peregrinaciones' };

// `status` picks the color/icon (a STATUS key); children is the visible word.
export const Pill = ({ status, children }) => <span className={`pill pill-${status}`}><Icon d={STATUS_ICON[status] ?? STATUS_ICON.borrador} />{children}</span>;
export const StatusPill = ({ status }) => <Pill status={status}>{STATUS[status] ?? status}</Pill>;
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
