import { Link, useSearchParams } from 'react-router-dom';
import {
  derejGuibor, derejKavod, derejMesharet, derejSimja, derejOz, derejJaim,
  SEASONS, DEREJ, TIPO_LABELS, TIPO_ABBR, CORTES_SIMJA,
} from '../data/retreats';

const ITEMS = {
  guibor: derejGuibor, kavod: derejKavod, oz: derejOz,
  simja: derejSimja, mesharet: derejMesharet, jaim: derejJaim,
};
const SHORT_NAME = { all: 'Todos' };
const CAMINOS = ['all', ...Object.keys(DEREJ)];

const SEQUENCE_FOOTNOTES = {
  guibor: { note: 'Formato pedagógico secuencial recomendado', route: 'Ruta Hombría Bíblica' },
  kavod: { note: 'Secuencia formativa de autodescubrimiento y sanación', route: 'Ruta Mujer Nueva' },
};
const OPEN_DESCRIPTIONS = {
  mesharet: 'Módulos independientes para revitalizar el celo pastoral, la técnica evangelizadora y la comunión del equipo servidor.',
  jaim: 'Gran repertorio de retiros de impacto, talleres de discernimiento bíblico y Horas Santas temáticas por calendario eclesial.',
};

function SeasonDot({ season }) {
  if (!season || !SEASONS[season]) return null;
  return <span className="season-dot" style={{ '--sc': `var(--season-${season})` }} title={SEASONS[season].name} />;
}

function TipoTag({ tipo, category }) {
  const label = category || TIPO_LABELS[tipo];
  const abbr = TIPO_ABBR[tipo];
  if (!label || !abbr) return null;
  return <sup className="tipo-tag" title={label}>{abbr}</sup>;
}

function StatusPill({ estado }) {
  const pending = estado === 'proximamente';
  return <span className={`xplev-pill${pending ? ' is-pending' : ''}`}>{pending ? 'Próximamente' : 'Disponible'}</span>;
}

// Agrupa por tipo (retiro/taller/hora_santa); lo sin tipo (contenido sin redactar) cae en "En preparación".
function groupByTipo(items) {
  const order = ['retiro', 'taller', 'hora_santa'];
  const groups = order
    .map((tipo) => ({ tipo, label: TIPO_LABELS[tipo], items: items.filter((i) => i.tipo === tipo) }))
    .filter((g) => g.items.length > 0);
  const rest = items.filter((i) => !order.includes(i.tipo));
  if (rest.length) groups.push({ tipo: null, label: 'En preparación', items: rest });
  return groups;
}

// Dérej Simjá se agrupa por corte de edad en lugar de por tipo.
function groupByCorte(items) {
  return ['primaria', 'kinder', 'ambos']
    .map((corte) => ({ corte, ...CORTES_SIMJA[corte], items: items.filter((i) => i.corte === corte) }))
    .filter((g) => g.items.length > 0);
}

function CardHead({ info, tag, children }) {
  return (
    <header className="xc-head">
      <div>
        <span className="xc-sub">{info.subtitle}</span>
        <h2 className="d">{info.name}</h2>
        <p>{info.audience}</p>
      </div>
      {tag && <span className="xc-tag">{tag}</span>}
      {children}
    </header>
  );
}

function CardFoot({ note, label = 'Solicitar para tu parroquia' }) {
  return (
    <footer className="xc-foot">
      <span>{note}</span>
      <Link to="/contacto">{label} &rarr;</Link>
    </footer>
  );
}

function ChipList({ items }) {
  return (
    <div className="xplev-chip-list">
      {items.map((item) => (
        <Link key={item.id} to={`/proyectos/${item.id}`} className={`xplev-chip${item.estado === 'proximamente' ? ' is-pending' : ''}`}>
          <SeasonDot season={item.season} />
          {item.title}
          {item.estado === 'proximamente' && <span className="xplev-chip__pending">Próximamente</span>}
        </Link>
      ))}
    </div>
  );
}

