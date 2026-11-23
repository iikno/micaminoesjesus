import { useState } from 'react';
import BodyEditor, { Rows, Text } from './BodyEditor';
import { bodyErrors, bodyToForm, formToBody } from './body';
import { ApiError, errText, get, post, put } from './api';
import { fmtDateTime, useLoad } from './ui';

const SOURCE = { auto: 'Traducción automática (borrador)', humano: 'Escrita o corregida a mano' };
const short = (v) => { const s = typeof v === 'string' ? v : ''; return s.length > 140 ? `${s.slice(0, 140)}…` : s; };

// English fields as editable state, and back to the API payload. Empty = not translated (the site falls back to Spanish).
const fromApi = (res, fields) => Object.fromEntries(res.tr.map((k) => {
  const v = fields?.[k];
  if (k === 'body') return [k, bodyToForm(v)];
  if (k === 'itinerary') return [k, (Array.isArray(v) ? v : []).map((x) => ({ title: x?.title ?? '', text: x?.text ?? '' }))];
  return [k, typeof v === 'string' ? v : ''];
}));

const toApi = (res, st) => {
  const out = {};
  for (const k of res.tr) {
    const v = st[k];
    if (k === 'body') { const b = formToBody(v); if (b) out.body = b; }
    else if (k === 'itinerary') { const r = v.map((x) => ({ title: x.title.trim(), text: x.text.trim() })).filter((x) => x.title || x.text); if (r.length) out.itinerary = r; }
    else if (v.trim()) out[k] = v.trim();
  }
  return out;
};

// Card in the item form: English version of an item. Auto translation fills it as a draft; any manual edit
// makes it "a mano"; it is published together with the Spanish text when the item is approved.
export default function Translation({ res, item, canWrite, locked, esDirty, toast, reload }) {
  const [warn, setWarn] = useState([]); // survives the remount that follows a save
  const tr = useLoad(() => get(`/api/admin/${res.entity}/${item.id}/translation`), [res.entity, item.id, item.version]);
  const usage = useLoad(() => (canWrite ? get('/api/admin/translate/status') : Promise.resolve(null)), [canWrite, item.version]);
  return (
    <details className="card" open={!!tr.data?.fields}>
      <summary><h2 className="inline">Versión en inglés</h2></summary>
      {tr.loading && !tr.data ? <p className="help">Cargando…</p> : tr.error ? <p className="form-error" role="alert">{errText(tr.error)}</p> : (
        <Body key={`${tr.data.updated_at}${tr.data.src_hash}`} res={res} item={item} t={tr.data} usage={usage.data} warn={warn} setWarn={setWarn} canWrite={canWrite} locked={locked} esDirty={esDirty} toast={toast} reload={reload} />
      )}
    </details>
  );
}

function Body({ res, item, t, usage, warn, setWarn, canWrite, locked, esDirty, toast, reload }) {
  const [st, setSt] = useState(() => fromApi(res, t.fields));
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const off = !canWrite || locked || esDirty;
  const status = !t.fields ? 'Sin traducir' : `${SOURCE[t.source] ?? t.source}${t.updated_at ? ` · ${fmtDateTime(t.updated_at)}` : ''}`;
  const es = (k) => (k === 'body' ? '' : item[k]);

  const run = (name, fn) => async () => {
    setBusy(name); setErr('');
    try { await fn(); } catch (x) { setErr(x instanceof ApiError ? errText(x) : 'Ocurrió un error inesperado.'); } finally { setBusy(''); }
  };
  const save = run('save', async () => {
    if (res.tr.includes('body')) { const e = bodyErrors(st.body); if (e) { setErr(e); return; } }
    await put(`/api/admin/${res.entity}/${item.id}/translation`, { fields: toApi(res, st) });
    toast('Inglés guardado. Se publicará junto con la próxima aprobación.');
    reload();
  });
  const auto = run('auto', async () => {
    if (t.source === 'humano' && !window.confirm('Ya hay una versión escrita a mano. ¿Reemplazarla por una traducción automática?')) return;
    const r = await post(`/api/admin/${res.entity}/${item.id}/translate`, t.source === 'humano' ? { overwrite: true } : {});
    setWarn(r.warnings ?? []);
    toast(r.cached ? 'El texto en español no cambió: no se volvió a traducir.' : 'Borrador en inglés listo. Revísalo antes de enviar a revisión.');
    reload();
  });

  const label = { title: 'Título', subtitle: 'Subtítulo', summary: 'Concepto central', tema_paso: 'Tema del paso', note: 'Nota breve', place: 'Lugar', cost_info: 'Costo', date_text: 'Fecha en texto', role_title: 'Cargo o rol' };
  const long = new Set(['summary', 'cost_info']);
  return (
    <div className="tr-card">
      <p className="p-num">
        <span className={`pill pill-${!t.fields ? 'borrador' : t.source === 'auto' ? 'en_revision' : 'publicado'}`}>{status}</span>
        {t.stale && <span className="pill pill-rechazado" role="status"> Desactualizada: el español cambió</span>}
      </p>
      <p className="help">El inglés pasa por la misma revisión que el español y se publica con él. Las citas bíblicas no se traducen aquí: se escriben a mano en Versículos.</p>
      {esDirty && <p className="help" role="status">Guarda primero los cambios del español.</p>}
      {canWrite && usage && (
        <p className="help">
          {usage.enabled ? `Uso este mes: ${usage.used.toLocaleString('es-MX')} de ${usage.limit.toLocaleString('es-MX')} caracteres.` : 'La traducción automática no está activada en este servidor (falta la llave).'}
        </p>
      )}
      {err && <p className="form-error" role="alert">{err}</p>}
      {warn.length > 0 && (
        <div className="banner banner-gold" role="status">
          <strong>Revisa estos términos que debían quedar igual:</strong>
          <ul>{warn.map((w, i) => <li key={i}>“{w.term}” en: {w.text}</li>)}</ul>
        </div>
      )}
      <div className="p-grid">
        {res.tr.map((k) => {
          if (k === 'body') return <BodyEditor key={k} value={st.body} onChange={(v) => setSt({ ...st, body: v })} disabled={off} />;
          if (k === 'itinerary') {
            return (
              <div key={k} className="span2">
                <Rows legend="Itinerario por días (inglés)" noun="Día" empty="Sin itinerario en inglés." items={st.itinerary} onChange={(v) => setSt({ ...st, itinerary: v })} blank={{ title: '', text: '' }} disabled={off}>
                  {(x, set) => (<>
                    <Text label="Título" value={x.title} onChange={(v) => set({ title: v })} />
                    <Text label="Detalle" value={x.text} onChange={(v) => set({ text: v })} rows={2} />
                  </>)}
                </Rows>
              </div>
            );
          }
          return <div key={k} className={long.has(k) ? 'span2' : ''}><Text label={`${label[k] ?? k} (inglés)`} value={st[k]} onChange={(v) => setSt({ ...st, [k]: v })} disabled={off} rows={long.has(k) ? 4 : 0} help={es(k) ? `Español: ${short(es(k))}` : undefined} /></div>;
        })}
      </div>
      {canWrite && (
        <div className="actions">
          <button type="button" className="p-btn" onClick={auto} disabled={off || !!busy || (usage && !usage.enabled)}>{busy === 'auto' ? 'Traduciendo…' : 'Traducir automáticamente'}</button>
          <button type="button" className="p-btn p-btn-primary" onClick={save} disabled={off || !!busy}>{busy === 'save' ? 'Guardando…' : 'Guardar inglés'}</button>
        </div>
      )}
    </div>
  );
}
