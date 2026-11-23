import { Link, useSearchParams } from 'react-router-dom';
import { Async } from '../components/Status';
import { useLang, useMeta } from '../i18n';
import { TIPO_ABBR, useCatalog } from '../lib/catalog';

const DEREJ_ORDER = ['guibor', 'kavod', 'oz', 'simja', 'mesharet', 'jaim'];

function SeasonDot({ season, c }) {
  if (!season || !c.SEASONS[season]) return null;
  return <span className="season-dot" style={{ '--sc': `var(--season-${season})` }} title={c.SEASONS[season].name} />;
}

function TipoTag({ tipo }) {
  const { t } = useLang();
  const abbr = TIPO_ABBR[tipo];
  if (!t(`tipo.${tipo}`) || !abbr || t(`tipo.${tipo}`) === `tipo.${tipo}`) return null;
  return <sup className="tipo-tag" title={t(`tipo.${tipo}`)}>{abbr}</sup>;
}

function StatusPill({ estado }) {
  const { t } = useLang();
  const pending = estado === 'proximamente';
  return <span className={`xplev-pill${pending ? ' is-pending' : ''}`}>{pending ? t('xp.pending') : t('xp.available')}</span>;
}

// Agrupa por tipo (retiro/taller/hora_santa); lo sin tipo cae en "En preparación".
function groupByTipo(items, t) {
  const order = ['retiro', 'taller', 'hora_santa'];
  const groups = order
    .map((tipo) => ({ tipo, label: t(`tipo.${tipo}`), items: items.filter((i) => i.tipo === tipo) }))
    .filter((g) => g.items.length > 0);
  const rest = items.filter((i) => !order.includes(i.tipo));
  if (rest.length) groups.push({ tipo: null, label: t('xp.prep'), items: rest });
  return groups;
}

