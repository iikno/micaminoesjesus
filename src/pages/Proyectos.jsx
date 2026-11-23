import { Link } from 'react-router-dom';
import { PROYECTOS } from '../data/proyectos';

function Accion({ l }) {
  const cls = `btn${l.sec ? ' btn--ghost btn--sm' : ' btn--sm'}`;
  if (l.to) return <Link className={cls} to={l.to}>{l.label} &rarr;</Link>;
  return <a className={cls} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>;
}

export default function Proyectos() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">Proyectos</div>
          <h1 className="d">Con quién <span className="jesus">caminamos</span></h1>
          <p className="lead">
            Además de la escuela, caminamos junto a otros proyectos que anuncian a Jesús desde
            distintos lenguajes: moda, redes, peregrinaciones y experiencias de encuentro.
          </p>
        </div>
      </section>

      <div className="projects">
        {PROYECTOS.map((p, i) => (
          <section key={p.id} id={p.id} className={`band proyecto ${i % 2 ? 'alt' : ''}`}>
            <div className="wrap grid">
              <div className="shot"><img src={p.logo} alt={p.alt} loading="lazy" /></div>
              <div>
                <div className="kicker">{p.tag}</div>
                <h2 className="d">{p.nombre}</h2>
                <p>{p.desc}</p>
                <div className="acts">{p.links.map((l) => <Accion key={l.label} l={l} />)}</div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
