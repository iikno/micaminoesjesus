import peregrinosLogo from '../assets/logos/peregrinos.png';
import silvia from '../assets/images/equipo/silvia.jpg';
import { WHATSAPP_URL } from '../data/site';
import Polaroid from '../components/Polaroid';

const SIGNIFICADO = [
  { t: 'Cruz de Jerusalén', d: 'Presente en el emblema.' },
  { t: 'PER', d: 'Significa “a través de”.' },
  { t: 'Arco', d: 'El arco del camino recorrido.' },
  { t: 'Franja diagonal', d: 'La misma franja diagonal de XP Lev.' },
];

export default function Peregrinos() {
  return (
    <>
      <section className="band pg-sec pg-page">
        <div className="wrap grid">
          <div>
            <div className="kicker red">La dimensión +1</div>
            <h1 className="d">Peregrinos</h1>
            <p className="big">Peregrinaciones a lo largo de México y del mundo para acercar a las personas a Cristo y a la historia de la fe: los lugares donde la fe se vivió, se defendió y se sigue viviendo.</p>
            <p>Para fieles y para quienes aún no conocen a Cristo: el camino también evangeliza. Cada peregrinación es un retiro en movimiento: encuentro, formación, comunidad y misión.</p>
          </div>
          <div className="shot"><img src={peregrinosLogo} alt="Logo de Peregrinos" /></div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="kicker red">El logo</div>
          <h2 className="d sec-title">Qué significa</h2>
          <ol className="pil">
            {SIGNIFICADO.map((s, i) => (
              <li key={s.t}>
                <span className="d n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="d">{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band team">
        <div className="wrap resp-grid">
          <Polaroid foto={silvia} nombre="Silvia “Silber” Ponce" rol="Responsable de Peregrinos" />
          <div>
            <div className="kicker red">Responsable</div>
            <h2 className="d sec-title">Silvia “Silber” Ponce</h2>
            <p>Agente de viajes certificada y ex agente de la Pastoral Vocacional de Piedras Negras, Coahuila.</p>
          </div>
        </div>
      </section>

      <section className="band next">
        <div className="wrap">
          <div className="kicker">Próximas peregrinaciones</div>
          <h2 className="d sec-title">Próximamente</h2>
          <p className="lead-block">Aún no publicamos fechas ni destinos. Escríbenos y te avisamos en cuanto estén listos.</p>
          <a className="btn" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </section>
    </>
  );
}
