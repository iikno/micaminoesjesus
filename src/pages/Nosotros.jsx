import { Link } from 'react-router-dom';
import nosotrosImage from '../assets/images/nosotros.webp';
import { EQUIPO } from '../data/equipo';
import { MISION, VISION, TAGLINE } from '../data/site';
import Verso from '../components/Verso';

const PILARES = [
  { nombre: 'Encuentro', texto: 'Todo comienza con un encuentro real con Jesucristo vivo.' },
  { nombre: 'Formación', texto: 'Crecemos en la fe con estudio, oración y sacramentos.' },
  { nombre: 'Comunidad', texto: 'Vivimos la fraternidad como parte esencial del camino.' },
  { nombre: 'Misión', texto: 'Salimos a anunciar lo que hemos vivido, sin miedo.' },
];

export default function Nosotros() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">Nosotros</div>
          <h1 className="d">Quiénes <span className="jesus">somos</span></h1>
          <p className="lead">{TAGLINE}</p>
        </div>
      </section>

      <section className="band nos">
        <div className="wrap grid">
          <div className="pol"><img src={nosotrosImage} alt="Comunidad en oración" /></div>
          <div>
            <p>
              Mi Camino es Jesús nace con raíz joven, pero su vocación es más grande: ser una
              escuela de Nueva Evangelización que acompaña a personas de toda edad en un encuentro
              personal y transformador con Cristo, dentro de la vida de la Iglesia católica.
            </p>
            <p>
              Creemos que el mundo actual necesita un punto de quiebre. Con un lenguaje directo y
              cercano, abrimos un espacio donde la fe se vive con alegría, sin dejar de ser
              exigente y real: para jóvenes, para adultos, y para quienes buscan un camino de
              regreso a Cristo.
            </p>
            <div className="mv">
              <div><h2 className="d">Misión</h2><p>{MISION}</p></div>
              <div><h2 className="d">Visión</h2><p>{VISION}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="band pilares">
        <div className="wrap">
          <div className="kicker gold">Los cuatro pilares</div>
          <h2 className="d sec-title">Sobre qué caminamos</h2>
          <ol className="pil">
            {PILARES.map((p, i) => (
              <li key={p.nombre}>
                <span className="d n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="d">{p.nombre}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band team">
        <div className="wrap">
          <div className="kicker red">El equipo</div>
          <h2 className="d sec-title">Quiénes lo hacen posible</h2>
          <ul className="staff">
            {EQUIPO.map((m) => (
              <li key={m.nombre}>
                <figure className="p"><div className="ph"><img src={m.foto} alt={m.nombre} loading="lazy" /></div></figure>
                <div>
                  <h3 className="d">{m.nombre}</h3>
                  <p>{m.rol}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link className="btn" to="/contacto">Escríbenos</Link>
        </div>
      </section>

      <Verso />
    </>
  );
}
