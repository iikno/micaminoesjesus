import { useState } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/images/hero.webp';
import nosotrosImage from '../assets/images/nosotros.webp';
import ozEmaus from '../assets/images/OZ-EMAUS.jpg';
import simjaBuenPastor from '../assets/images/SIMJA-BUENPASTOR.jpg';
import xpLogo from '../assets/images/xp-lev.png';
import peregrinosLogo from '../assets/logos/peregrinos.png';
import { DEREJ, XPLEV_TOTAL, XPLEV_LISTAS } from '../data/retreats';
import { EQUIPO } from '../data/equipo';
import { PROYECTOS } from '../data/proyectos';
import { MISION, VISION, PILARES, TAGLINE, WHATSAPP_URL, WHATSAPP_DISPLAY } from '../data/site';
import Calendario from '../components/Calendario';
import Polaroid from '../components/Polaroid';
import Verso from '../components/Verso';

const MARQUEE = [...Object.values(DEREJ).map((d) => d.name), '+ Peregrinos'];
const LISTAS_HOY =
  'Levántate y Sé Hombre, Emmanuel, Camino a Belén, Emaús, Pedro el discípulo firme, Juan el discípulo amado y Jesucristo Nuestra Esperanza.';

function Tile({ id, d, open, onToggle }) {
  const [titulo, resto] = d.name.split(' ');
  return (
    <div className={`tile${open ? ' open' : ''}`} style={{ '--tc': d.color }}>
      <button type="button" className="tile__btn" aria-expanded={open} aria-controls={`more-${id}`} onClick={onToggle}>
        <span className="bg"><img src={d.foto} alt="" loading="lazy" /></span>
        <span className="t-in">
          <span>
            <span className="nm">{titulo}<br />{resto}</span>
            <span className="st">{d.subtitle}</span>
          </span>
          <span className="who">{d.who}</span>
        </span>
      </button>
      <div className="more" id={`more-${id}`}>
        <b>{d.audience}</b>
        {d.more}
        <Link to={`/proyectos/xp-lev?camino=${id}`}>Ver el catálogo &rarr;</Link>
      </div>
    </div>
  );
}

