import { Link } from 'react-router-dom';
import ProjectPanels from '../components/ProjectPanels';
import { CALENDARIO } from '../data/calendario';
import { PROYECTOS } from '../data/proyectos';
import { useLang, useMeta } from '../i18n';
import { useApi } from '../lib/api';

const OTROS = PROYECTOS.filter((p) => p.externo);

function Accion({ l, label }) {
  const { to } = useLang();
  const cls = `btn${l.sec ? ' btn--ghost btn--sm' : ' btn--sm'}`;
  if (l.to) return <Link className={cls} to={to(l.to)}>{label} &rarr;</Link>;
  return <a className={cls} href={l.href} target="_blank" rel="noreferrer">{label}</a>;
}

export default function Proyectos() {
  useMeta('proyectos');
  const { lang, t, r } = useLang();
  const calendar = useApi(`/api/public/calendar?lang=${lang}`, lang === 'es' ? CALENDARIO : []);
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker">{t('proy.k')}</div>
          <h1>{r('proy.h')}</h1>
          <p className="lead">{t('proy.lead')}</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap"><ProjectPanels items={calendar} /></div>
      </section>

      <section className="band sec-peach" id="otros">
        <div className="wrap">
          <div className="kicker">{t('otros.k')}</div>
          <h2 className="h2">{t('otros.h')}</h2>
          <p className="sub">{t('otros.lead')}</p>
          <div className="otros-cards">
            {OTROS.map((p) => (
              <article key={p.id} id={p.id} className="ocard">
                <img src={p.logo} alt={t(`proy.${p.id}.alt`)} loading="lazy" />
                <div>
                  <div className="kicker">{t(`proy.${p.id}.tag`)}</div>
                  <h3>{p.nombre}</h3>
                  <p>{t(`proy.${p.id}.desc`)}</p>
                  <div className="acts">{p.links.map((l, n) => <Accion key={n} l={l} label={t(`proy.${p.id}.l${n}`)} />)}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
