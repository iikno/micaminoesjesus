import { useState } from 'react';
import { errText, get, patch } from './api';
import { Async, Empty, PageHead, fmtDate, fmtDateTime, useLoad, useToast } from './ui';

const ST = { nuevo: 'Nuevo', leido: 'Leído', respondido: 'Respondido', spam: 'Spam' };
const PILL = { nuevo: 'en_revision', leido: 'borrador', respondido: 'publicado', spam: 'rechazado' };
const SUBJECT = { informacion: 'Información general', retiros: 'Retiros y talleres', peregrinaciones: 'Peregrinaciones', voluntariado: 'Servir o ser voluntario', arco: 'Derechos ARCO', otro: 'Otro' };
const today = () => new Date().toISOString().slice(0, 10);

// ARCO: due date = received + 20 business days (shortcut: weekends only, holidays not skipped; verify with legal counsel).
const Due = ({ m }) => {
  if (!m.is_arco || !m.due_on) return null;
  const late = m.due_on < today() && ['nuevo', 'leido'].includes(m.status);
  return <span className={`pill pill-${late ? 'rechazado' : 'programado'}`}>ARCO vence {fmtDate(m.due_on)}{late ? ' (vencido)' : ''}</span>;
};

function Detail({ id, onChange }) {
  const load = useLoad(() => get(`/api/admin/contact/${id}`), [id]);
  const toast = useToast();
  async function mark(status) {
    try { await patch(`/api/admin/contact/${id}`, { status }); toast('Marcado.'); load.reload(); onChange(); } catch (e) { toast(errText(e), 'error'); }
  }
  return (
    <Async load={load} rows={3}>
      {(m) => (
        <div className="card">
          <p><strong>{m.name}</strong> · <a href={`mailto:${m.email}`}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ''}</p>
          <p className="help">{SUBJECT[m.subject]} · {fmtDateTime(m.created_at)} · idioma {m.lang}{m.score != null ? ` · puntaje captcha ${m.score}` : ''} · privacidad aceptada {fmtDateTime(m.consent_at)}</p>
          <p><Due m={m} /></p>
          <p className="val">{m.message}</p>
          <div className="p-row">
            {['nuevo', 'leido', 'respondido', 'spam'].filter((s) => s !== m.status).map((s) => <button key={s} className="p-btn p-btn-sm" onClick={() => mark(s)}>Marcar como {ST[s].toLowerCase()}</button>)}
            <a className="p-btn p-btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: Mi Camino es Jesús')}`}>Responder por correo</a>
          </div>
        </div>
      )}
    </Async>
  );
}

export default function Bandeja() {
  const [status, setStatus] = useState('');
  const [arco, setArco] = useState(false);
  const [open, setOpen] = useState(null);
  const load = useLoad(() => get(`/api/admin/contact?${new URLSearchParams({ ...(status && { status }), ...(arco && { arco: '1' }) })}`), [status, arco]);
  return (
    <>
      <PageHead title="Bandeja de contacto" sub="Mensajes del formulario público. El spam se guarda 30 días y no se envía por correo." />
      <div className="filters" role="search">
        <label>Estado<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos</option>{Object.entries(ST).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label><span>Solo derechos ARCO</span><input type="checkbox" checked={arco} onChange={(e) => setArco(e.target.checked)} /></label>
      </div>
      <Async load={load}>
        {(rows) => (!rows.length ? <Empty title="No hay mensajes con estos filtros." /> : (
          <div className="table-wrap">
            <table className="tbl stack">
              <caption className="sr-only">Mensajes de contacto</caption>
              <thead><tr><th scope="col">De</th><th scope="col">Asunto</th><th scope="col">Estado</th><th scope="col">Recibido</th></tr></thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td data-label="De"><button className="p-btn p-btn-sm" aria-expanded={open === m.id} onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? 'Cerrar' : 'Abrir'}</button> <strong>{m.name}</strong><br /><span className="help">{m.preview}</span>{open === m.id && <Detail id={m.id} onChange={load.reload} />}</td>
                    <td data-label="Asunto">{SUBJECT[m.subject]}<br /><Due m={m} /></td>
                    <td data-label="Estado"><span className={`pill pill-${PILL[m.status]}`}>{ST[m.status]}</span></td>
                    <td data-label="Recibido" className="p-num">{fmtDateTime(m.created_at)}</td>
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