export default function Home() {
  const [abierto, setAbierto] = useState(null);
  const masProyectos = PROYECTOS.filter((p) => p.externo);

  return (
    <>
      <section className="hero">
        <div className="wrap grid">
          <div>
            <div className="kicker rv">Escuela de Nueva Evangelización</div>
            <h1 className="d" aria-label="Mi camino es Jesús">
              <span className="ln"><span>Mi camino</span></span>
              <span className="ln"><span>es</span></span>
              <span className="ln"><span className="jesus">Jesús</span></span>
            </h1>
            <p className="tag rv">{TAGLINE}</p>
            <p className="lead rv">Una escuela católica que acompaña a jóvenes y adultos en un encuentro real con Jesús, en comunidad, formación y misión.</p>
            <div className="cta rv">
              <a className="btn" href="#derej">Elige tu camino</a>
              <Link className="btn btn--ghost" to="/nosotros">Conócenos</Link>
            </div>
          </div>
          <div className="collage" aria-hidden="true">
            <div className="pol a"><div className="ph"><img src={ozEmaus} alt="" /></div></div>
            <div className="pol b"><div className="ph"><img src={heroImage} alt="" /></div></div>
            <div className="pol c"><div className="ph"><img src={simjaBuenPastor} alt="" /></div></div>
            <div className="sticker"><div><b>Josué 1:9</b>Sé fuerte y valiente</div></div>
          </div>
        </div>
      </section>

      <div className="ticker-wrap">
      <div className="ticker" role="img" aria-label={`Los seis Dérej y Peregrinos: ${MARQUEE.join(', ')}`}>
        <div className="track" aria-hidden="true">
          {[0, 1].map((n) => MARQUEE.map((m) => (
            <span key={`${n}-${m}`} className={`${m.startsWith('+') ? 'pg' : ''}${n ? ' dup' : ''}`}>{m}</span>
          )))}
        </div>
      </div>
      </div>

      <section className="band routes">
        <div className="wrap">
          <div className="kicker red">Entra por aquí</div>
          <h2 className="d sec-title">¿Desde dónde llegas?</h2>
          <div className="grid">
            <a className="route r1" href="#derej">
              <div><div className="d who">Soy joven</div><p>Retiros y talleres para encontrarte con Jesús, sin máscaras ni prisas.</p></div>
              <span className="go">Ver los caminos <i>&rarr;</i></span>
            </a>
            <Link className="route r2" to="/proyectos/xp-lev">
              <div><div className="d who">Soy padre o catequista</div><p>Un catálogo de retiros listo para acompañar a tu grupo o familia.</p></div>
              <span className="go">Explorar XP Lev <i>&rarr;</i></span>
            </Link>
            <Link className="route r3" to="/contacto">
              <div><div className="d who">Soy parroquia o diócesis</div><p>Caminemos juntos: formación y misión para tu comunidad.</p></div>
              <span className="go">Hablemos <i>&rarr;</i></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="band nos" id="nosotros">
        <div className="wrap grid">
          <div className="pol"><img src={nosotrosImage} alt="Comunidad de Mi Camino es Jesús reunida" /></div>
          <div>
            <div className="kicker red">Quiénes somos</div>
            <h2 className="d sec-title">Nadie recorre este camino solo</h2>
            <p>Somos una escuela católica de Nueva Evangelización, con raíz joven y un corazón abierto a todo el que busca a Cristo. Todo comienza con un encuentro real con Jesucristo vivo.</p>
            <div className="words">{PILARES.map((p) => <span key={p}>{p}</span>)}</div>
            <div className="mv">
              <div><h3 className="d">Misión</h3><p>{MISION}</p></div>
              <div><h3 className="d">Visión</h3><p>{VISION}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="band derej" id="derej">
        <div className="wrap">
          <div className="kicker gold">Los seis Dérej, por público</div>
          <h2 className="d sec-title">Seis caminos. Uno es el tuyo.</h2>
          <p className="sub">Toca o pasa el cursor sobre cada camino para ver a quién acompaña. Y un séptimo elemento que no es un Dérej: Peregrinos, más abajo.</p>
          <div className="tiles">
            {Object.entries(DEREJ).map(([id, d]) => (
              <Tile key={id} id={id} d={d} open={abierto === id} onToggle={() => setAbierto(abierto === id ? null : id)} />
            ))}
          </div>
        </div>
      </section>

      <section className="band pg-sec" id="peregrinos">
        <div className="wrap grid">
          <div>
            <div className="kicker red">La dimensión +1</div>
            <h2 className="d">Peregrinos</h2>
            <p className="big">Peregrinaciones a lo largo de México y del mundo para acercar a las personas a Cristo y a la historia de la fe: los lugares donde la fe se vivió, se defendió y se sigue viviendo.</p>
            <p>Para fieles y para quienes aún no conocen a Cristo: el camino también evangeliza. Cada peregrinación es un retiro en movimiento: encuentro, formación, comunidad y misión.</p>
            <Link className="btn" to="/proyectos/peregrinos">Conoce Peregrinos</Link>
          </div>
          <div className="shot"><img src={peregrinosLogo} alt="Logo de Peregrinos" loading="lazy" /></div>
        </div>
      </section>

      <section className="band xp" id="xp">
        <div className="wrap grid">
          <div>
            <div className="kicker gold">Proyecto</div>
            <h2 className="d">XP <em>Lev</em></h2>
            <p>El catálogo de retiros de Mi Camino es Jesús, organizado por Dérej y por tiempo litúrgico, para que encuentres el que necesita tu grupo.</p>
            <p className="mean"><b>XP</b> es el Ji-Rho, monograma de Cristo. <b>Lev</b> es corazón en hebreo. Juntos: <b>Cristo en el corazón</b>.</p>
            <div className="nums">
              <div><span className="d">{XPLEV_TOTAL}</span>experiencias</div>
              <div><span className="d">{XPLEV_LISTAS}</span>listas</div>
              <div><span className="d">{XPLEV_TOTAL - XPLEV_LISTAS}</span>en preparación</div>
            </div>
            <p className="ready"><b>Listas hoy:</b> {LISTAS_HOY}</p>
            <Link className="btn" to="/proyectos/xp-lev">Ver el catálogo</Link>
          </div>
          <div className="shot"><img src={xpLogo} alt="Logo de XP Lev" loading="lazy" /></div>
        </div>
      </section>

      <section className="band proj" id="proyectos">
        <div className="wrap">
          <div className="kicker red">Más proyectos</div>
          <h2 className="d sec-title">También caminamos aquí</h2>
          <div className="plist">
            {masProyectos.map((p) => (
              <Link key={p.id} className="prow" to={`/proyectos#${p.id}`}>
                <h3 className="d">{p.nombre}</h3><span className="k">{p.tag}</span><span className="ar" aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="band team">
        <div className="wrap">
          <div className="kicker red">El equipo</div>
          <h2 className="d sec-title">Quiénes lo hacen posible</h2>
          <div className="crew">
            {EQUIPO.map((m) => <Polaroid key={m.nombre} foto={m.foto} nombre={m.nombre} rol={m.rol} />)}
          </div>
        </div>
      </section>

      <section className="band next" id="calendario">
        <div className="wrap">
          <div className="kicker">Calendario público</div>
          <h2 className="d sec-title">Lo que viene</h2>
          <Calendario />
          <Link className="btn btn--ghost" to="/calendario">Ver el calendario completo</Link>
        </div>
      </section>

      <Verso />

      <section className="band contact" id="contacto">
        <div className="wrap">
          <div className="kicker">Contacto</div>
          <h2 className="d">Da el primer paso</h2>
          <div className="row">
            <span className="num d">{WHATSAPP_DISPLAY}</span>
            <a className="btn" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
          </div>
        </div>
      </section>
    </>
  );
}
