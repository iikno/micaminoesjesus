import { createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { get } from './api';
import { RESOURCES } from './resources';
import { useAuth } from './session';
import { Async, Empty, ICONS, Icon, PLink, PageHead, StatusPill, useLoad } from './ui';

// One load of "what is waiting for me", shared by the bottom-bar counter, Inicio and this page.
const Ctx = createContext(null);
export const PendingProvider = Ctx.Provider;
export const usePending = () => useContext(Ctx);
export const pendingCount = (d) => (d ? d.pending.length + (d.inbox?.nuevos ?? 0) + d.mine.length : 0);

export function usePendingLoad() {
  const { user, can } = useAuth();
  const approver = Object.keys(user.perms).some((k) => can(k, 'approve'));
  const { pathname } = useLocation(); // refresh after deciding / answering somewhere else
  return useLoad(async () => {
    const [pending, mine, inbox] = await Promise.all([
      approver ? get('/api/admin/reviews/pending') : [],
      get('/api/admin/reviews/mine'),
      can('contact', 'read') ? get('/api/admin/contact/summary') : null,
    ]);
    return { pending, mine, inbox };
  }, [user.id, pathname]);
}

const Task = ({ to, ico, title, children }) => (
  <li><PLink className="task" to={to}><Icon d={ICONS[ico]} /><span className="task-text"><strong>{title}</strong>{children}</span><span className="task-go" aria-hidden="true">›</span></PLink></li>
);

// `limit`: how many rows per group (Inicio shows a few; the page shows all).
export function PendingGroups({ limit = Infinity }) {
  const load = usePending();
  return (
    <Async load={load} rows={3}>
      {({ pending, mine, inbox }) => {
        if (!pendingCount({ pending, mine, inbox })) return <Empty title="Todo en orden.">No hay nada esperándote. ¡Gracias por tu servicio!</Empty>;
        return (
          <div className="task-groups">
            {pending.length > 0 && (
              <section aria-labelledby="g-rev">
                <h2 id="g-rev">Esperan tu decisión <span className="count p-num">{pending.length}</span></h2>
                <ul className="tasks">
                  {pending.slice(0, limit).map((p) => (
                    <Task key={p.review_id} to="/revision" ico="review" title={p.label}>
                      <span className="help">{RESOURCES[p.entity].one} · {p.own ? 'enviado por ti' : `de ${p.submitted_by_name ?? 'alguien del equipo'}`} · hace {p.hours} h</span>
                    </Task>
                  ))}
                </ul>
              </section>
            )}
            {inbox?.nuevos > 0 && (
              <section aria-labelledby="g-msg">
                <h2 id="g-msg">Mensajes sin atender <span className="count p-num">{inbox.nuevos}</span></h2>
                <ul className="tasks">
                  <Task to="/contacto" ico="bell" title={`${inbox.nuevos} mensaje(s) nuevo(s)`}>
                    <span className="help">{inbox.arco_abiertos} solicitud(es) ARCO abiertas{inbox.arco_vencidos ? ` · ${inbox.arco_vencidos} vencida(s)` : ''}</span>
                  </Task>
                </ul>
              </section>
            )}
            {mine.length > 0 && (
              <section aria-labelledby="g-mine">
                <h2 id="g-mine">Te devolvieron con comentarios <span className="count p-num">{mine.length}</span></h2>
                <ul className="tasks">
                  {mine.slice(0, limit).map((m) => (
                    <Task key={`${m.entity}${m.id}`} to={`/${RESOURCES[m.entity].path}/${m.id}`} ico="alert" title={m.label}>
                      <span><StatusPill status="rechazado" /></span>
                      {m.comment && <span className="help">{m.comment}</span>}
                    </Task>
                  ))}
                </ul>
              </section>
            )}
          </div>
        );
      }}
    </Async>
  );
}

export default function Pendientes() {
  return (
    <>
      <PageHead title="Pendientes" sub="Lo que está esperando que lo veas." />
      <PendingGroups />
    </>
  );
}
