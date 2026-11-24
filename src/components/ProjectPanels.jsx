import { Link } from 'react-router-dom';
import { PROYECTOS } from '../data/proyectos';
import { useLang } from '../i18n';

const OWN = PROYECTOS.filter((p) => !p.externo);

// "Lo próximo" comes from the public calendar: the first upcoming item of each project, or a fixed note when there is none.
function nextOf(items, id, t) {
  const it = items.find((x) => (x.kind === 'peregrinacion') === (id === 'peregrinos'));
  return it ? `${it.cuando}: ${it.titulo}` : t(id === 'peregrinos' ? 'pg.next.p' : 'proy.xp-lev.none');
}

// The two own projects, side by side with the same weight (Home and /proyectos).
export default function ProjectPanels({ items = [] }) {
  const { t, to } = useLang();
  return (
    <div className="panels">
      {OWN.map((p) => (
        <article className="panel-card" key={p.id} id={p.id}>
          <header>
            <img src={p.logo} alt={t(`proy.${p.id}.alt`)} />
            <div>
              <h3>{p.nombre}</h3>
              <p>{t(`proy.${p.id}.tag`)}</p>
            </div>
          </header>
          <p className="desc">{t(`proy.${p.id}.desc`)}</p>
          <dl>
            <div><dt>{t('proy.who')}</dt><dd>{t(`proy.${p.id}.who`)}</dd></div>
            <div><dt>{t('proy.how')}</dt><dd>{t(`proy.${p.id}.how`)}</dd></div>
            <div><dt>{t('proy.next')}</dt><dd>{nextOf(items, p.id, t)}</dd></div>
          </dl>
          <Link className="btn" to={to(p.links[0].to)}>{t(`proy.${p.id}.l0`)}</Link>
        </article>
      ))}
    </div>
  );
}
