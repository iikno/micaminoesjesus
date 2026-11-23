import { Link } from 'react-router-dom';
import { PROYECTOS } from '../data/proyectos';
import { useLang, useMeta } from '../i18n';

function Accion({ l, label }) {
  const { to } = useLang();
  const cls = `btn${l.sec ? ' btn--ghost btn--sm' : ' btn--sm'}`;
  if (l.to) return <Link className={cls} to={to(l.to)}>{label} &rarr;</Link>;
  return <a className={cls} href={l.href} target="_blank" rel="noreferrer">{label}</a>;
}

export default function Proyectos() {
  useMeta('proyectos');
  const { t, r } = useLang();
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">{t('proy.k')}</div>
          <h1 className="d">{r('proy.h')}</h1>
          <p className="lead">{t('proy.lead')}</p>
        </div>
      </section>

      <div className="projects">
        {PROYECTOS.map((p, i) => (
          <section key={p.id} id={p.id} className={`band proyecto ${i % 2 ? 'alt' : ''}`}>
            <div className="wrap grid">
              <div className="shot"><img src={p.logo} alt={t(`proy.${p.id}.alt`)} loading="lazy" /></div>
              <div>
                <div className="kicker">{t(`proy.${p.id}.tag`)}</div>
                <h2 className="d">{p.nombre}</h2>
                <p>{t(`proy.${p.id}.desc`)}</p>
                <div className="acts">{p.links.map((l, n) => <Accion key={n} l={l} label={t(`proy.${p.id}.l${n}`)} />)}</div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
