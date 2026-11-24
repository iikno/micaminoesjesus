import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { errText, get, post } from './api';
import { photoUrl } from './Media';
import { REG_STATUS, capacity, mailtoLink, telLink, waLink } from './regs';
import { Async, Confirm, Empty, ICONS, Icon, PLink, Pill, PageHead, fmtDate, fmtDateTime, useLoad, useToast } from './ui';
import { norm } from './wizard';

const PILL = { confirmado: 'publicado', lista_espera: 'en_revision', oferta: 'programado', pendiente_verificacion: 'borrador', cancelado: 'rechazado', expirado: 'rechazado' };
const KIND = { session: 'Fecha de retiro', pilgrimage: 'Peregrinación' };
const RegPill = ({ s }) => <Pill status={PILL[s]}>{REG_STATUS[s] ?? s}</Pill>;
const today = () => new Date().toISOString().slice(0, 10);
const isPast = (e) => (e.ends_on ?? e.starts_on) < today();
const heldBy = (c) => (c.confirmado ?? 0) + (c.oferta ?? 0); // confirmed people and open offers hold a spot

// "18 de 25 lugares" with a bar; a full date also says so in words and with an icon, never by colour alone.
function Cupo({ taken, cupo }) {
  const c = capacity(taken, cupo);
  return (
    <span className="cupo">
      <span className="cupo-text"><Icon d={c.full ? ICONS.alert : ICONS.live} />{c.text}</span>
      {c.pct != null && <span className="cupo-bar" aria-hidden="true"><span className={c.full ? 'full' : ''} style={{ width: `${c.pct}%` }} /></span>}
    </span>
  );
}

// ------------------------------------------------------------ one card per date
function EventCard({ e }) {
  const d = new Date(`${e.starts_on}T12:00:00`);
  const src = photoUrl(e.cover);
  const wait = e.counts.lista_espera ?? 0;
  const open = e.counts.pendiente_verificacion ?? 0;
  return (
    <li>
      <PLink className="date-card" to={`/panel/inscripciones/${e.kind}/${e.id}`}>
        {src ? <img src={src} alt="" loading="lazy" /> : <span className="date-block" aria-hidden="true"><span className="p-num">{d.getDate()}</span>{d.toLocaleDateString('es-MX', { month: 'short' })}</span>}
        <span className="date-text">
          <strong>{e.title}</strong>
          <span>{KIND[e.kind]} · {fmtDate(e.starts_on)}{e.place ? ` · ${e.place}` : ''}</span>
          {e.mode === 'own' ? <Cupo taken={heldBy(e.counts)} cupo={e.cupo} /> : <span className="help">Entrada libre: no se inscribe nadie en el sitio.</span>}
          <span className="chips">
            <Pill status={wait ? 'en_revision' : 'borrador'}>En lista de espera: {wait}</Pill>
            <Pill status={open ? 'en_revision' : 'borrador'}>Falta confirmar correo: {open}</Pill>
          </span>
          {!e.published && <span className="help">Todavía sin publicar</span>}
        </span>
      </PLink>
    </li>
  );
}