// Dérej Simjá se agrupa por corte de edad en lugar de por tipo.
function groupByCorte(items) {
  return ['primaria', 'kinder', 'ambos']
    .map((corte) => ({ corte, items: items.filter((i) => i.corte === corte) }))
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

function CardFoot({ note, label }) {
  const { t, to } = useLang();
  return (
    <footer className="xc-foot">
      <span>{note}</span>
      <Link to={to('/contacto')}>{label ?? t('xp.request')} &rarr;</Link>
    </footer>
  );
}

function ChipList({ items, c }) {
  const { t, to } = useLang();
  return (
    <div className="xplev-chip-list">
      {items.map((item) => (
        <Link key={item.id} to={to(`/proyectos/${item.id}`)} className={`xplev-chip${item.estado === 'proximamente' ? ' is-pending' : ''}`}>
          <SeasonDot season={item.season} c={c} />
          {item.title}
          {item.estado === 'proximamente' && <span className="xplev-chip__pending">{t('xp.pending')}</span>}
        </Link>
      ))}
    </div>
  );
}

// Guibor/Kavod: secuencia de 6 pasos, línea de tiempo vertical con nodos numerados.
function SequentialCard({ derejKey, items, c }) {
  const { t, to } = useLang();
  const info = c.DEREJ[derejKey];
  return (
    <section id={`xplev-${derejKey}`} className="xc" style={{ '--dc': info.color }}>
      <CardHead info={info} tag={t('xp.stations', { n: info.pasoTotal })} />
      <ol className="xplev-timeline">
        {items.map((item) => {
          const pending = item.estado === 'proximamente';
          return (
            <li key={item.id} className={pending ? 'is-pending' : ''}>
              <span className="node" aria-hidden="true">{item.paso}</span>
              <Link to={to(`/proyectos/${item.id}`)}>
                <span className="row">
                  <span className="ttl"><TipoTag tipo={item.tipo} /><b>{item.title}</b></span>
                  <StatusPill estado={item.estado} />
                </span>
                <span className="meta">
                  <SeasonDot season={item.season} c={c} />{c.SEASONS[item.season]?.name}
                  {item.conceptoCentral && <> · {item.conceptoCentral}</>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <CardFoot note={t(`xp.${derejKey}.note`)} label={t('xp.requestShort')} />
    </section>
  );
}

// Oz: progresión sugerida, no obligatoria; cuadrícula de hitos.
function OzCard({ items, c }) {
  const { t, to } = useLang();
  const info = c.DEREJ.oz;
  return (
    <section id="xplev-oz" className="xc xc--wide" style={{ '--dc': info.color }}>
      <CardHead info={info} tag={t('xp.exps', { n: items.length })} />
      <p className="xc-desc">{t('xp.oz.desc')}</p>
      <div className="xplev-hitos">
        {items.map((item) => (
          <Link key={item.id} to={to(`/proyectos/${item.id}`)} className={`hito${item.estado === 'proximamente' ? ' is-pending' : ''}`}>
            <span className="top">
              <span className="d num">{String(item.paso).padStart(2, '0')}</span>
              <StatusPill estado={item.estado} />
            </span>
            <span className="ttl"><TipoTag tipo={item.tipo} /><b>{item.title}</b></span>
            {item.conceptoCentral && <span className="desc">{item.conceptoCentral}</span>}
            <span className="kind"><SeasonDot season={item.season} c={c} />{t(`tipo.${item.tipo}`) === `tipo.${item.tipo}` ? t('xp.station') : t(`tipo.${item.tipo}`)}</span>
          </Link>
        ))}
      </div>
      <CardFoot note={t('xp.oz.note')} label={t('xp.oz.cta')} />
    </section>
  );
}

function SimjaCard({ items, c }) {
  const { t } = useLang();
  const info = c.DEREJ.simja;
  return (
    <section id="xplev-simja" className="xc xc--wide" style={{ '--dc': info.color }}>
      <CardHead info={info} tag={t('xp.prep')} />
      <p className="xc-desc">{t('xp.simja.desc')}</p>
      {groupByCorte(items).map((g) => (
        <div className="xplev-group" key={g.corte}>
          <div className="xplev-group__label">{t(`corte.${g.corte}`)} <span>({t(`corte.${g.corte}.r`)})</span></div>
          <ChipList items={g.items} c={c} />
        </div>
      ))}
      <CardFoot note={t('xp.simja.note')} />
    </section>
  );
}

// Mesharét / Jaím: catálogos abiertos, sin orden, agrupados por tipo.
function OpenCard({ derejKey, items, c }) {
  const { t } = useLang();
  const info = c.DEREJ[derejKey];
  return (
    <section id={`xplev-${derejKey}`} className="xc" style={{ '--dc': info.color }}>
      <CardHead info={info} tag={t('xp.open')} />
      <p className="xc-desc">{t(`xp.${derejKey}.desc`)}</p>
      {groupByTipo(items, t).map((g) => (
        <div className="xplev-group" key={g.tipo ?? 'otros'}>
          <div className="xplev-group__label">{g.tipo && <TipoTag tipo={g.tipo} />}{g.label}</div>
          <ChipList items={g.items} c={c} />
        </div>
      ))}
      <CardFoot note={t('xp.open.note')} />
    </section>
  );
}

const CARDS = {
  guibor: (items, c) => <SequentialCard key="guibor" derejKey="guibor" items={items} c={c} />,
  kavod: (items, c) => <SequentialCard key="kavod" derejKey="kavod" items={items} c={c} />,
  oz: (items, c) => <OzCard key="oz" items={items} c={c} />,
  simja: (items, c) => <SimjaCard key="simja" items={items} c={c} />,
  mesharet: (items, c) => <OpenCard key="mesharet" derejKey="mesharet" items={items} c={c} />,
  jaim: (items, c) => <OpenCard key="jaim" derejKey="jaim" items={items} c={c} />,
};

function Catalog({ c }) {
  const { t, to } = useLang();
  const [params, setParams] = useSearchParams();
  const CAMINOS = ['all', ...DEREJ_ORDER.filter((k) => c.DEREJ[k])];
  // Estado en la URL (?camino=oz&solo=1&tiempo=adviento) para compartir un catálogo.
  const camino = CAMINOS.includes(params.get('camino')) ? params.get('camino') : 'all';
  const solo = params.get('solo') === '1';
  const tiempoParam = params.get('tiempo');
  const tiempo = Object.hasOwn(c.SEASONS, tiempoParam) ? tiempoParam : null;

  const set = (changes) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });

  const keep = (i) =>
    (!solo || i.estado !== 'proximamente') &&
    (!tiempo || i.season === tiempo || i.seasonSecondary?.includes(tiempo));

  const visibles = DEREJ_ORDER
    .filter((k) => c.DEREJ[k] && CARDS[k] && (camino === 'all' || camino === k))
    .map((k) => [k, c.byDerej(k).filter(keep)])
    .filter(([, items]) => items.length > 0);

  return (
    <>
      <div className="xplev-bar">
        <div className="wrap">
          <nav className="xplev-tabs" aria-label={t('xp.tabs')}>
            {CAMINOS.map((k) => (
              <button
                key={k}
                type="button"
                className="xplev-tab"
                style={{ '--dc': c.DEREJ[k]?.color }}
                aria-pressed={camino === k}
                title={c.DEREJ[k] ? `${c.DEREJ[k].name} · ${c.DEREJ[k].audience}` : undefined}
                onClick={() => set({ camino: k === 'all' ? null : k })}
              >
                {c.DEREJ[k] && <span className="dot" aria-hidden="true" />}
                {k === 'all' ? t('xp.all') : c.DEREJ[k].name.replace('Dérej ', '')}
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
              {t('xp.only')}
            </label>
            <div className="seasons" role="group" aria-label={t('xp.seasons')}>
              <span className="lbl">{t('xp.seasons')}</span>
              {Object.entries(c.SEASONS).map(([key, s]) => (
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
              {t('xp.formats')}: {['retiro', 'taller', 'hora_santa'].map((k) => `${TIPO_ABBR[k]} ${t(`tipo.${k}`)}`).join(' · ')}
            </p>
          </div>

          {visibles.length === 0 ? (
            <div className="xplev-empty" role="status">
              <h2 className="d">{t('xp.empty.h')}</h2>
              <p>{t('xp.empty.p')}</p>
              <button type="button" className="btn" onClick={() => set({ solo: null, tiempo: null })}>{t('xp.empty.btn')}</button>
            </div>
          ) : (
            <div className={`xplev-grid${camino === 'all' ? '' : ' xplev-grid--one'}`}>
              {visibles.map(([k, items]) => CARDS[k](items, c))}
            </div>
          )}
        </div>
      </section>

      <section className="band contact">
        <div className="wrap">
          <div className="kicker">{t('xp.cta.k')}</div>
          <h2 className="d sec-title">{t('xp.cta.h')}</h2>
          <p className="cta-text">{t('xp.cta.p')}</p>
          <div className="row">
            <Link className="btn" to={to('/contacto')}>{t('xp.cta.b1')}</Link>
            <Link className="btn btn--ghost" to={to('/contacto')}>{t('xp.cta.b2')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function XpLev() {
  useMeta('xplev');
  const { t, r } = useLang();
  const cat = useCatalog();
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">{t('xp.k')}</div>
          <h1 className="d">{r('xp.h')}</h1>
          <p className="lead">{t('xp.lead')}</p>
        </div>
      </section>
      <Async state={cat}>{(c) => <Catalog c={c} />}</Async>
    </>
  );
}
