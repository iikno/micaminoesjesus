import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { errText, get, post } from './api';
import { Async, Confirm, Empty, PLink, PageHead, fmtDate, fmtDateTime, useLoad, useToast } from './ui';

const ST = { confirmado: 'Confirmado', lista_espera: 'Lista de espera', oferta: 'Lugar ofrecido', pendiente_verificacion: 'Sin verificar', cancelado: 'Cancelado', expirado: 'Vencido' };
const PILL = { confirmado: 'publicado', lista_espera: 'en_revision', oferta: 'programado', pendiente_verificacion: 'borrador', cancelado: 'rechazado', expirado: 'rechazado' };
const KIND = { session: 'Fecha de retiro', pilgrimage: 'Peregrinación' };
const Pill = ({ s }) => <span className={`pill pill-${PILL[s]}`}>{ST[s] ?? s}</span>;

// ------------------------------------------------------------ events with counts
export function RegistrationEvents() {
  const load = useLoad(() => get('/api/admin/registrations/events'), []);
  const [kind, setKind] = useState('');
  return (
    <>
      <PageHead title="Inscripciones" sub="Cupo, lista de espera y datos de quienes se inscriben. El cupo se edita en Fechas de retiros o Peregrinaciones." />
      <Async load={load}>
        {(rows) => {
          const kinds = [...new Set(rows.map((r) => r.kind))];
          const shown = rows.filter((r) => !kind || r.kind === kind);
          if (!rows.length) return <Empty title="Aún no hay fechas con inscripción propia." />;
          return (
            <>
              {kinds.length > 1 && (
                <div className="filters"><label>Tipo<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Todos</option>{kinds.map((k) => <option key={k} value={k}>{KIND[k]}</option>)}</select></label></div>
              )}
              <div className="table-wrap">
                <table className="tbl stack">
                  <caption className="sr-only">Fechas con inscripción</caption>
                  <thead><tr><th scope="col">Fecha</th><th scope="col" className="p-num">Cupo</th><th scope="col" className="p-num">Confirmados</th><th scope="col" className="p-num">Lista de espera</th><th scope="col" className="p-num">Sin verificar</th></tr></thead>
                  <tbody>
                    {shown.map((e) => (
                      <tr key={`${e.kind}${e.id}`}>
                        <th scope="row"><PLink className="p-row-link" to={`/panel/inscripciones/${e.kind}/${e.id}`}>{e.title}</PLink><br /><span className="help">{KIND[e.kind]} · {fmtDate(e.starts_on)}{e.published ? '' : ' · sin publicar'}{e.mode !== 'own' ? ' · entrada libre' : ''}</span></th>
                        <td data-label="Cupo" className="p-num">{e.cupo ?? 'Sin límite'}</td>
                        <td data-label="Confirmados" className="p-num">{(e.counts.confirmado ?? 0) + (e.counts.oferta ?? 0)}</td>
                        <td data-label="Lista de espera" className="p-num">{e.counts.lista_espera ?? 0}</td>
                        <td data-label="Sin verificar" className="p-num">{e.counts.pendiente_verificacion ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        }}
      </Async>
    </>
  );
}

// ------------------------------------------------------------ one event
function Details({ id }) {
  const load = useLoad(() => get(`/api/admin/registrations/${id}`), [id]);
  return (
    <Async load={load} rows={2}>
      {(d) => (d.emergency === undefined ? <p className="help">Tu rol no puede ver los datos sensibles.</p> : (
        <div className="val">
          <p>Contacto de emergencia: {d.emergency ? `${d.emergency.name}, ${d.emergency.phone}` : 'ya borrado (retención)'}</p>
          {d.guardian && <p>Madre, padre o tutor: {d.guardian.name}, {d.guardian.phone}</p>}
          {d.under18 != null && <p>Menor de 18: {d.under18 ? `sí, con permiso de su tutor: ${d.minor_permission ? 'sí' : 'no'}` : 'no'}</p>}
          <p>Alergias: {d.allergies ?? (d.has_allergies ? 'ya borradas (retención)' : 'ninguna declarada')}</p>
          <p>Consentimiento de privacidad: {fmtDateTime(d.consent_privacy_at)}{d.consent_health_at ? ` · datos de salud: ${fmtDateTime(d.consent_health_at)}` : ''}</p>
        </div>
      ))}
    </Async>
  );
}

const ACTIONS = {
  confirm: { label: 'Confirmar', from: ['pendiente_verificacion', 'lista_espera', 'oferta'], text: 'Se confirmará su lugar aunque el cupo esté lleno, y recibirá un correo.' },
  waitlist: { label: 'Mover a lista de espera', from: ['pendiente_verificacion', 'oferta', 'confirmado'], text: 'Pasará al final de la lista de espera.' },
  cancel: { label: 'Cancelar', from: ['pendiente_verificacion', 'lista_espera', 'oferta', 'confirmado'], text: 'Se libera su lugar y se ofrece a la siguiente persona de la lista.', danger: true },
};

export function RegistrationList() {
  const { kind, id } = useParams();
  const toast = useToast();
  const q = `kind=${kind}&event_id=${id}`;
  const events = useLoad(() => get('/api/admin/registrations/events'), []);
  const load = useLoad(() => get(`/api/admin/registrations?${q}`), [q]);
  const [open, setOpen] = useState(null);
  const [ask, setAsk] = useState(null);
  const [busy, setBusy] = useState(false);
  const ev = events.data?.find((e) => e.kind === kind && String(e.id) === id);

  async function run() {
    setBusy(true);
    try { await post(`/api/admin/registrations/${ask.r.id}/action`, { action: ask.a }); toast('Listo.'); load.reload(); events.reload(); } catch (e) { toast(errText(e), 'error'); }
    setBusy(false);
    setAsk(null);
  }

  return (
    <>
      <nav aria-label="Ruta" className="crumbs"><PLink to="/panel/inscripciones">Inscripciones</PLink> <span aria-hidden="true">/</span> <span>{ev?.title ?? 'Detalle'}</span></nav>
      <Async load={load}>
        {({ manage, rows }) => {
          const n = (s) => rows.filter((r) => r.status === s).length;
          return (
            <>
              <PageHead title={ev?.title ?? 'Inscripciones'} sub={ev ? `${KIND[kind]} · ${fmtDate(ev.starts_on)} · cupo ${ev.cupo ?? 'sin límite'}` : undefined}>
                {manage && <a className="p-btn" href={`/api/admin/registrations/export.csv?${q}`} download>Descargar CSV</a>}
              </PageHead>
              <ul className="p-tiles" aria-label="Resumen">
                <li className="p-tile p-tile-publicado"><span className="p-tile-n p-num">{n('confirmado') + n('oferta')}</span><span>Confirmados{ev?.cupo != null ? ` de ${ev.cupo}` : ''}</span></li>
                <li className="p-tile p-tile-en_revision"><span className="p-tile-n p-num">{n('lista_espera')}</span><span>Lista de espera</span></li>
                <li className="p-tile"><span className="p-tile-n p-num">{n('pendiente_verificacion')}</span><span>Sin verificar</span></li>
              </ul>
              {!manage && <p className="help">Solo lectura: Asesoría ve la lista, pero no los datos sensibles ni las acciones.</p>}
              {!rows.length ? <Empty title="Aún no hay inscripciones." /> : (
                <div className="table-wrap">
                  <table className="tbl stack">
                    <caption className="sr-only">Inscripciones</caption>
                    <thead><tr><th scope="col">Persona</th><th scope="col">Estado</th><th scope="col">Inscrita</th>{manage && <th scope="col">Acciones</th>}</tr></thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td data-label="Persona">
                            <strong>{r.name}</strong><br /><span className="help">{r.email} · {r.phone}{r.lang === 'en' ? ' · inglés' : ''}</span>
                            {manage && <><br /><button className="p-btn p-btn-sm" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? 'Ocultar datos' : 'Ver datos'}</button>{open === r.id && <Details id={r.id} />}</>}
                          </td>
                          <td data-label="Estado"><Pill s={r.status} />{r.position ? <span className="help"> lugar {r.position}</span> : null}{r.status === 'oferta' && <span className="help"> hasta {fmtDateTime(r.offer_expires_at)}</span>}</td>
                          <td data-label="Inscrita" className="p-num">{fmtDateTime(r.created_at)}</td>
                          {manage && (
                            <td data-label="Acciones" className="cell-actions">
                              {Object.entries(ACTIONS).filter(([, x]) => x.from.includes(r.status)).map(([a, x]) => (
                                <button key={a} className="p-btn p-btn-sm" onClick={() => setAsk({ r, a })}>{x.label}</button>
                              ))}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          );
        }}
      </Async>
      {ask && <Confirm title={`${ACTIONS[ask.a].label}: ${ask.r.name}`} danger={ACTIONS[ask.a].danger} confirmLabel={ACTIONS[ask.a].label} busy={busy} onCancel={() => setAsk(null)} onConfirm={run}><p>{ACTIONS[ask.a].text}</p></Confirm>}
    </>
  );
}
