import { useState } from 'react';
import { errText, get, patch } from './api';
import { mailtoLink, waLink } from './regs';
import { Async, Empty, ICONS, Icon, PageHead, Pill, fmtDate, fmtDateTime, useLoad, useToast } from './ui';

const ST = { nuevo: 'Nuevo', leido: 'Leído', respondido: 'Respondido', spam: 'Spam' };
const PILL = { nuevo: 'en_revision', leido: 'borrador', respondido: 'publicado', spam: 'rechazado' };
const SUBJECT = { informacion: 'Información general', retiros: 'Retiros y talleres', peregrinaciones: 'Peregrinaciones', voluntariado: 'Servir o ser voluntario', arco: 'Derechos ARCO', otro: 'Otro' };
const today = () => new Date().toISOString().slice(0, 10);

// ARCO: due date = received + 20 business days (shortcut: weekends only, holidays not skipped; verify with legal counsel).
const Due = ({ m }) => {
  if (!m.is_arco || !m.due_on) return null;
  const late = m.due_on < today() && ['nuevo', 'leido'].includes(m.status);
  return <Pill status={late ? 'rechazado' : 'programado'}>ARCO vence {fmtDate(m.due_on)}{late ? ' (vencido)' : ''}</Pill>;
};

function Detail({ id, onChange }) {
  const load = useLoad(() => get(`/api/admin/contact/${id}`), [id]);
  const toast = useToast();
  async function mark(status) {
    try { await patch(`/api/admin/contact/${id}`, { status }); toast('Marcado.'); load.reload(); onChange(); } catch (e) { toast(errText(e), 'error'); }
  }
  return (
    <Async load={load} rows={3}>
      {(m) => {
        const wa = waLink(m.phone);
        return (
          <div className="msg-body">
            <p className="help">{m.email}{m.phone ? ` · ${m.phone}` : ''} · idioma {m.lang}{m.score != null ? ` · puntaje captcha ${m.score}` : ''} · privacidad aceptada {fmtDateTime(m.consent_at)}</p>
            <p className="val">{m.message}</p>
            <div className="p-row wrap">
              <a className="p-btn p-btn-primary p-btn-big" href={mailtoLink(m.email, m.lang === 'en' ? 'Re: Your message to Mi Camino es Jesús' : 'Re: Tu mensaje a Mi Camino es Jesús', m.lang === 'en' ? `Hello ${m.name},\n\n` : `Hola ${m.name},\n\n`)}><Icon d={ICONS.mail} />Contestar por correo</a>
              {wa && <a className="p-btn p-btn-big" href={wa} target="_blank" rel="noopener noreferrer"><Icon d={ICONS.chat} />WhatsApp<span className="sr-only"> (se abre en otra pestaña)</span></a>}
            </div>
            <p className="help">Abrir el correo o WhatsApp no marca el mensaje como atendido: hazlo tú cuando termines.</p>
            <div className="p-row wrap">
              {m.status !== 'respondido' && <button className="p-btn p-btn-big" onClick={() => mark('respondido')}>Ya lo atendí</button>}
              {['nuevo', 'leido', 'spam'].filter((s) => s !== m.status).map((s) => <button key={s} className="p-btn p-btn-sm" onClick={() => mark(s)}>Marcar como {ST[s].toLowerCase()}</button>)}
            </div>
          </div>
        );
      }}
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
        <label className="p-check"><input type="checkbox" checked={arco} onChange={(e) => setArco(e.target.checked)} />Solo derechos ARCO</label>
      </div>
      <Async load={load}>
        {(rows) => (!rows.length ? <Empty title="No hay mensajes con estos filtros." /> : (
          <ul className="stack-list reg-list">
            {rows.map((m) => (
              <li key={m.id} className="card msg">
                <div className="p-row between"><strong>{m.name}</strong><Pill status={PILL[m.status]}>{ST[m.status]}</Pill></div>
                <p className="help">{SUBJECT[m.subject]} · {fmtDateTime(m.created_at)}</p>
                <Due m={m} />
                <p>{m.preview}{m.preview?.length >= 120 ? '…' : ''}</p>
                <button className="p-btn p-btn-sm" aria-expanded={open === m.id} onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? 'Cerrar mensaje' : 'Abrir mensaje'}</button>
                {open === m.id && <Detail id={m.id} onChange={load.reload} />}
              </li>
            ))}
          </ul>
        ))}
      </Async>
    </>
  );
}