export function RegistrationEvents() {
  const load = useLoad(() => get('/api/admin/registrations/events'), []);
  const [kind, setKind] = useState('');
  return (
    <>
      <PageHead title="Inscritos" sub="Quién se apuntó a cada fecha, cuántos lugares quedan y quién espera." />
      <Async load={load}>
        {(rows) => {
          if (!rows.length) return <Empty title="Aún no hay fechas con inscripción propia." />;
          const kinds = [...new Set(rows.map((r) => r.kind))];
          const shown = rows.filter((r) => !kind || r.kind === kind);
          const next = shown.filter((e) => !isPast(e)).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
          const past = shown.filter(isPast).sort((a, b) => b.starts_on.localeCompare(a.starts_on));
          return (
            <>
              {kinds.length > 1 && (
                <div className="filters"><label>Tipo<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Todos</option>{kinds.map((k) => <option key={k} value={k}>{KIND[k]}</option>)}</select></label></div>
              )}
              {next.length ? <ul className="date-cards">{next.map((e) => <EventCard key={`${e.kind}${e.id}`} e={e} />)}</ul> : <Empty title="No hay fechas próximas con inscripción." />}
              {past.length > 0 && (
                <details className="fold">
                  <summary>Fechas pasadas ({past.length})</summary>
                  <ul className="date-cards">{past.map((e) => <EventCard key={`${e.kind}${e.id}`} e={e} />)}</ul>
                </details>
              )}
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

// The same rules as the server (regrules.T). `says` is what the code really does, including which email goes out.
const ACTIONS = {
  confirm: {
    label: 'Confirmar lugar', from: ['pendiente_verificacion', 'lista_espera', 'oferta'], primary: true,
    says: (r, over, cupo) => [`Se confirmará el lugar de ${r.name}.`, over && `El cupo (${cupo}) ya está lleno: se confirmará de todos modos.`, `Le mandamos un correo de confirmación a ${r.email}.`],
  },
  waitlist: {
    label: 'Pasar a lista de espera', from: ['pendiente_verificacion', 'oferta', 'confirmado'],
    says: (r) => [`${r.name} pasará al final de la lista de espera.`, 'No se le manda ningún correo.'],
  },
  cancel: {
    label: 'Cancelar inscripción', from: ['pendiente_verificacion', 'lista_espera', 'oferta', 'confirmado'], danger: true,
    says: (r) => [`Se cancelará la inscripción de ${r.name}. A esta persona no se le manda ningún correo.`, 'Si queda un lugar libre y hay lista de espera, a la siguiente persona le llega un correo ofreciéndole el lugar por 48 horas.'],
  },
};

const FILTERS = [['', 'Todos'], ['confirmado', 'Confirmados'], ['oferta', 'Lugar ofrecido'], ['lista_espera', 'En lista de espera'], ['pendiente_verificacion', 'Falta confirmar correo'], ['cancelado', 'Cancelados'], ['expirado', 'Vencidos']];

function Person({ r, ev, manage, busy, onAsk }) {
  const [open, setOpen] = useState(false);
  const tel = telLink(r.phone);
  const wa = waLink(r.phone);
  return (
    <li className="card reg-person">
      <div className="p-row between"><strong className="reg-name">{r.name}</strong><RegPill s={r.status} /></div>
      <p className="help">
        {r.position ? `Lugar ${r.position} en la lista de espera · ` : ''}
        {r.status === 'oferta' ? `Tiene hasta el ${fmtDateTime(r.offer_expires_at)} para aceptar · ` : ''}
        Se inscribió el {fmtDateTime(r.created_at)}{r.lang === 'en' ? ' · prefiere inglés' : ''}
      </p>
      <p className="help">{r.email} · {r.phone}</p>
      <div className="p-row wrap">
        {tel && <a className="p-btn p-btn-sm" href={tel}><Icon d={ICONS.phone} />Llamar</a>}
        <a className="p-btn p-btn-sm" href={mailtoLink(r.email, ev?.title ? `Tu inscripción: ${ev.title}` : 'Tu inscripción', `Hola ${r.name},\n\n`)}><Icon d={ICONS.mail} />Escribir un correo</a>
        {wa && <a className="p-btn p-btn-sm" href={wa} target="_blank" rel="noopener noreferrer"><Icon d={ICONS.chat} />WhatsApp<span className="sr-only"> (se abre en otra pestaña)</span></a>}
      </div>
      {manage && (
        <div className="p-row wrap">
          {Object.entries(ACTIONS).filter(([, x]) => x.from.includes(r.status)).map(([a, x]) => (
            <button key={a} className={`p-btn p-btn-big${x.primary ? ' p-btn-primary' : x.danger ? ' p-btn-warn' : ''}`} disabled={busy} onClick={() => onAsk({ r, a })}>{x.label}</button>
          ))}
        </div>
      )}
      {manage && <div><button className="p-btn p-btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Ocultar datos' : 'Ver datos'}</button>{open && <Details id={r.id} />}</div>}
    </li>
  );
}

export function RegistrationList() {
  const { kind, id } = useParams();
  const toast = useToast();
  const q = `kind=${kind}&event_id=${id}`;
  const events = useLoad(() => get('/api/admin/registrations/events'), []);
  const load = useLoad(() => get(`/api/admin/registrations?${q}`), [q]);
  const [ask, setAsk] = useState(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(''); // names stay out of the address bar
  const [status, setStatus] = useState('');
  const ev = events.data?.find((e) => e.kind === kind && String(e.id) === id);

  // Whatever happens, the lists are loaded again so the screen shows the real state.
  async function run() {
    setBusy(true);
    try { await post(`/api/admin/registrations/${ask.r.id}/action`, { action: ask.a }); toast('Listo.'); } catch (e) { toast(`${errText(e)} Mostramos la lista tal como está ahora.`, 'error'); }
    setBusy(false);
    setAsk(null);
    load.reload();
    events.reload();
  }

  return (
    <>
      <nav aria-label="Ruta" className="crumbs"><PLink to="/panel/inscripciones">Inscritos</PLink> <span aria-hidden="true">/</span> <span>{ev?.title ?? 'Detalle'}</span></nav>
      <Async load={load}>
        {({ manage, rows }) => {
          const n = (s) => rows.filter((r) => r.status === s).length;
          const taken = n('confirmado') + n('oferta');
          const shown = rows.filter((r) => (!status || r.status === status) && (!search || norm(r.name).includes(norm(search))));
          const over = ask && ask.a === 'confirm' && ev?.cupo != null && taken >= ev.cupo && ask.r.status !== 'oferta';
          return (
            <>
              <PageHead title={ev?.title ?? 'Inscritos'} sub={ev ? `${KIND[kind]} · ${fmtDate(ev.starts_on)}${ev.place ? ` · ${ev.place}` : ''}` : undefined}>
                {manage && <a className="p-btn" href={`/api/admin/registrations/export.csv?${q}`} download><Icon d={ICONS.down} />Descargar lista</a>}
              </PageHead>
              {ev && <div className="card"><Cupo taken={taken} cupo={ev.cupo} /></div>}
              {!manage && <p className="help">Solo lectura: Asesoría ve la lista, pero no los datos sensibles ni las acciones.</p>}
              {!rows.length ? <Empty title="Aún no hay inscripciones." /> : (
                <>
                  <div className="filters" role="search"><label>Buscar por nombre<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Escribe parte del nombre" /></label></div>
                  <div className="chips" role="group" aria-label="Filtrar por estado">
                    {FILTERS.filter(([s]) => !s || n(s) > 0 || s === status).map(([s, label]) => (
                      <button key={s} type="button" className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>{label} <span className="p-num">{s ? n(s) : rows.length}</span></button>
                    ))}
                  </div>
                  {!shown.length ? <Empty title="Nadie coincide con eso.">Prueba con otro nombre o quita el filtro.</Empty> : (
                    <ul className="stack-list reg-list">{shown.map((r) => <Person key={r.id} r={r} ev={ev} manage={manage} busy={busy} onAsk={setAsk} />)}</ul>
                  )}
                </>
              )}
              {ask && (
                <Confirm title={`${ACTIONS[ask.a].label}: ${ask.r.name}`} danger={ACTIONS[ask.a].danger} confirmLabel={ACTIONS[ask.a].label} busy={busy} onCancel={() => setAsk(null)} onConfirm={run}>
                  {ACTIONS[ask.a].says(ask.r, over, ev?.cupo).filter(Boolean).map((t) => <p key={t}>{t}</p>)}
                </Confirm>
              )}
            </>
          );
        }}
      </Async>
    </>
  );
}
