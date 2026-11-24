import { useState } from 'react';
import { errText, get, post } from './api';
import { RESOURCES } from './resources';
import { Async, Confirm, Empty, Field, PLink, PageHead, Pill, StatusPill, fmtDateTime, fromLocalInput, toLocalInput, useLoad, useToast } from './ui';
import { Thumb } from './Wizard';

const INTERNAL = ['notes', 'publish_at', 'source_note'];
// null, '' and [] are the same "empty"; 0/1 from MySQL booleans compare as booleans.
const norm = (f, v) => {
  if (f.t === 'bool') return !!v;
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return null;
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
};
const show = (v) => (v == null ? '—' : typeof v === 'object' ? JSON.stringify(v, null, 1) : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v));

// Changed fields between the live snapshot and the proposal (first publication: every filled field).
function diffOf(res, item) {
  const snap = item.published_snapshot;
  const fields = res.fields.filter((f) => !INTERNAL.includes(f.n) && (!snap || f.n in snap));
  const rows = fields.map((f) => ({ f, was: snap ? snap[f.n] : null, now: item[f.n] }))
    .filter((r) => (snap ? norm(r.f, r.was) !== norm(r.f, r.now) : norm(r.f, r.now) !== null && norm(r.f, r.now) !== false));
  return { rows, first: !snap, same: fields.length - rows.length };
}

// The English version the reviewer is about to publish with the Spanish: ready, still being made, failed, or missing.
// `warn` is set when approving now would publish Spanish only (or an outdated English).
function enInfo(t) {
  if (t.auto.state === 'pendiente') return { pill: 'en_revision', text: 'Se está preparando la versión en inglés. Si apruebas antes de que termine, se publica solo en español.', warn: 'Todavía se está preparando la versión en inglés. Si apruebas ahora, el inglés no saldrá: se publicará solo en español.' };
  if (t.auto.state === 'fallo' && !t.fields) return { pill: 'rechazado', text: `No se pudo preparar la versión en inglés (${errText({ code: t.auto.error })}) Si apruebas, se publica solo en español.`, warn: 'No se pudo preparar la versión en inglés. Si apruebas, se publicará solo en español.' };
  if (!t.fields) return { pill: 'borrador', text: 'Todavía no tiene versión en inglés: se publicará solo en español.', warn: 'Todavía no tiene versión en inglés: se publicará solo en español.' };
  const stale = t.stale ? 'El inglés es de un texto anterior: el español cambió después de traducirlo.' : null;
  return t.source === 'humano' ? { pill: 'publicado', text: 'Versión en inglés escrita o revisada a mano.', warn: stale }
    : { pill: 'en_revision', text: 'Traducción automática: léela antes de aprobar. Los versículos no se traducen aquí.', warn: stale };
}

function English({ res, t, info }) {
  const label = (k) => res.fields.find((f) => f.n === k)?.label ?? k;
  const rows = Object.entries(t.fields ?? {}).filter(([, v]) => v != null && v !== '');
  return (
    <section className="review-en" aria-label="Versión en inglés">
      <h3><Pill status={info.pill}>Versión en inglés</Pill></h3>
      <p className="help">{info.text}</p>
      {t.stale && t.fields && <p className="banner banner-gold" role="status">El texto en español cambió después de traducirlo.</p>}
      {t.auto.state === 'fallo' && t.fields && <p className="banner banner-gold" role="status">No se pudo actualizar la traducción al enviar ({errText({ code: t.auto.error })}) Se muestra la anterior.</p>}
      {rows.length > 0 && (
        <details open={t.source === 'auto'}>
          <summary>Ver el inglés</summary>
          <dl className="facts">{rows.map(([k, v]) => <div key={k} className="sum-row"><dt>{label(k)}</dt><dd>{typeof v === 'string' ? v : '(contenido estructurado traducido)'}</dd></div>)}</dl>
        </details>
      )}
    </section>
  );
}

// "Cambió: Título, Resumen y 2 más" in plain words.
const said = (d) => {
  if (d.first) return 'Es nuevo: todavía no está en el sitio.';
  if (!d.rows.length) return 'Sin cambios visibles respecto a lo publicado.';
  const names = d.rows.map((r) => r.f.label);
  return `Cambió: ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` y ${names.length - 3} más` : ''}.`;
};

function Card({ p, reload }) {
  const res = RESOURCES[p.entity];
  const toast = useToast();
  const item = useLoad(() => get(`/api/admin/${p.entity}/${p.id}`), [p.entity, p.id]);
  const en = useLoad(() => (res.tr?.length ? get(`/api/admin/${p.entity}/${p.id}/translation`) : Promise.resolve(null)), [p.entity, p.id]);
  return (
    <li className="card review">
      <Async load={item} rows={2}>
        {(it) => <CardBody p={p} res={res} item={it} en={en} done={(m) => { toast(m); reload(); }} />}
      </Async>
    </li>
  );
}

