import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, del, errText, fieldErrors, get, patch, post } from './api';
import { useAuth, useCatalogs } from './session';
import BodyEditor from './BodyEditor';
import { bodyErrors, bodyToForm, formToBody } from './body';
import { MediaPicker } from './Media';
import PendingChange from './Pending';
import { RESOURCES } from './resources';
import Translation from './Translation';
import { ChoiceCards, RetreatPick, StepBar, Summary } from './Wizard';
import { layout, locate, minimalOk, norm, slugify, withSuffix } from './wizardLogic';
import {
  Async, Confirm, Empty, Field, ICONS, Icon, PLink, PageHead, Pill, STATUS, StatusPill, fmtDate, fmtDateTime, fromLocalInput,
  clearDirty, toLocalInput, useDirty, useLoad, useToast,
} from './ui';

// Retreat titles for the Fechas screens; only users who can read retreats get them.
const useRetreats = (can) => useLoad(() => (can('retreats', 'read') ? get('/api/admin/retreats') : Promise.resolve([])), []);

const nuevo = (res) => `${res.fem ? 'Nueva' : 'Nuevo'} ${res.one}`;

// ------------------------------------------------------------ list
export function ContentList({ res }) {
  const { can } = useAuth();
  const cat = useCatalogs();
  const [sp, setSp] = useSearchParams();
  const load = useLoad(() => get(`/api/admin/${res.entity}`), [res.entity]);
  const retreats = useRetreats(can);
  const ctx = { ...cat, retreats: retreats.data ?? [] };
  const f = { q: sp.get('q') ?? '', status: sp.get('estado') ?? '', derej: sp.get('derej') ?? '', season: sp.get('tiempo') ?? '', retreat: sp.get('retiro') ?? '' };
  const set = (k, v) => setSp((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n; }, { replace: true });
  const canWrite = can(res.perm, 'write');
  const isRetreat = res.entity === 'retreats';

  return (
    <>
      {(isRetreat || res.entity === 'sessions') && can('retreats', 'read') && can('sessions', 'read') && (
        <nav className="seg" aria-label="Retiros y fechas">
          {[['retreats', 'retiros', 'Retiros'], ['sessions', 'fechas', 'Fechas']].map(([e, path, label]) => (
            <PLink key={e} to={`/${path}`} aria-current={e === res.entity ? 'page' : undefined}>{label}</PLink>
          ))}
        </nav>
      )}
      <PageHead title={res.title}>
        {canWrite && <PLink className="p-btn p-btn-primary" to={`/${res.path}/nuevo${f.retreat ? `?retiro=${f.retreat}` : ''}`}>{nuevo(res)}</PLink>}
      </PageHead>
      <div className="filters" role="search">
        <label>Buscar<input type="search" value={f.q} onChange={(e) => set('q', e.target.value)} placeholder="Texto del título…" /></label>
        <label>Estado
          <select value={f.status} onChange={(e) => set('estado', e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([s, label]) => <option key={s} value={s}>{label}</option>)}
          </select>
        </label>
        {isRetreat && <>
          <label>Dérej<select value={f.derej} onChange={(e) => set('derej', e.target.value)}><option value="">Todos</option>{cat.derej.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></label>
          <label>Tiempo litúrgico<select value={f.season} onChange={(e) => set('tiempo', e.target.value)}><option value="">Todos</option>{cat.seasons.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></label>
        </>}
        {res.entity === 'sessions' && (
          <label>Retiro<select value={f.retreat} onChange={(e) => set('retiro', e.target.value)}><option value="">Todos</option>{(retreats.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></label>
        )}
      </div>
      <Async load={load}>
        {(rows) => {
          const shown = rows.filter((r) => (!f.q || norm(res.label(r)).includes(norm(f.q)))
            && (!f.status || r.status === f.status) && (!f.derej || r.derej_slug === f.derej)
            && (!f.season || r.season_slug === f.season || r.season_secondary?.includes(f.season)) && (!f.retreat || String(r.retreat_id) === f.retreat))
            .sort((a, b) => (res.entity === 'sessions' ? a.starts_on.localeCompare(b.starts_on) : new Date(b.updated_at) - new Date(a.updated_at)));
          if (!rows.length) return <Empty title={`Aún no hay ${res.title.toLowerCase()}.`}>{canWrite ? `Crea el primero con el botón “${nuevo(res)}”.` : 'Cuando alguien los cree aparecerán aquí.'}</Empty>;
          if (!shown.length) return <Empty title="Nada coincide con esos filtros.">Prueba quitar alguno.</Empty>;
          return (
            <div className="table-wrap">
              <table className="tbl stack">
                <caption className="sr-only">{res.title}</caption>
                <thead><tr><th scope="col">Nombre</th><th scope="col">Detalle</th><th scope="col">Estado</th><th scope="col">Actualizado</th></tr></thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} style={r.season_slug ? { '--season': `var(--season-${r.season_slug}, var(--p-line))` } : undefined}>
                      <td data-label="Nombre"><PLink className="p-row-link" to={`/${res.path}/${r.id}`}>{res.label(r)}</PLink></td>
                      <td data-label="Detalle">{res.meta(r, ctx)}</td>
                      <td data-label="Estado"><StatusPill status={r.status} /></td>
                      <td data-label="Actualizado" className="p-num">{fmtDate(r.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
      </Async>
    </>
  );
}

// ------------------------------------------------------------ form <-> payload
const rowOf = (x) => (x && typeof x === 'object' ? { title: x.title ?? x.titulo ?? '', text: x.text ?? x.detalle ?? '' } : { title: '', text: String(x ?? '') });
function fromItem(f, v) {
  switch (f.t) {
    case 'bool': return !!v;
    case 'multi': return Array.isArray(v) ? v : [];
    case 'json': return v == null ? '' : JSON.stringify(v, null, 2);
    case 'body': return bodyToForm(v);
    case 'itin': return Array.isArray(v) ? v.map(rowOf) : [];
    case 'datetime': return toLocalInput(v);
    default: return v == null ? '' : String(v);
  }
}
const toState = (res, it, seed = {}) => Object.fromEntries(res.fields.map((f) => [f.n, fromItem(f, it?.[f.n] ?? seed[f.n])]));

function toPayload(res, st) {
  const out = {};
  for (const f of res.fields) {
    const v = st[f.n];
    if (f.t === 'bool') out[f.n] = v;
    else if (f.t === 'multi') out[f.n] = v.length ? v : null;
    else if (f.t === 'json') out[f.n] = v.trim() ? JSON.parse(v) : null;
    else if (f.t === 'body') out[f.n] = formToBody(v);
    else if (f.t === 'media') out[f.n] = v.trim() || null;
    else if (f.t === 'itin') { const r = v.map((x) => ({ title: x.title.trim(), text: x.text.trim() })).filter((x) => x.title || x.text); out[f.n] = r.length ? r : null; }
    else if (f.t === 'datetime') out[f.n] = fromLocalInput(v);
    else {
      const s = v.trim();
      if (s === '') { if (!f.req && !f.omit) out[f.n] = null; } else out[f.n] = f.t === 'number' || f.num ? Number(s) : s;
    }
  }
  return out;
}

function validate(res, st) {
  const e = {};
  for (const f of res.fields) {
    const v = st[f.n];
    if (f.t === 'body') { const m = bodyErrors(v); if (m) e[f.n] = m; continue; }
    const s = typeof v === 'string' ? v.trim() : v;
    if (f.req && !s) { e[f.n] = 'Este campo es obligatorio.'; continue; }
    if (!s || typeof s !== 'string') continue;
    if (f.max && f.t !== 'number' && s.length > f.max) e[f.n] = `Máximo ${f.max} caracteres (llevas ${s.length}).`;
    else if (f.slug && !/^[a-z0-9-]{2,80}$/.test(s)) e[f.n] = 'Solo minúsculas, números y guiones, de 2 a 80 caracteres.';
    else if (f.t === 'number' && (!Number.isInteger(Number(s)) || Number(s) < (f.min ?? 0) || Number(s) > (f.max ?? 1e9))) e[f.n] = `Escribe un número entero${f.max ? ` de ${f.min ?? 0} a ${f.max}` : ' desde ' + (f.min ?? 0)}.`;
    else if (f.t === 'json') { try { const j = JSON.parse(s); if (!j || typeof j !== 'object' || Array.isArray(j)) e[f.n] = 'Debe ser un objeto JSON, por ejemplo { "temas": [] }.'; } catch { e[f.n] = 'El JSON no es válido.'; } }
    else if (f.after && st[f.after] && s < st[f.after]) e[f.n] = 'No puede ser anterior a la fecha de inicio.';
  }
  if (res.needsTitleOrRetreat && !st.retreat_id && !st.title.trim()) e.title = 'Elige un retiro o escribe un título.';
  return e;
}

// ------------------------------------------------------------ inputs
function Inputs({ res, fields = res.fields, st, setSt, errors, ctx, disabled }) {
  const up = (n, v) => setSt((s) => ({ ...s, [n]: v }));
  return (
    <div className="p-grid">
      {fields.map((f) => {
        const err = errors[f.n];
        const wrap = f.full ? 'span2' : '';
        if (f.pick === 'retreat') return <div key={f.n} className="span2"><RetreatPick f={f} value={st[f.n]} onChange={(v) => up(f.n, v)} retreats={ctx.retreats ?? []} derej={ctx.derej} error={err} disabled={disabled} /></div>;
        if (f.cards) return <div key={f.n} className="span2"><ChoiceCards f={f} value={st[f.n]} onChange={(v) => up(f.n, v)} opts={f.opts(ctx)} meta={(v) => f.cards(v, ctx)} error={err} disabled={disabled} /></div>;
        if (f.t === 'bool') {
          return <div key={f.n} className={`p-field ${wrap}`}><label className="p-check"><input type="checkbox" checked={st[f.n]} disabled={disabled} onChange={(e) => up(f.n, e.target.checked)} /> {f.label}</label></div>;
        }
        if (f.t === 'multi') {
          return (
            <fieldset key={f.n} className={`p-field ${wrap}`} disabled={disabled}>
              <legend>{f.label}</legend>
              <div className="checks">{f.opts(ctx).map(([v, l]) => (
                <label key={v} className="p-check"><input type="checkbox" checked={st[f.n].includes(v)} onChange={(e) => up(f.n, e.target.checked ? [...st[f.n], v] : st[f.n].filter((x) => x !== v))} /> {l}</label>
              ))}</div>
              {err && <p className="p-err">{err}</p>}
            </fieldset>
          );
        }
        if (f.t === 'media') {
          return <div key={f.n} className={wrap}><MediaPicker label={f.label} help={f.help} error={err} value={st[f.n]} disabled={disabled} onChange={(v) => up(f.n, v)} /></div>;
        }
        if (f.t === 'body') {
          return <fieldset key={f.n} className={`p-field ${wrap}`}><legend>{f.label}</legend><BodyEditor value={st[f.n]} onChange={(v) => up(f.n, v)} disabled={disabled} error={err} compact={!!res.steps} /></fieldset>;
        }
        if (f.t === 'itin') {
          const rows = st[f.n];
          const set = (i, k, v) => up(f.n, rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
          return (
            <fieldset key={f.n} className={`p-field ${wrap}`} disabled={disabled}>
              <legend>{f.label}</legend>
              {!rows.length && <p className="help">Aún no hay días. Agrega el primero.</p>}
              {rows.map((r, i) => (
                <div key={i} className="itin-row">
                  <Field label={`Día ${i + 1}: título`}>{(p) => <input {...p} value={r.title} onChange={(e) => set(i, 'title', e.target.value)} />}</Field>
                  <Field label={`Día ${i + 1}: detalle`}>{(p) => <textarea {...p} rows={2} value={r.text} onChange={(e) => set(i, 'text', e.target.value)} />}</Field>
                  <button type="button" className="p-btn p-btn-sm" onClick={() => up(f.n, rows.filter((_, j) => j !== i))}>Quitar día {i + 1}</button>
                </div>
              ))}
              <button type="button" className="p-btn p-btn-sm" onClick={() => up(f.n, [...rows, { title: '', text: '' }])}>Agregar día</button>
              {err && <p className="p-err">{err}</p>}
            </fieldset>
          );
        }
        const opts = f.t === 'select' ? f.opts(ctx) : null;
        return (
          <div key={f.n} className={wrap}>
            <Field label={f.label} help={f.help} error={err} required={f.req}>
              {(p) => {
                const common = { ...p, name: f.n, value: st[f.n], disabled, onChange: (e) => up(f.n, e.target.value) };
                if (f.t === 'select') return <select {...common}><option value="">{f.req ? 'Elige…' : '— Ninguno —'}</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
                if (f.t === 'textarea') return <textarea {...common} rows={4} />;
                if (f.t === 'json') return <textarea {...common} rows={10} className="mono" spellCheck={false} />;
                if (f.t === 'number') return <input {...common} type="number" inputMode="numeric" min={f.min ?? 0} max={f.max} />;
                if (f.t === 'date') return <input {...common} type="date" />;
                if (f.t === 'datetime') return <input {...common} type="datetime-local" />;
                return <input {...common} type="text" maxLength={f.max ? f.max + 50 : undefined} />;
              }}
            </Field>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------ form screen
// Opening another record remounts the screen. When this screen creates its own record the address changes
// (/nuevo -> /12?paso=3) but the form stays: same text, same step, and reloading opens that draft.
export function ContentForm(props) {
  const where = `${props.res.entity}:${useParams().id}`;
  const k = useRef({ where, n: 0, own: null });
  if (k.current.where !== where) k.current = { where, n: k.current.n + (where === k.current.own ? 0 : 1), own: where === k.current.own ? where : null };
  return <FormScreen key={k.current.n} {...props} claim={(id) => { k.current.own = `${props.res.entity}:${id}`; }} />;
}

function FormScreen({ res, claim }) {
  const { id: idParam } = useParams();
  const [started] = useState(idParam === 'nuevo'); // stays true after the address learns the id
  // A step-by-step form that creates its record on the first save keeps the screen (and its place) and just learns the id.
  const [rid, setRid] = useState(started ? null : Number(idParam));
  const { can } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [sp] = useSearchParams();
  const cat = useCatalogs();
  const retreats = useRetreats(can);
  const ctx = { ...cat, retreats: retreats.data ?? [] };
  const item = useLoad(() => (rid ? get(`/api/admin/${res.entity}/${rid}`) : Promise.resolve(null)), [res.entity, rid]);
  const reviews = useLoad(() => (rid ? get(`/api/admin/${res.entity}/${rid}/reviews`) : Promise.resolve([])), [res.entity, rid]);
  const reload = () => { item.reload(); reviews.reload(); };
  const body = (it) => (
    <FormBody key={res.steps ? res.entity : `${res.entity}${idParam}${it?.version}${it?.status}`} res={res} item={it} isNew={!rid} reviews={reviews.data ?? []}
      seed={{ retreat_id: sp.get('retiro') ?? '' }} startStep={Number(sp.get('paso')) || 1} ctx={ctx} can={can} nav={nav} toast={toast} reload={reload} onCreated={(id) => { claim(id); setRid(id); }} />
  );

  return (
    <>
      <nav aria-label="Ruta" className="crumbs"><PLink to={`/${res.path}`}>{res.title}</PLink> <span aria-hidden="true">/</span> <span>{rid ? 'Editar' : nuevo(res)}</span></nav>
      {/* Once the steps are on screen a failed background reload must never replace them (and the text typed in them). */}
      {res.steps && (item.data || started) ? body(item.data) : <Async load={item}>{body}</Async>}
    </>
  );
}

function FormBody({ res, item, isNew, reviews, seed, startStep, ctx, can, nav, toast, reload, onCreated }) {
  const wiz = !!res.steps;
  const hasSlug = res.fields.some((f) => f.n === 'slug');
  const [init] = useState(() => toState(res, item, seed));
  const [st, setSt] = useState(init);
  const [base, setBase] = useState(() => JSON.stringify(init)); // the last state the server has
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [step, setStep] = useState(() => (wiz && item ? Math.min(Math.max(startStep, 1), res.steps.length) - 1 : 0)); // reloading /12?paso=3 reopens step 3
  const [max, setMax] = useState(step);
  const [made, setMade] = useState(item?.id ?? null); // id of the saved record: the address follows it
  const [conflict, setConflict] = useState(null); // someone else saved first: { latest, changed }
  const loc = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sv, setSv] = useState('idle'); // idle | saving | saved | error
  const [done, setDone] = useState(null);
  const [tick, setTick] = useState(0);
  const stRef = useRef(st);
  stRef.current = st;
  const ridRef = useRef(item?.id ?? null);
  const verRef = useRef(item?.version ?? null); // the version this form is editing from; sent so a concurrent save is noticed
  const baseRef = useRef(null);
  const slugManual = useRef(false);
  const queue = useRef(Promise.resolve());
  const root = useRef(null);
  const head = useRef(null);
  const seen = useRef(false);
  const wasRejected = useRef(false);
  baseRef.current = base;
  const dirty = JSON.stringify(st) !== base;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useDirty(dirty);

  const have = !isNew && !!item;
  const status = item?.status ?? 'borrador';
  if (status === 'rechazado') wasRejected.current = true;
  const canWrite = can(res.perm, 'write');
  const locked = !canWrite || status === 'en_revision';
  // Autosave only touches drafts and rejected items; published/scheduled content keeps the explicit save.
  const canAuto = wiz && canWrite && !conflict && (status === 'borrador' || status === 'rechazado');
  const lastReject = wasRejected.current ? reviews.find((r) => r.decision === 'rechazado') : null;
  const lay = wiz ? layout(res, st, ctx) : null;
  const tstat = useLoad(() => (wiz && canWrite && res.tr?.length ? get('/api/admin/translate/status') : Promise.resolve(null)), []);

  // Someone else changed the record (a quick fix, a translation, our own save): follow it unless there is unsaved typing.
  useEffect(() => {
    if (!wiz || !item || dirtyRef.current) return;
    if (verRef.current != null && item.version < verRef.current) return; // an older reload arriving late
    verRef.current = item.version;
    const n = toState(res, item);
    setSt(n);
    setBase(JSON.stringify(n));
  }, [item?.version, item?.status]); // eslint-disable-line

  // The address always points at the saved record and its step, replacing the entry so Back never lands on an empty /nuevo.
  useEffect(() => {
    if (!wiz || !made) return;
    const to = `/${res.path}/${made}?paso=${step + 1}`;
    if (loc.pathname + loc.search !== to) nav(to, { replace: true });
  }, [made, step]); // eslint-disable-line

  // New step: focus its title (screen readers announce it); after an error, the first wrong field instead.
  useEffect(() => {
    if (!seen.current) { seen.current = true; return; }
    (root.current?.querySelector('[aria-invalid="true"]') ?? head.current)?.focus();
  }, [step, tick]);

  // The address follows the title only while creating and until someone types in it.
  const change = (fn) => setSt((s) => {
    const n = typeof fn === 'function' ? fn(s) : fn;
    if (!hasSlug || !wiz || ridRef.current) return n;
    if (n.slug !== s.slug) { slugManual.current = n.slug !== ''; return n; }
    return !slugManual.current && n.title !== s.title ? { ...n, slug: slugify(n.title) } : n;
  });
  const autoSlug = () => hasSlug && wiz && !ridRef.current && !slugManual.current;
  // An address that cannot be built from the title is a problem with the title, which is what the person can fix.
  const remap = (e) => {
    if (!e.slug || !autoSlug() || e.title) return e;
    const { slug: _, ...rest } = e;
    return { ...rest, title: 'Escribe un nombre con al menos 2 letras o números.' };
  };

  // Shows a server/field error where it lives: its step, or "Más opciones" at the end.
  const reveal = (m) => {
    const at = Object.keys(m).map((n) => locate(layout(res, stRef.current, ctx), n));
    if (!at.length) return;
    if (at.includes(-1)) setMoreOpen(true);
    const to = Math.min(...at.filter((i) => i >= 0), res.steps.length - 1);
    setStep(to);
    setMax((x) => Math.max(x, to));
    setTick((t) => t + 1);
  };
  const fail = (e) => {
    let m = Object.fromEntries(Object.entries(fieldErrors(e)).map(([k, v]) => [k.split('.')[0], v]));
    if (e.code === 'duplicate' && hasSlug) m = { slug: 'Ya hay otro con esta dirección. Cámbiala en «Más opciones», por ejemplo agregando un número.' };
    setErrors(m);
    toast(errText(e), 'error');
    if (wiz) reveal(m);
  };

  // A PATCH carrying the version we read. If someone saved first and changed nothing we edited, adopt their version and
  // go on (translations and our own chained saves land here); otherwise keep our text and offer to load theirs.
  async function patchWithVersion(id, body) {
    const url = `/api/admin/${res.entity}/${id}`;
    const send = async () => (await patch(url, verRef.current ? { ...body, version: verRef.current } : body))?.version ?? verRef.current;
    try { verRef.current = await send(); } catch (x) {
      if (x?.code !== 'version_conflict') throw x;
      const latest = await get(url);
      const was = toPayload(res, JSON.parse(baseRef.current)); // compared as payloads, so trimming etc. is not a "change"
      const now = toPayload(res, toState(res, latest));
      const changed = res.fields.filter((f) => JSON.stringify(now[f.n]) !== JSON.stringify(was[f.n])).map((f) => f.label);
      if (changed.length) { setConflict({ latest, changed }); throw x; }
      verRef.current = latest.version;
      verRef.current = await send();
    }
  }

  // Writes the current state: creates the record the first time, updates it after. Never throws; nothing typed is cleared.
  async function persist() {
    const snap = stRef.current;
    setSv('saving');
    try {
      const body = toPayload(res, snap);
      let id = ridRef.current;
      let saved = snap;
      if (id) await patchWithVersion(id, body);
      else {
        const auto = autoSlug();
        for (let n = 1; ; n++) { // a taken address gets -2, -3… when we built it; a hand-typed one is reported instead
          const b = auto && n > 1 ? { ...body, slug: withSuffix(slugify(snap.title), n) } : body;
          try { id = (await post(`/api/admin/${res.entity}`, b)).id; if (b !== body) saved = { ...snap, slug: b.slug }; break; } catch (x) { if (!(auto && n < 6 && x?.code === 'duplicate')) throw x; }
        }
        verRef.current = 1; // a new row starts at version 1
        if (wiz) { ridRef.current = id; setMade(id); onCreated(id); } // claim the new address before the URL follows
        if (saved !== snap) setSt((s) => (s.slug === snap.slug ? { ...s, slug: saved.slug } : s));
      }
      setBase(JSON.stringify(saved));
      setSv('saved');
      if (wiz && item) reload();
      return id;
    } catch (x) {
      setSv('error');
      if (x instanceof ApiError) fail(x); else toast('Ocurrió un error inesperado.', 'error');
      return null;
    }
  }
  const enqueue = (fn) => { const p = queue.current.then(fn); queue.current = p.catch(() => {}); return p; };

  // Returns the item id on success, null if validation/server rejected it.
  async function save() {
    const e = remap(validate(res, stRef.current));
    setErrors(e);
    if (Object.keys(e).length) { toast('Revisa los campos marcados.', 'error'); if (wiz) reveal(e); return null; }
    return enqueue(persist);
  }
  const run = (name, fn) => async () => { setBusy(name); try { await fn(); } finally { setBusy(''); } };

  const saveDraft = run('save', async () => {
    const nid = await save();
    if (!nid) return;
    toast('Borrador guardado.');
    clearDirty();
    if (wiz) return;
    if (isNew) nav(`/${res.path}/${nid}`, { replace: true }); else reload();
  });
  const loadTheirs = () => {
    const n = toState(res, conflict.latest);
    setSt(n); setBase(JSON.stringify(n)); setErrors({}); setSv('idle');
    verRef.current = conflict.latest.version;
    setConflict(null);
    reload();
  };
  const keepMine = async () => { verRef.current = conflict.latest.version; setConflict(null); await saveDraft(); };
  const submit = run('submit', async () => {
    const nid = dirty || !ridRef.current ? await save() : ridRef.current;
    if (!nid) return;
    try {
      await post(`/api/admin/${res.entity}/${nid}/submit`);
      toast('Enviado a revisión. Te avisaremos con la decisión.');
      clearDirty();
      if (wiz) { setDone({ id: nid }); reload(); } else if (isNew) nav(`/${res.path}/${nid}`, { replace: true }); else reload();
    } catch (x) { toast(errText(x), 'error'); }
  });
  const remove = run('del', async () => {
    try { await del(`/api/admin/${res.entity}/${item.id}`); toast('Eliminado.'); clearDirty(); nav(`/${res.path}`, { replace: true }); } catch (x) { toast(errText(x), 'error'); setConfirmDel(false); }
  });

  // ---- steps
  function go(to) {
    if (canAuto && dirty && minimalOk(res, validate(res, st))) enqueue(persist); // leaving a step saves the draft once the server's minimum is there
    setStep(to);
    setMax((x) => Math.max(x, to));
    setErrors({});
  }
  function next() {
    const names = lay.steps[step].fields.map((f) => f.n);
    const e = Object.fromEntries(Object.entries(remap(validate(res, st))).filter(([n]) => names.includes(n)));
    setErrors(e);
    if (Object.keys(e).length) setTick((t) => t + 1); else go(step + 1);
  }

  if (done) return <Done res={res} id={done.id} title={res.label(st)} can={can} en={!!tstat.data?.enabled && !!res.tr?.length} headRef={head} />;

  const last = wiz && step === res.steps.length - 1;
  const form = wiz ? (
    <div className="wiz" ref={root}>
      <StepBar steps={lay.steps} step={step} max={max} free={have} go={go} />
      <div className="wiz-prog" role="progressbar" aria-label="Avance" aria-valuemin={1} aria-valuemax={lay.steps.length} aria-valuenow={step + 1}><span style={{ width: `${((step + 1) / lay.steps.length) * 100}%` }} /></div>
      <h2 className="wiz-title" ref={head} tabIndex={-1}><span className="wiz-count">Paso {step + 1} de {lay.steps.length}</span>{lay.steps[step].title}</h2>
      <p className="help">{lay.steps[step].ask}</p>
      {last ? (
        <Final res={res} lay={lay} st={st} ctx={ctx} errors={{ ...remap(validate(res, st)), ...errors }} change={change} disabled={locked} moreOpen={moreOpen} setMoreOpen={setMoreOpen} go={go} en={!!tstat.data?.enabled} locked={locked} canWrite={canWrite} />
      ) : <Inputs res={res} fields={lay.steps[step].fields} st={st} setSt={change} errors={errors} ctx={ctx} disabled={locked} />}
    </div>
  ) : <Inputs res={res} st={st} setSt={setSt} errors={errors} ctx={ctx} disabled={locked} />;

  const saveText = sv === 'saving' ? 'Guardando…' : sv === 'error' ? 'No se pudo guardar. Lo que escribiste sigue aquí.'
    : dirty ? (canAuto ? 'Se guardará al cambiar de paso.' : 'Cambios sin guardar.') : sv === 'saved' ? 'Guardado' : isNew ? 'Se guarda solo al pasar al siguiente paso.' : 'Todo guardado.';

  return (
    <div className="split">
      <div className="main-col">
      <form className="card" onSubmit={(e) => { e.preventDefault(); if (!wiz) saveDraft(); else if (!last) next(); }} noValidate>
        <PageHead title={have ? res.label(item) : nuevo(res)}>
          {have && <StatusPill status={status} />}
        </PageHead>
        {lastReject && <div className="banner banner-red" role="alert"><strong>Rechazado por {lastReject.reviewer_name ?? 'quien revisa'}:</strong> {lastReject.comment}<br /><span className="help">Corrige y vuelve a enviar a revisión.</span></div>}
        {conflict && (
          <div className="banner banner-red" role="alert">
            <strong>Alguien más guardó cambios mientras escribías.</strong> Cambió: {conflict.changed.join(', ')}. Lo que escribiste sigue aquí, no se perdió nada.
            <div className="p-row wrap">
              <button type="button" className="p-btn p-btn-big" disabled={!!busy} onClick={loadTheirs}>Cargar lo nuevo</button>
              <button type="button" className="p-btn p-btn-big" disabled={!!busy} onClick={keepMine}>Guardar lo mío encima</button>
            </div>
            <p className="help">«Cargar lo nuevo» cambia lo que ves por lo que guardó la otra persona. «Guardar lo mío encima» deja tu texto como versión final.</p>
          </div>
        )}
        {status === 'en_revision' && <div className="banner banner-gold" role="status">Está en revisión: no se puede editar hasta que haya una decisión.</div>}
        {!canWrite && <div className="banner" role="status">Tu rol solo puede consultar este contenido{can(res.perm, 'quick_fix') && item?.published_snapshot ? ' y corregir erratas en lo publicado' : ''}.</div>}
        {errors._ && <p className="form-error" role="alert">{errors._}</p>}
        {form}
        {wiz ? (
          <div className="actions wiz-bar">
            <p className={`wiz-save wiz-save-${sv}`} role="status"><Icon d={sv === 'error' ? ICON_ALERT : sv === 'saved' && !dirty ? ICON_OK : ICON_DOT} />{saveText}</p>
            <div className="wiz-nav">
              {step > 0 && <button type="button" className="p-btn" onClick={() => go(step - 1)}>Atrás</button>}
              {sv === 'error' && canWrite && <button type="button" className="p-btn" disabled={!!busy} onClick={run('retry', saveDraft)}>Reintentar</button>}
              {!last && <button type="button" className="p-btn p-btn-primary" onClick={next}>Siguiente</button>}
              {!canAuto && canWrite && !locked && dirty && <button type="button" className="p-btn" disabled={!!busy} onClick={saveDraft}>{busy === 'save' ? 'Guardando…' : 'Guardar cambios'}</button>}
              {last && canWrite && !locked && <>
                <button type="button" className="p-btn" disabled={!!busy || (!dirty && !isNew)} onClick={saveDraft}>{busy === 'save' ? 'Guardando…' : 'Guardar borrador'}</button>
                <button type="button" className="p-btn p-btn-primary" onClick={submit} disabled={!!busy || (!isNew && status !== 'borrador' && status !== 'rechazado' && !dirty)}>{busy === 'submit' ? 'Enviando…' : 'Enviar a revisión'}</button>
              </>}
              {have && !item.published_snapshot && status !== 'en_revision' && canWrite && <button type="button" className="p-btn p-btn-danger-ghost" onClick={() => setConfirmDel(true)}><Icon d={ICONS.trash} />Eliminar</button>}
            </div>
          </div>
        ) : canWrite && (
          <div className="actions">
            <button type="submit" className="p-btn" disabled={locked || !!busy || (!dirty && !isNew)}>{busy === 'save' ? 'Guardando…' : 'Guardar borrador'}</button>
            <button type="button" className="p-btn p-btn-primary" onClick={submit} disabled={locked || !!busy || (!isNew && status !== 'borrador' && status !== 'rechazado' && !dirty)}>{busy === 'submit' ? 'Enviando…' : 'Enviar a revisión'}</button>
            {have && !item.published_snapshot && status !== 'en_revision' && <button type="button" className="p-btn p-btn-danger-ghost" onClick={() => setConfirmDel(true)}><Icon d={ICONS.trash} />Eliminar</button>}
            {dirty && <span className="help" role="status">Cambios sin guardar</span>}
          </div>
        )}
      </form>
      {have && res.tr?.length > 0 && <Translation res={res} item={item} canWrite={canWrite} locked={status === 'en_revision'} esDirty={dirty} toast={toast} reload={reload} />}
      </div>
      <aside className="side">
        {have && <Facts item={item} res={res} />}
        {have && <PendingChange res={res} item={item} canAct={can(res.perm, 'write') || can(res.perm, 'approve')} toast={toast} reload={reload} />}
        {have && can(res.perm, 'quick_fix') && item.published_snapshot && <QuickFix res={res} item={item} toast={toast} reload={reload} />}
        {have && <History reviews={reviews} />}
        {res.entity === 'retreats' && have && can('sessions', 'read') && <section className="card"><h2>Fechas</h2><PLink to={`/fechas?retiro=${item.id}`}>Ver las fechas de este retiro</PLink></section>}
      </aside>
      {confirmDel && <Confirm title="Eliminar borrador" danger confirmLabel="Eliminar" onConfirm={remove} onCancel={() => setConfirmDel(false)} busy={busy === 'del'}>
        <p>Se eliminará “{res.label(item)}” de forma permanente. Solo se puede si nunca se publicó.</p></Confirm>}
    </div>
  );
}

const ICON_OK = 'M5 12l5 5 9-10';
const ICON_ALERT = 'M12 4l9 16H3zM12 10v4M12 17.5v.01';
const ICON_DOT = 'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0';

// Last step: what is still missing, the written summary, the extra options, and what happens after sending.
function Final({ res, lay, st, ctx, errors, change, disabled, moreOpen, setMoreOpen, go, en, locked, canWrite }) {
  const keys = Object.keys(errors);
  const label = (n) => res.fields.find((f) => f.n === n)?.label ?? n;
  const open = moreOpen || keys.some((n) => lay.more.some((f) => f.n === n));
  return (
    <>
      {keys.length > 0 && !locked && (
        <div className="banner banner-red" role="alert">
          <strong>Antes de enviar hay que arreglar esto:</strong>
          <ul className="fix-list">{keys.map((n) => {
            const at = locate(lay, n);
            return <li key={n}><span>{label(n)}: {errors[n]}</span> <button type="button" className="p-btn p-btn-sm" onClick={() => (at >= 0 ? go(at) : setMoreOpen(true))}>{at >= 0 ? `Ir al paso ${at + 1}` : 'Ver en Más opciones'}</button></li>;
          })}</ul>
        </div>
      )}
      <Summary steps={lay.steps} st={st} ctx={ctx} go={go} />
      {lay.more.length > 0 && (
        <details className="more-opts" open={open} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
          <summary>Más opciones</summary>
          <p className="help">{lay.more.map((f) => f.label).join(', ')}.</p>
          <Inputs res={res} fields={lay.more} st={st} setSt={change} errors={errors} ctx={ctx} disabled={disabled} />
        </details>
      )}
      {canWrite && !locked && en && <p className="banner banner-gold">Al enviarlo preparamos una traducción al inglés para que quien revise la vea antes de publicar. No cambiamos una versión escrita a mano y los versículos nunca se traducen solos.</p>}
    </>
  );
}

// Shown after sending; a retreat offers to add its first date right away.
function Done({ res, id, title, can, en, headRef }) {
  const dates = res.entity === 'retreats' && can('sessions', 'write');
  useEffect(() => { headRef.current?.focus(); }, [headRef]);
  return (
    <section className="card wiz-done">
      <h2 ref={headRef} tabIndex={-1}>Listo, enviaste «{title}» a revisión</h2>
      <p>Nadie lo verá en el sitio hasta que alguien lo apruebe. Te avisaremos cuando haya una decisión.</p>
      {en && <p className="help">También se prepara la versión en inglés para quien revise.</p>}
      {dates && (
        <>
          <h3>¿Agregar una fecha?</h3>
          <p>Puedes preparar la fecha ahora, aunque el retiro todavía esté en revisión. La fecha también pasa por revisión.</p>
          <PLink className="p-btn p-btn-primary p-btn-big" to={`/fechas/nuevo?retiro=${id}`}>Agregar una fecha</PLink>
        </>
      )}
      <p><PLink className="p-btn" to={`/${res.path}`}>Volver a {res.title.toLowerCase()}</PLink></p>
    </section>
  );
}

function Facts({ item }) {
  return (
    <section className="card">
      <h2>Estado</h2>
      <dl className="facts">
        <dt>Versión</dt><dd className="p-num">{item.version}</dd>
        <dt>Actualizado</dt><dd className="p-num">{fmtDateTime(item.updated_at)}</dd>
        <dt>En vivo desde</dt><dd className="p-num">{item.published_snapshot ? fmtDateTime(item.live_from) : 'No publicado'}</dd>
        {item.publish_at && <><dt>Publicación sugerida</dt><dd className="p-num">{fmtDateTime(item.publish_at)}</dd></>}
      </dl>
    </section>
  );
}

function History({ reviews }) {
  return (
    <section className="card">
      <h2>Historial de revisión</h2>
      {!reviews.length ? <p className="help">Aún no se ha enviado a revisión.</p> : (
        <ol className="timeline">
          {reviews.map((r) => (
            <li key={r.id}>
              <Pill status={{ pendiente: 'en_revision', aprobado: 'publicado', rechazado: 'rechazado' }[r.decision]}>{{ pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }[r.decision]}</Pill>
              <span className="p-num"> v{r.version} · {fmtDateTime(r.decided_at ?? r.created_at)}</span>
              <p className="help">Envió {r.submitted_by_name}{r.reviewer_name ? ` · revisó ${r.reviewer_name}` : ''}</p>
              {r.comment && <blockquote>{r.comment}</blockquote>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// Typo fix straight on live content: text fields only, comment required, audited server-side.
function QuickFix({ res, item, toast, reload }) {
  const snap = item.published_snapshot;
  const fields = res.fields.filter((f) => res.text.includes(f.n));
  const [v, setV] = useState(() => Object.fromEntries(fields.map((f) => [f.n, snap[f.n] ?? ''])));
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const changed = Object.fromEntries(fields.filter((f) => v[f.n] !== (snap[f.n] ?? '')).map((f) => [f.n, v[f.n].trim()]));
  const send = async (e) => {
    e.preventDefault();
    const blank = fields.find((f) => f.req && changed[f.n] === '');
    if (blank) return setErr(`“${blank.label}” no puede quedar vacío.`);
    if (!Object.keys(changed).length) return setErr('No cambiaste nada.');
    if (!comment.trim()) return setErr('Explica brevemente qué corriges.');
    setBusy(true);
    try { await post(`/api/admin/${res.entity}/${item.id}/quick-fix`, { comment, patch: changed }); toast('Corrección publicada y registrada en el historial.'); setComment(''); reload(); } catch (x) { setErr(errText(x)); } finally { setBusy(false); }
  };
  return (
    <details className="card">
      <summary><h2 className="inline">Corregir errata en lo publicado</h2></summary>
      <form onSubmit={send} noValidate>
        <p className="help">Se publica de inmediato, sin revisión. Solo textos; queda en el historial.</p>
        {fields.map((f) => <Field key={f.n} label={f.label}>{(p) => (f.t === 'textarea' ? <textarea {...p} rows={3} value={v[f.n]} onChange={(e) => setV({ ...v, [f.n]: e.target.value })} /> : <input {...p} value={v[f.n]} onChange={(e) => setV({ ...v, [f.n]: e.target.value })} />)}</Field>)}
        <Field label="Qué corriges" required>{(p) => <input {...p} value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="p-btn" disabled={busy}>Publicar corrección</button>
      </form>
    </details>
  );
}

export const CONTENT = RESOURCES;
