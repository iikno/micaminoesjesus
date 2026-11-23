import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, del, errText, fieldErrors, get, patch, post } from './api';
import { useAuth, useCatalogs } from './session';
import BodyEditor from './BodyEditor';
import { bodyErrors, bodyToForm, formToBody } from './body';
import { MediaPicker } from './Media';
import PendingChange from './Pending';
import { RESOURCES } from './resources';
import Translation from './Translation';
import {
  Async, Confirm, Empty, Field, PLink, PageHead, StatusPill, fmtDate, fmtDateTime, fromLocalInput,
  clearDirty, toLocalInput, useDirty, useLoad, useToast,
} from './ui';

const norm = (s) => (s ?? '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Retreat titles for the Fechas screens; only users who can read retreats get them.
const useRetreats = (can) => useLoad(() => (can('retreats', 'read') ? get('/api/admin/retreats') : Promise.resolve([])), []);

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
      <PageHead title={res.title}>
        {canWrite && <PLink className="p-btn p-btn-primary" to={`/panel/${res.path}/nuevo${f.retreat ? `?retiro=${f.retreat}` : ''}`}>Nuevo {res.one}</PLink>}
      </PageHead>
      <div className="filters" role="search">
        <label>Buscar<input type="search" value={f.q} onChange={(e) => set('q', e.target.value)} placeholder="Texto del título…" /></label>
        <label>Estado
          <select value={f.status} onChange={(e) => set('estado', e.target.value)}>
            <option value="">Todos</option>
            {['borrador', 'en_revision', 'programado', 'publicado', 'rechazado'].map((s) => <option key={s} value={s}>{{ borrador: 'Borrador', en_revision: 'En revisión', programado: 'Programado', publicado: 'Publicado', rechazado: 'Rechazado' }[s]}</option>)}
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
          if (!rows.length) return <Empty title={`Aún no hay ${res.title.toLowerCase()}.`}>{canWrite ? `Crea el primero con el botón “Nuevo ${res.one}”.` : 'Cuando alguien los cree aparecerán aquí.'}</Empty>;
          if (!shown.length) return <Empty title="Nada coincide con esos filtros.">Prueba quitar alguno.</Empty>;
          return (
            <div className="table-wrap">
              <table className="tbl stack">
                <caption className="sr-only">{res.title}</caption>
                <thead><tr><th scope="col">Nombre</th><th scope="col">Detalle</th><th scope="col">Estado</th><th scope="col">Actualizado</th></tr></thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Nombre"><PLink className="p-row-link" to={`/panel/${res.path}/${r.id}`}>{res.label(r)}</PLink></td>
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
function Inputs({ res, st, setSt, errors, ctx, disabled }) {
  const up = (n, v) => setSt((s) => ({ ...s, [n]: v }));
  return (
    <div className="p-grid">
      {res.fields.map((f) => {
        const err = errors[f.n];
        const wrap = f.full ? 'span2' : '';
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
          return <fieldset key={f.n} className={`p-field ${wrap}`}><legend>{f.label}</legend><BodyEditor value={st[f.n]} onChange={(v) => up(f.n, v)} disabled={disabled} error={err} /></fieldset>;
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
// Keyed by id so moving from /nuevo to the saved item remounts instead of rendering stale (null) data.
export const ContentForm = (props) => <FormScreen key={useParams().id} {...props} />;

function FormScreen({ res }) {
  const { id: idParam } = useParams();
  const isNew = idParam === 'nuevo';
  const id = isNew ? null : Number(idParam);
  const { can } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [sp] = useSearchParams();
  const cat = useCatalogs();
  const retreats = useRetreats(can);
  const ctx = { ...cat, retreats: retreats.data ?? [] };
  const item = useLoad(() => (isNew ? Promise.resolve(null) : get(`/api/admin/${res.entity}/${id}`)), [res.entity, idParam]);
  const reviews = useLoad(() => (isNew ? Promise.resolve([]) : get(`/api/admin/${res.entity}/${id}/reviews`)), [res.entity, idParam]);
  const reload = () => { item.reload(); reviews.reload(); };

  return (
    <>
      <nav aria-label="Ruta" className="crumbs"><PLink to={`/panel/${res.path}`}>{res.title}</PLink> <span aria-hidden="true">/</span> <span>{isNew ? `Nuevo ${res.one}` : 'Editar'}</span></nav>
      <Async load={item}>
        {(it) => (
          <FormBody key={`${res.entity}${idParam}${it?.version}${it?.status}`} res={res} item={it} isNew={isNew} reviews={reviews.data ?? []}
            seed={{ retreat_id: sp.get('retiro') ?? '' }} ctx={ctx} can={can} nav={nav} toast={toast} reload={reload} />
        )}
      </Async>
    </>
  );
}

function FormBody({ res, item, isNew, reviews, seed, ctx, can, nav, toast, reload }) {
  const initial = useMemo(() => toState(res, item, seed), [res, item, seed]);
  const [st, setSt] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const dirty = JSON.stringify(st) !== JSON.stringify(initial);
  useDirty(dirty);

  const status = item?.status ?? 'borrador';
  const canWrite = can(res.perm, 'write');
  const locked = !canWrite || status === 'en_revision';
  const lastReject = status === 'rechazado' ? reviews.find((r) => r.decision === 'rechazado') : null;

  const fail = (e) => {
    const fe = fieldErrors(e);
    setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k.split('.')[0], v])));
    toast(errText(e), 'error');
  };

  // Returns the item id on success, null if validation/server rejected it.
  async function save() {
    const e = validate(res, st);
    setErrors(e);
    if (Object.keys(e).length) { toast('Revisa los campos marcados.', 'error'); return null; }
    try {
      const body = toPayload(res, st);
      if (isNew) return (await post(`/api/admin/${res.entity}`, body)).id;
      await patch(`/api/admin/${res.entity}/${item.id}`, body);
      return item.id;
    } catch (x) { if (x instanceof ApiError) fail(x); else toast('Ocurrió un error inesperado.', 'error'); return null; }
  }
  const run = (name, fn) => async () => { setBusy(name); try { await fn(); } finally { setBusy(''); } };

  const saveDraft = run('save', async () => {
    const nid = await save();
    if (!nid) return;
    toast('Borrador guardado.');
    clearDirty();
    if (isNew) nav(`/panel/${res.path}/${nid}`, { replace: true }); else reload();
  });
  const submit = run('submit', async () => {
    const nid = dirty || isNew ? await save() : item.id;
    if (!nid) return;
    try {
      await post(`/api/admin/${res.entity}/${nid}/submit`);
      toast('Enviado a revisión. Te avisaremos con la decisión.');
      clearDirty();
      if (isNew) nav(`/panel/${res.path}/${nid}`, { replace: true }); else reload();
    } catch (x) { toast(errText(x), 'error'); }
  });
  const remove = run('del', async () => {
    try { await del(`/api/admin/${res.entity}/${item.id}`); toast('Eliminado.'); clearDirty(); nav(`/panel/${res.path}`, { replace: true }); } catch (x) { toast(errText(x), 'error'); setConfirmDel(false); }
  });

  return (
    <div className="split">
      <div className="main-col">
      <form className="card" onSubmit={(e) => { e.preventDefault(); saveDraft(); }} noValidate>
        <PageHead title={isNew ? `Nuevo ${res.one}` : res.label(item)}>
          {!isNew && <StatusPill status={status} />}
        </PageHead>
        {lastReject && <div className="banner banner-red" role="alert"><strong>Rechazado por {lastReject.reviewer_name ?? 'quien revisa'}:</strong> {lastReject.comment}<br /><span className="help">Corrige y vuelve a enviar a revisión.</span></div>}
        {status === 'en_revision' && <div className="banner banner-gold" role="status">Está en revisión: no se puede editar hasta que haya una decisión.</div>}
        {!canWrite && <div className="banner" role="status">Tu rol solo puede consultar este contenido{can(res.perm, 'quick_fix') && item?.published_snapshot ? ' y corregir erratas en lo publicado' : ''}.</div>}
        {errors._ && <p className="form-error" role="alert">{errors._}</p>}
        <Inputs res={res} st={st} setSt={setSt} errors={errors} ctx={ctx} disabled={locked} />
        {canWrite && (
          <div className="actions">
            <button type="submit" className="p-btn" disabled={locked || !!busy || (!dirty && !isNew)}>{busy === 'save' ? 'Guardando…' : 'Guardar borrador'}</button>
            <button type="button" className="p-btn p-btn-primary" onClick={submit} disabled={locked || !!busy || (!isNew && status !== 'borrador' && status !== 'rechazado' && !dirty)}>{busy === 'submit' ? 'Enviando…' : 'Enviar a revisión'}</button>
            {!isNew && !item.published_snapshot && status !== 'en_revision' && <button type="button" className="p-btn p-btn-danger-ghost" onClick={() => setConfirmDel(true)}>Eliminar</button>}
            {dirty && <span className="help" role="status">Cambios sin guardar</span>}
          </div>
        )}
      </form>
      {!isNew && res.tr?.length > 0 && <Translation res={res} item={item} canWrite={canWrite} locked={status === 'en_revision'} esDirty={dirty} toast={toast} reload={reload} />}
      </div>
      <aside className="side">
        {!isNew && <Facts item={item} res={res} />}
        {!isNew && <PendingChange res={res} item={item} canAct={can(res.perm, 'write') || can(res.perm, 'approve')} toast={toast} reload={reload} />}
        {!isNew && can(res.perm, 'quick_fix') && item.published_snapshot && <QuickFix res={res} item={item} toast={toast} reload={reload} />}
        {!isNew && <History reviews={reviews} />}
        {res.entity === 'retreats' && !isNew && can('sessions', 'read') && <section className="card"><h2>Fechas</h2><PLink to={`/panel/fechas?retiro=${item.id}`}>Ver las fechas de este retiro</PLink></section>}
      </aside>
      {confirmDel && <Confirm title="Eliminar borrador" danger confirmLabel="Eliminar" onConfirm={remove} onCancel={() => setConfirmDel(false)} busy={busy === 'del'}>
        <p>Se eliminará “{res.label(item)}” de forma permanente. Solo se puede si nunca se publicó.</p></Confirm>}
    </div>
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
              <span className={`pill pill-${{ pendiente: 'en_revision', aprobado: 'publicado', rechazado: 'rechazado' }[r.decision]}`}>{{ pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }[r.decision]}</span>
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
