import { get } from './api';
import { photoUrl } from './Media';
import { PendingGroups, pendingCount, usePending } from './Pendientes';
import { RESOURCES } from './resources';
import { useAuth } from './session';
import { InstallCard } from './Instalar';
import { Async, Empty, ICONS, Icon, PLink, PageHead, STATUS, StatusPill, useLoad } from './ui';

const ORDER = ['borrador', 'en_revision', 'programado', 'publicado', 'rechazado'];
const day = (v) => new Date(`${v}T12:00:00`);

// Big, labelled buttons for what this role does most.
const ACTIONS = [
  ['retreats', 'write', '/panel/retiros/nuevo', 'Nuevo retiro'],
  ['sessions', 'write', '/panel/fechas/nuevo', 'Nueva fecha'],
  ['pilgrimages', 'write', '/panel/peregrinaciones/nuevo', 'Nueva peregrinación'],
];

export default function Dashboard() {
  const { user, can } = useAuth();
  const pend = usePending();
  const list = Object.values(RESOURCES).filter((r) => can(r.perm, 'read'));
  const approver = list.some((r) => can(r.perm, 'approve'));
  const load = useLoad(async () => Promise.all(list.map((r) => get(`/api/admin/${r.entity}`).then((rows) => [r, rows]))), [user.id]);
  const acts = ACTIONS.filter(([res, act]) => can(res, act));
  const waiting = pendingCount(pend.data);

  return (
    <>
      <PageHead title={`Hola, ${user.name.split(' ')[0]}`} sub="¿Qué quieres hacer hoy?" />
      <InstallCard />
      <div className="big-actions">
        {acts.map(([, , to, label], i) => <PLink key={to} className={`p-btn p-btn-big${i ? '' : ' p-btn-primary'}`} to={to}><Icon d={ICONS.plus} />{label}</PLink>)}
        {can('registrations', 'read') && <PLink className="p-btn p-btn-big" to="/panel/inscripciones"><Icon d={ICONS.regs} />Ver inscritos</PLink>}
        {approver && <PLink className={`p-btn p-btn-big${acts.length ? '' : ' p-btn-primary'}`} to="/panel/revision"><Icon d={ICONS.review} />Revisar lo pendiente{pend.data ? ` (${pend.data.pending.length})` : ''}</PLink>}
      </div>

      <section className="card" aria-labelledby="h-today">
        <h2 id="h-today">Te espera hoy{waiting > 0 && <span className="count p-num">{waiting}</span>}</h2>
        <PendingGroups limit={3} />
        {waiting > 0 && <PLink className="p-btn" to="/panel/pendientes">Ver todo lo pendiente</PLink>}
      </section>

      <Async load={load} rows={6}>
        {(sets) => {
          const today = new Date().toISOString().slice(0, 10);
          const covers = Object.fromEntries((sets.find(([r]) => r.entity === 'retreats')?.[1] ?? []).map((x) => [x.id, x.cover]));
          const drafts = sets.flatMap(([r, rows]) => rows.filter((x) => x.created_by === user.id && (x.status === 'borrador' || x.status === 'rechazado')).map((x) => ({ r, x })));
          const next = sets.flatMap(([r, rows]) => (['sessions', 'pilgrimages'].includes(r.entity) ? rows.filter((x) => x.starts_on >= today && x.status !== 'rechazado').map((x) => ({ r, x })) : []))
            .sort((a, b) => a.x.starts_on.localeCompare(b.x.starts_on)).slice(0, 5);
          const comment = (r, x) => pend.data?.mine.find((m) => m.entity === r.entity && m.id === x.id)?.comment;
          return (
            <>
              <section aria-labelledby="h-next">
                <h2 id="h-next">Próximas fechas</h2>
                {!next.length ? <Empty title="Sin fechas próximas.">Las fechas de retiros y peregrinaciones que registres aparecerán aquí.</Empty> : (
                  <ul className="date-cards">
                    {next.map(({ r, x }) => {
                      const src = photoUrl(r.entity === 'sessions' ? covers[x.retreat_id] : x.cover);
                      const d = day(x.starts_on);
                      return (
                        <li key={`${r.entity}${x.id}`}>
                          <PLink className="date-card" to={`/panel/${r.path}/${x.id}`}>
                            {src ? <img src={src} alt="" loading="lazy" /> : <span className="date-block" aria-hidden="true"><span className="p-num">{d.getDate()}</span>{d.toLocaleDateString('es-MX', { month: 'short' })}</span>}
                            <span className="date-text">
                              <strong>{r.label(x)}</strong>
                              <span>{r.entity === 'sessions' ? 'Fecha de retiro' : 'Peregrinación'} · {d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                              <StatusPill status={x.status} />
                            </span>
                          </PLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="card" aria-labelledby="h-mine">
                <h2 id="h-mine">Lo que estás escribiendo</h2>
                {!drafts.length ? <p className="help">No tienes nada en proceso.</p> : (
                  <ul className="list">
                    {drafts.map(({ r, x }) => (
                      <li key={`${r.entity}${x.id}`}>
                        <PLink to={`/panel/${r.path}/${x.id}`}>{r.label(x)}</PLink> <StatusPill status={x.status} />
                        {x.status === 'rechazado' && comment(r, x) && <blockquote>{comment(r, x)}</blockquote>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <details className="card summary-box">
                <summary>Resumen por estado</summary>
                <ul className="p-tiles">
                  {ORDER.map((s) => <li key={s} className={`p-tile p-tile-${s}`}><span className="p-tile-n p-num">{sets.reduce((n, [, rows]) => n + rows.filter((r) => r.status === s).length, 0)}</span><span>{STATUS[s]}</span></li>)}
                </ul>
                <div className="table-wrap">
                  <table className="tbl">
                    <caption className="sr-only">Contenido por sección y estado</caption>
                    <thead><tr><th scope="col">Sección</th>{ORDER.map((s) => <th key={s} scope="col" className="p-num">{STATUS[s]}</th>)}</tr></thead>
                    <tbody>
                      {sets.map(([r, rows]) => (
                        <tr key={r.entity}><th scope="row"><PLink to={`/panel/${r.path}`}>{r.title}</PLink></th>{ORDER.map((s) => <td key={s} className="p-num">{rows.filter((x) => x.status === s).length}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          );
        }}
      </Async>
    </>
  );
}
