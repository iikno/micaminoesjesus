import { get } from './api';
import { RESOURCES } from './resources';
import { useAuth } from './session';
import { Async, Empty, PLink, PageHead, STATUS, StatusPill, fmtDate, useLoad } from './ui';

const ORDER = ['borrador', 'en_revision', 'programado', 'publicado', 'rechazado'];

export default function Dashboard() {
  const { user, can } = useAuth();
  const list = Object.values(RESOURCES).filter((r) => can(r.perm, 'read'));
  const approver = list.some((r) => can(r.perm, 'approve'));
  const load = useLoad(async () => {
    const [sets, pending, mine] = await Promise.all([
      Promise.all(list.map((r) => get(`/api/admin/${r.entity}`).then((rows) => [r, rows]))),
      approver ? get('/api/admin/reviews/pending') : [],
      get('/api/admin/reviews/mine'),
    ]);
    return { sets, pending, mine };
  }, [user.id]);

  return (
    <>
      <PageHead title={`Hola, ${user.name.split(' ')[0]}`} sub="Resumen de lo que está a tu alcance." />
      <Async load={load} rows={6}>
        {({ sets, pending, mine }) => {
          const totals = Object.fromEntries(ORDER.map((s) => [s, sets.reduce((n, [, rows]) => n + rows.filter((r) => r.status === s).length, 0)]));
          const drafts = sets.flatMap(([r, rows]) => rows.filter((x) => x.created_by === user.id && (x.status === 'borrador' || x.status === 'rechazado')).map((x) => ({ r, x })));
          const comment = (r, x) => mine.find((m) => m.entity === r.entity && m.id === x.id)?.comment;
          const today = new Date().toISOString().slice(0, 10);
          const next = sets.flatMap(([r, rows]) => (['sessions', 'pilgrimages'].includes(r.entity) ? rows.filter((x) => x.starts_on >= today && x.status !== 'rechazado').map((x) => ({ r, x })) : []))
            .sort((a, b) => a.x.starts_on.localeCompare(b.x.starts_on)).slice(0, 5);
          return (
            <div className="dash">
              <section aria-labelledby="h-status">
                <h2 id="h-status" className="sr-only">Contenido por estado</h2>
                <ul className="p-tiles">
                  {ORDER.map((s) => <li key={s} className={`p-tile p-tile-${s}`}><span className="p-tile-n p-num">{totals[s]}</span><span>{STATUS[s]}</span></li>)}
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
              </section>

              {approver && (
                <section className="card" aria-labelledby="h-pend">
                  <h2 id="h-pend">Pendientes de revisión <span className="count p-num">{pending.length}</span></h2>
                  {!pending.length ? <p className="help">No hay nada esperando decisión.</p> : (
                    <ul className="list">
                      {pending.slice(0, 6).map((p) => <li key={p.review_id}><PLink to="/panel/revision">{p.label}</PLink> <span className="help">· {RESOURCES[p.entity].one} · hace {p.hours} h{p.own ? ' · tuyo' : ''}</span></li>)}
                    </ul>
                  )}
                  {pending.length > 0 && <PLink className="p-btn p-btn-sm" to="/panel/revision">Abrir la cola</PLink>}
                </section>
              )}

              <section className="card" aria-labelledby="h-mine">
                <h2 id="h-mine">Mis borradores y rechazados</h2>
                {!drafts.length ? <p className="help">No tienes borradores pendientes.</p> : (
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

              <section className="card" aria-labelledby="h-next">
                <h2 id="h-next">Próximas fechas</h2>
                {!next.length ? <Empty title="Sin fechas próximas.">Las fechas de retiros y peregrinaciones que registres aparecerán aquí.</Empty> : (
                  <ul className="list">
                    {next.map(({ r, x }) => <li key={`${r.entity}${x.id}`}><span className="p-num">{fmtDate(x.starts_on)}</span> · <PLink to={`/panel/${r.path}/${x.id}`}>{r.label(x)}</PLink> <StatusPill status={x.status} /></li>)}
                  </ul>
                )}
              </section>
            </div>
          );
        }}
      </Async>
    </>
  );
}
