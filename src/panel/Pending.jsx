import { useState } from 'react';
import { errText, post } from './api';
import { Confirm, fmtDateTime } from './ui';

const SKIP = new Set(['id']);
const show = (v) => {
  if (v == null || v === '') return '—';
  if (typeof v === 'object') return '(contenido estructurado)';
  const s = String(v);
  return s.length > 160 ? `${s.slice(0, 160)}…` : s;
};
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Approved edit waiting for its publish date: shows the live version next to the pending one, and lets the author or a
// reviewer cancel it. Until the date, visitors keep seeing the live version.
export default function PendingChange({ res, item, canAct, toast, reload }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!item.pending_snapshot) return null;
  const live = item.published_snapshot ?? {};
  const pend = item.pending_snapshot;
  const label = (k) => (k === 'en' ? 'Versión en inglés' : res.fields.find((f) => f.n === k)?.label ?? k);
  const keys = [...new Set([...Object.keys(live), ...Object.keys(pend)])].filter((k) => !SKIP.has(k) && !same(live[k], pend[k]));
  const cancel = async () => {
    setBusy(true);
    try { await post(`/api/admin/${res.entity}/${item.id}/cancel-pending`); toast('Cambio programado cancelado. Sigue visible la versión publicada.'); setConfirm(false); reload(); } catch (x) { toast(errText(x), 'error'); setConfirm(false); } finally { setBusy(false); }
  };
  return (
    <section className="card pending-card">
      <h2>Cambio programado</h2>
      <p>Se publicará el <strong className="p-num">{fmtDateTime(item.pending_from)}</strong>. Mientras tanto el sitio muestra la versión publicada.</p>
      <div className="table-wrap">
        <table className="tbl pending-diff">
          <caption className="sr-only">Diferencias entre lo publicado y lo programado</caption>
          <thead><tr><th scope="col">Campo</th><th scope="col">Publicado ahora</th><th scope="col">Programado</th></tr></thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k}>
                <th scope="row">{label(k)}</th>
                <td>{show(live[k])}</td>
                <td className="pending-new">{show(pend[k])}</td>
              </tr>
            ))}
            {!keys.length && <tr><td colSpan="3">Sin diferencias visibles.</td></tr>}
          </tbody>
        </table>
      </div>
      {canAct && <div className="actions"><button type="button" className="p-btn p-btn-danger-ghost" onClick={() => setConfirm(true)}>Cancelar el cambio programado</button></div>}
      {confirm && (
        <Confirm title="Cancelar el cambio programado" danger confirmLabel="Cancelar el cambio" onConfirm={cancel} onCancel={() => setConfirm(false)} busy={busy}>
          <p>La versión programada no se publicará y volverá a ser un borrador. Lo publicado no cambia.</p>
        </Confirm>
      )}
    </section>
  );
}
