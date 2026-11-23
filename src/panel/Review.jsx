import { useState } from 'react';
import { errText, get, post } from './api';
import { RESOURCES } from './resources';
import { Async, Empty, Field, PLink, PageHead, StatusPill, fromLocalInput, toLocalInput, useLoad, useToast } from './ui';

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

function Card({ p, reload }) {
  const res = RESOURCES[p.entity];
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <li className="card review">
      <div className="p-row between">
        <div>
          <h2 className="inline"><PLink to={`/panel/${res.path}/${p.id}`}>{p.label}</PLink></h2>
          <p className="help">{res.one} · versión {p.version} · hace {p.hours} h{p.own ? ' · enviado por ti' : ''}</p>
        </div>
        <button className="p-btn p-btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Ocultar cambios' : 'Ver cambios y decidir'}</button>
      </div>
      {open && <Detail p={p} res={res} done={(m) => { toast(m); reload(); }} />}
    </li>
  );
}

function Detail({ p, res, done }) {
  const toast = useToast();
  const load = useLoad(() => get(`/api/admin/${p.entity}/${p.id}`), [p.entity, p.id]);
  const [mode, setMode] = useState('now');
  const [when, setWhen] = useState('');
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const decide = async (kind) => {
    setErr('');
    if (kind === 'reject' && !comment.trim()) return setErr('Escribe el comentario: explica qué debe corregirse.');
    if (kind === 'approve' && mode === 'later' && (!when || new Date(when) <= new Date())) return setErr('Elige una fecha y hora futuras para programar.');
    setBusy(true);
    try {
      await post(`/api/admin/${p.entity}/${p.id}/${kind}`, kind === 'reject' ? { comment } : { ...(comment.trim() && { comment }), publish_at: mode === 'later' ? fromLocalInput(when) : null });
      done(kind === 'approve' ? (mode === 'later' ? 'Aprobado y programado.' : 'Aprobado y publicado.') : 'Rechazado. La persona verá tu comentario.');
    } catch (x) { setErr(errText(x)); toast(errText(x), 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="review-body">
      <Async load={load} rows={3}>
        {(item) => {
          const d = diffOf(res, item);
          return (
            <>
              <p className="help">{d.first ? 'Primera publicación: se muestran los campos con contenido.' : `${d.rows.length} campo(s) cambiaron respecto a lo publicado; ${d.same} sin cambios.`}</p>
              {!d.rows.length ? <Empty title="Sin cambios visibles respecto a lo publicado." /> : (
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
              )}
              {p.own ? (
                <p className="banner banner-gold" role="status">No puedes aprobar ni rechazar tu propio envío. Otra persona de Administración o Asesoría debe decidir.</p>
              ) : (
                <div className="decide">
                  <fieldset>
                    <legend>Al aprobar</legend>
                    <label className="p-check"><input type="radio" name={`m${p.review_id}`} checked={mode === 'now'} onChange={() => setMode('now')} /> Publicar ahora</label>
                    <label className="p-check"><input type="radio" name={`m${p.review_id}`} checked={mode === 'later'} onChange={() => { setMode('later'); setWhen((w) => w || toLocalInput(item.publish_at)); }} /> Programar publicación</label>
                    {mode === 'later' && <Field label="Fecha y hora" help="Queda en estado Programado y sale solo a esa hora.">{(q) => <input {...q} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</Field>}
                  </fieldset>
                  <Field label="Comentario" help="Obligatorio para rechazar; opcional al aprobar.">{(q) => <textarea {...q} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
                  {err && <p className="form-error" role="alert">{err}</p>}
                  <div className="actions">
                    <button className="p-btn p-btn-primary" disabled={busy} onClick={() => decide('approve')}>Aprobar</button>
                    <button className="p-btn p-btn-danger" disabled={busy} onClick={() => decide('reject')}>Rechazar</button>
                  </div>
                </div>
              )}
            </>
          );
        }}
      </Async>
    </div>
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