function CardBody({ p, res, item, en, done }) {
  const toast = useToast();
  const d = diffOf(res, item);
  const info = en.data ? enInfo(en.data) : null;
  const warn = en.error ? 'No pudimos comprobar la versión en inglés. Si apruebas, puede que se publique solo en español.' : info?.warn;
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState(null); // 'now' | 'later' while the approval waits for a yes
  const [when, setWhen] = useState(() => toLocalInput(item.publish_at));
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const check = (kind, mode) => {
    setErr('');
    if (kind === 'reject' && !comment.trim()) { setErr('Escribe el comentario: explica qué debe corregirse.'); return false; }
    if (mode === 'later' && (!when || new Date(when) <= new Date())) { setErr('Elige una fecha y hora futuras para programar.'); return false; }
    return true;
  };
  const decide = async (kind, mode = 'now') => {
    setBusy(true);
    try {
      await post(`/api/admin/${p.entity}/${p.id}/${kind}`, kind === 'reject' ? { comment } : { ...(comment.trim() && { comment }), publish_at: mode === 'later' ? fromLocalInput(when) : null });
      done(kind === 'approve' ? (mode === 'later' ? 'Aprobado y programado.' : 'Aprobado y publicado.') : 'Listo: se pidieron cambios. La persona verá tu comentario.');
    } catch (x) { setErr(errText(x)); toast(errText(x), 'error'); setBusy(false); setAsk(null); }
  };

  return (
    <>
      <div className="rv-head">
        <Thumb value={item.cover ?? item.photo} size={88} />
        <div>
          <h2 className="inline"><PLink to={`/panel/${res.path}/${p.id}`}>{p.label}</PLink></h2>
          <p className="help">{res.one} · {p.own ? 'lo enviaste tú' : `lo envió ${p.submitted_by_name ?? 'alguien del equipo'}`} · hace {p.hours} h</p>
          <p className="rv-said">{said(d)}</p>
        </div>
      </div>
      {en.data && <English res={res} t={en.data} info={info} />}
      {en.error && <p className="banner banner-gold" role="status">{warn}</p>}
      <button className="p-btn p-btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Ocultar los cambios' : 'Ver los cambios'}</button>
      {open && (!d.rows.length ? <Empty title="Sin cambios visibles respecto a lo publicado." /> : (
        <div className="table-wrap">
          <table className="tbl diff">
            <caption className="sr-only">Cambios propuestos</caption>
            <thead><tr><th scope="col">Campo</th>{!d.first && <th scope="col">Publicado ahora</th>}<th scope="col">Propuesto</th></tr></thead>
            <tbody>
              {d.rows.map(({ f, was, now }) => (
                <tr key={f.n}><th scope="row">{f.label}</th>{!d.first && <td className="was"><pre>{show(was)}</pre></td>}<td className="now"><pre>{show(now)}</pre></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {p.own ? (
        <p className="banner banner-gold" role="status">No puedes aprobar ni pedir cambios a tu propio envío. Otra persona de Administración o Asesoría debe decidir.</p>
      ) : (
        <div className="decide">
          <Field label="Comentario" help="Obligatorio si pides cambios; opcional al aprobar.">{(q) => <textarea {...q} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
          {err && <p className="form-error" role="alert">{err}</p>}
          <div className="p-row wrap">
            <button className="p-btn p-btn-primary p-btn-big" disabled={busy} onClick={() => check('approve', 'now') && setAsk('now')}>Aprobar y publicar</button>
            <button className="p-btn p-btn-big p-btn-warn" disabled={busy} onClick={() => check('reject') && decide('reject')}>Pedir cambios</button>
          </div>
          <details className="fold">
            <summary>Programar para otra fecha</summary>
            <Field label="Fecha y hora" help="Queda en estado Programado y sale solo a esa hora.">{(q) => <input {...q} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</Field>
            <button className="p-btn" disabled={busy} onClick={() => check('approve', 'later') && setAsk('later')}>Aprobar y programar</button>
          </details>
        </div>
      )}
      {ask && (
        <Confirm title={ask === 'later' ? 'Aprobar y programar' : 'Aprobar y publicar'} confirmLabel={ask === 'later' ? 'Sí, programar' : 'Sí, publicar'} busy={busy} onCancel={() => setAsk(null)} onConfirm={() => decide('approve', ask)}>
          <p>{ask === 'later' ? `«${p.label}» saldrá en el sitio el ${fmtDateTime(fromLocalInput(when))}.` : `«${p.label}» se publicará en el sitio ahora mismo.`}</p>
          {warn && <p className="banner banner-gold" role="status">{warn}</p>}
        </Confirm>
      )}
    </>
  );
}

export default function Review() {
  const load = useLoad(() => get('/api/admin/reviews/pending'), []);
  return (
    <>
      <PageHead title="Revisión" sub="Nada se publica sin una aprobación. Una basta, y nunca la de quien lo envió." />
      <Async load={load}>
        {(rows) => (!rows.length
          ? <Empty title="No hay nada pendiente.">Cuando alguien envíe contenido a revisión aparecerá aquí.</Empty>
          : <ul className="stack-list">{rows.map((p) => <Card key={p.review_id} p={p} reload={load.reload} />)}</ul>)}
      </Async>
      <p className="help"><StatusPill status="en_revision" /> Los cambios se comparan contra lo que hoy ve el público.</p>
    </>
  );
}