// Guibor/Kavod: secuencia de 6 pasos, línea de tiempo vertical con nodos numerados.
function SequentialCard({ derejKey, items }) {
  const info = DEREJ[derejKey];
  const foot = SEQUENCE_FOOTNOTES[derejKey];
  return (
    <section id={`xplev-${derejKey}`} className="xc" style={{ '--dc': info.color }}>
      <CardHead info={info} tag={`${info.pasoTotal} estaciones`} />
      <ol className="xplev-timeline">
        {items.map((item) => {
          const pending = item.estado === 'proximamente';
          return (
            <li key={item.id} className={pending ? 'is-pending' : ''}>
              <span className="node" aria-hidden="true">{item.paso}</span>
              <Link to={`/proyectos/${item.id}`}>
                <span className="row">
                  <span className="ttl"><TipoTag tipo={item.tipo} category={item.category} /><b>{item.title}</b></span>
                  <StatusPill estado={item.estado} />
                </span>
                <span className="meta">
                  <SeasonDot season={item.season} />{SEASONS[item.season]?.name}
                  {item.conceptoCentral && <> · {item.conceptoCentral}</>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <CardFoot note={`${foot.note} · ${foot.route}`} label="Solicitar" />
    </section>
  );
}

// Oz: progresión sugerida, no obligatoria; cuadrícula de hitos.
function OzCard({ items }) {
  const info = DEREJ.oz;
  return (
    <section id="xplev-oz" className="xc xc--wide" style={{ '--dc': info.color }}>
      <CardHead info={info} tag={`${items.length} experiencias`} />
      <p className="xc-desc">
        Desde el llamado inicial y la confrontación de ideales, pasando por la maduración del
        discipulado, hasta el fuego vivo de Pentecostés. Orden sugerido, no obligatorio.
      </p>
      <div className="xplev-hitos">
        {items.map((item) => (
          <Link key={item.id} to={`/proyectos/${item.id}`} className={`hito${item.estado === 'proximamente' ? ' is-pending' : ''}`}>
            <span className="top">
              <span className="d num">{String(item.paso).padStart(2, '0')}</span>
              <StatusPill estado={item.estado} />
            </span>
            <span className="ttl"><TipoTag tipo={item.tipo} category={item.category} /><b>{item.title}</b></span>
            {item.conceptoCentral && <span className="desc">{item.conceptoCentral}</span>}
            <span className="kind"><SeasonDot season={item.season} />{TIPO_LABELS[item.tipo] || 'Estación'}</span>
          </Link>
        ))}
      </div>
      <CardFoot note="Cada parroquia puede implementar las estaciones de forma modular según su ciclo pastoral anual." label="Solicitar guía de pastoral juvenil" />
    </section>
  );
}

function SimjaCard({ items }) {
  const info = DEREJ.simja;
  return (
    <section id="xplev-simja" className="xc xc--wide" style={{ '--dc': info.color }}>
      <CardHead info={info} tag="En preparación" />
      <p className="xc-desc">Formato de estaciones rotativas (no taller/retiro tradicional), organizado por corte de edad.</p>
      {groupByCorte(items).map((g) => (
        <div className="xplev-group" key={g.corte}>
          <div className="xplev-group__label">{g.name} <span>({g.rango})</span></div>
          <ChipList items={g.items} />
        </div>
      ))}
      <CardFoot note="Estaciones adaptadas a la etapa de maduración de cada corte" />
    </section>
  );
}

// Mesharét / Jaím: catálogos abiertos, sin orden, agrupados por tipo.
function OpenCard({ derejKey, items }) {
  const info = DEREJ[derejKey];
  return (
    <section id={`xplev-${derejKey}`} className="xc" style={{ '--dc': info.color }}>
      <CardHead info={info} tag="Catálogo abierto" />
      <p className="xc-desc">{OPEN_DESCRIPTIONS[derejKey]}</p>
      {groupByTipo(items).map((g) => (
        <div className="xplev-group" key={g.tipo ?? 'otros'}>
          <div className="xplev-group__label">{g.tipo && <TipoTag tipo={g.tipo} />}{g.label}</div>
          <ChipList items={g.items} />
        </div>
      ))}
      <CardFoot note="Personalizable a la medida de tu comunidad" />
    </section>
  );
}

const CARDS = {
  guibor: (items) => <SequentialCard key="guibor" derejKey="guibor" items={items} />,
  kavod: (items) => <SequentialCard key="kavod" derejKey="kavod" items={items} />,
  oz: (items) => <OzCard key="oz" items={items} />,
  simja: (items) => <SimjaCard key="simja" items={items} />,
  mesharet: (items) => <OpenCard key="mesharet" derejKey="mesharet" items={items} />,
  jaim: (items) => <OpenCard key="jaim" derejKey="jaim" items={items} />,
};

export default function XpLev() {
  const [params, setParams] = useSearchParams();
  // Estado en la URL (?camino=oz&solo=1&tiempo=adviento) para compartir un catálogo.
  const camino = CAMINOS.includes(params.get('camino')) ? params.get('camino') : 'all';
  const solo = params.get('solo') === '1';
  const tiempoParam = params.get('tiempo');
  const tiempo = Object.hasOwn(SEASONS, tiempoParam) ? tiempoParam : null;

  const set = (changes) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });

  const keep = (i) =>
    (!solo || i.estado !== 'proximamente') &&
    (!tiempo || i.season === tiempo || i.seasonSecondary?.includes(tiempo));

  const visibles = Object.keys(CARDS)
    .filter((k) => camino === 'all' || camino === k)
    .map((k) => [k, ITEMS[k].filter(keep)])
    .filter(([, items]) => items.length > 0);

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">XP Lev · Evangelización por públicos</div>
          <h1 className="d">Itinerarios de encuentro con <span className="jesus">Cristo</span></h1>
          <p className="lead">
            Retiros, talleres y adoraciones diseñados para las etapas de vida y vocación de cada
            persona. Cada hito es un paso consciente en el camino de discipulado.
          </p>
        </div>
      </section>

      <div className="xplev-bar">
        <div className="wrap">
          <nav className="xplev-tabs" aria-label="Selector de caminos">
            {CAMINOS.map((k) => (
              <button
                key={k}
                type="button"
                className="xplev-tab"
                style={{ '--dc': DEREJ[k]?.color }}
                aria-pressed={camino === k}
                title={DEREJ[k] ? `${DEREJ[k].name} · ${DEREJ[k].audience}` : undefined}
                onClick={() => set({ camino: k === 'all' ? null : k })}
              >
                {DEREJ[k] && <span className="dot" aria-hidden="true" />}
                {SHORT_NAME[k] || DEREJ[k].name.replace('Dérej ', '')}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <section className="band xplev-main">
        <div className="wrap">
          <div className="xplev-filters">
            <label className="check">
              <input type="checkbox" checked={solo} onChange={(e) => set({ solo: e.target.checked ? '1' : null })} />
              Solo disponibles ahora
            </label>
            <div className="seasons" role="group" aria-label="Tiempo litúrgico">
              <span className="lbl">Tiempo litúrgico</span>
              {Object.entries(SEASONS).map(([key, s]) => (
                <button
                  key={key}
                  type="button"
                  className="season-chip"
                  style={{ '--sc': `var(--season-${key})`, '--sb': `var(--season-${key}-bg)` }}
                  aria-pressed={tiempo === key}
                  onClick={() => set({ tiempo: tiempo === key ? null : key })}
                >
                  <span className="season-dot" aria-hidden="true" />{s.name}
                </button>
              ))}
            </div>
            <p className="formats">
              Formatos: {['retiro', 'taller', 'hora_santa'].map((t) => `${TIPO_ABBR[t]} ${TIPO_LABELS[t]}`).join(' · ')}
            </p>
          </div>

          {visibles.length === 0 ? (
            <div className="xplev-empty" role="status">
              <h2 className="d">Nada con esos filtros</h2>
              <p>Prueba con otro tiempo litúrgico o quita “solo disponibles”.</p>
              <button type="button" className="btn" onClick={() => set({ solo: null, tiempo: null })}>Quitar filtros</button>
            </div>
          ) : (
            <div className={`xplev-grid${camino === 'all' ? '' : ' xplev-grid--one'}`}>
              {visibles.map(([k, items]) => CARDS[k](items))}
            </div>
          )}
        </div>
      </section>

      <section className="band contact">
        <div className="wrap">
          <div className="kicker">Acompañamiento pastoral</div>
          <h2 className="d sec-title">Diseña el itinerario anual de tu comunidad</h2>
          <p className="cta-text">
            Ya sea que busques abrir el camino formativo de hombres (Dérej Guibor), dinamizar a tus
            jóvenes (Dérej Oz) o renovar los ministerios (Dérej Mesharét), adaptamos fechas,
            materiales y predicadores al ritmo de tu diócesis.
          </p>
          <div className="row">
            <Link className="btn" to="/contacto">Agendar reunión de planificación</Link>
            <Link className="btn btn--ghost" to="/contacto">Solicitar dosier de experiencias</Link>
          </div>
        </div>
      </section>
    </>
  );
}
