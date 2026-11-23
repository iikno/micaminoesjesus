import { useState } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/images/hero.webp';
import nosotrosImage from '../assets/images/nosotros.webp';
import ozEmaus from '../assets/images/OZ-EMAUS.jpg';
import simjaBuenPastor from '../assets/images/SIMJA-BUENPASTOR.jpg';
import xpLogo from '../assets/images/xp-lev.png';
import peregrinosLogo from '../assets/logos/peregrinos.png';
import { PROYECTOS } from '../data/proyectos';
import { CALENDARIO } from '../data/calendario';
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from '../data/site';
import Calendario from '../components/Calendario';
import Polaroid from '../components/Polaroid';
import { Failed, Loading } from '../components/Status';
import Verso from '../components/Verso';
import { useLang, useMeta } from '../i18n';
import { useApi, useData } from '../lib/api';
import { useCatalog } from '../lib/catalog';
import { imgUrl } from '../lib/img';

function Tile({ id, d, open, onToggle }) {
  const { t, to } = useLang();
  const [titulo, resto] = d.name.split(' ');
  return (
    <div className={`tile${open ? ' open' : ''}`} style={{ '--tc': d.color }}>
      <button type="button" className="tile__btn" aria-expanded={open} aria-controls={`more-${id}`} onClick={onToggle}>
        <span className="bg">{d.foto && <img src={d.foto} alt="" loading="lazy" />}</span>
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
        <Link to={to(`/proyectos/xp-lev?camino=${id}`)}>{t('home.tile.cat')} &rarr;</Link>
      </div>
    </div>
  );
}

export default function Home() {
  useMeta('home');
  const { lang, t, r, to } = useLang();
  const [abierto, setAbierto] = useState(null);
  const cat = useCatalog();
  const team = useData(`/api/public/team?lang=${lang}`);
  const calendar = useApi(`/api/public/calendar?lang=${lang}`, lang === 'es' ? CALENDARIO : []);
  const masProyectos = PROYECTOS.filter((p) => p.externo);
  const c = cat.data;
  const marquee = c ? [...Object.values(c.DEREJ).map((d) => d.name), '+ Peregrinos'] : [];
  const listas = c ? c.retreats.filter((x) => x.estado !== 'proximamente').map((x) => x.title) : [];

  return (
    <>
      <section className="hero">
        <div className="wrap grid">
          <div>
            <div className="kicker rv">{t('home.kicker')}</div>
            <h1 className="d" aria-label={t('home.aria')}>
              <span className="ln"><span>{t('home.l1')}</span></span>
              <span className="ln"><span>{t('home.l2')}</span></span>
              <span className="ln"><span className="jesus">{t('home.l3')}</span></span>
            </h1>
            <p className="tag rv">{t('site.tagline')}</p>
            <p className="lead rv">{t('home.lead')}</p>
            <div className="cta rv">
              <a className="btn" href="#derej">{t('home.cta1')}</a>
              <Link className="btn btn--ghost" to={to('/nosotros')}>{t('home.cta2')}</Link>
            </div>
          </div>
          <div className="collage" aria-hidden="true">
            <div className="pol a"><div className="ph"><img src={ozEmaus} alt="" /></div></div>
            <div className="pol b"><div className="ph"><img src={heroImage} alt="" /></div></div>
            <div className="pol c"><div className="ph"><img src={simjaBuenPastor} alt="" /></div></div>
            <div className="sticker"><div><b>Josué 1:9</b>{t('home.sticker')}</div></div>
          </div>
        </div>
      </section>

      {c && (
        <div className="ticker-wrap">
          <div className="ticker" role="img" aria-label={t('home.ticker', { list: marquee.join(', ') })}>
            <div className="track" aria-hidden="true">
              {[0, 1].map((n) => marquee.map((m) => (
                <span key={`${n}-${m}`} className={`${m.startsWith('+') ? 'pg' : ''}${n ? ' dup' : ''}`}>{m}</span>
              )))}
            </div>
          </div>
        </div>
      )}

      <section className="band routes">
        <div className="wrap">
          <div className="kicker red">{t('home.entry.k')}</div>
          <h2 className="d sec-title">{t('home.entry.h')}</h2>
          <div className="grid">
            <a className="route r1" href="#derej">
              <div><div className="d who">{t('home.r1.who')}</div><p>{t('home.r1.p')}</p></div>
              <span className="go">{t('home.r1.go')} <i>&rarr;</i></span>
            </a>
            <Link className="route r2" to={to('/proyectos/xp-lev')}>
              <div><div className="d who">{t('home.r2.who')}</div><p>{t('home.r2.p')}</p></div>
              <span className="go">{t('home.r2.go')} <i>&rarr;</i></span>
            </Link>
            <Link className="route r3" to={to('/contacto')}>
              <div><div className="d who">{t('home.r3.who')}</div><p>{t('home.r3.p')}</p></div>
              <span className="go">{t('home.r3.go')} <i>&rarr;</i></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="band nos" id="nosotros">
        <div className="wrap grid">
          <div className="pol"><img src={nosotrosImage} alt={t('home.nos.img')} /></div>
          <div>
            <div className="kicker red">{t('home.nos.k')}</div>
            <h2 className="d sec-title">{t('home.nos.h')}</h2>
            <p>{t('home.nos.p')}</p>
            <div className="words">{[0, 1, 2, 3].map((i) => <span key={i}>{t(`pilar.${i}`)}</span>)}</div>
            <div className="mv">
              <div><h3 className="d">{t('home.mision')}</h3><p>{t('site.mision')}</p></div>
              <div><h3 className="d">{t('home.vision')}</h3><p>{t('site.vision')}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="band derej" id="derej">
        <div className="wrap">
          <div className="kicker gold">{t('home.derej.k')}</div>
          <h2 className="d sec-title">{t('home.derej.h')}</h2>
          <p className="sub">{t('home.derej.sub')}</p>
          {cat.loading && <Loading />}
          {cat.error && <Failed onRetry={cat.retry} />}
          {c && (
            <div className="tiles">
              {Object.entries(c.DEREJ).map(([id, d]) => (
                <Tile key={id} id={id} d={d} open={abierto === id} onToggle={() => setAbierto(abierto === id ? null : id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="band pg-sec" id="peregrinos">
        <div className="wrap grid">
          <div>
            <div className="kicker red">{t('home.pg.k')}</div>
            <h2 className="d">Peregrinos</h2>
            <p className="big">{t('home.pg.big')}</p>
            <p>{t('home.pg.p')}</p>
            <Link className="btn" to={to('/proyectos/peregrinos')}>{t('home.pg.cta')}</Link>
          </div>
          <div className="shot"><img src={peregrinosLogo} alt={t('home.pg.logo')} loading="lazy" /></div>
        </div>
      </section>

      <section className="band xp" id="xp">
        <div className="wrap grid">
          <div>
            <div className="kicker gold">{t('home.xp.k')}</div>
            <h2 className="d">XP <em>Lev</em></h2>
            <p>{t('home.xp.p')}</p>
            <p className="mean">{r('home.xp.mean', (s) => <b>{s}</b>)}</p>
            {c && (
              <>
                <div className="nums">
                  <div><span className="d">{c.total}</span>{t('home.xp.n1')}</div>
                  <div><span className="d">{c.ready}</span>{t('home.xp.n2')}</div>
                  <div><span className="d">{c.total - c.ready}</span>{t('home.xp.n3')}</div>
                </div>
                {listas.length > 0 && <p className="ready"><b>{t('home.xp.ready')}</b> {listas.slice(0, 8).join(', ')}{listas.length > 8 ? '…' : '.'}</p>}
              </>
            )}
            <Link className="btn" to={to('/proyectos/xp-lev')}>{t('home.xp.cta')}</Link>
          </div>
          <div className="shot"><img src={xpLogo} alt={t('home.xp.logo')} loading="lazy" /></div>
        </div>
      </section>

      <section className="band proj" id="proyectos">
        <div className="wrap">
          <div className="kicker red">{t('home.proj.k')}</div>
          <h2 className="d sec-title">{t('home.proj.h')}</h2>
          <div className="plist">
            {masProyectos.map((p) => (
              <Link key={p.id} className="prow" to={to(`/proyectos#${p.id}`)}>
                <h3 className="d">{p.nombre}</h3><span className="k">{t(`proy.${p.id}.tag`)}</span><span className="ar" aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="band team">
        <div className="wrap">
          <div className="kicker red">{t('home.team.k')}</div>
          <h2 className="d sec-title">{t('home.team.h')}</h2>
          {team.loading && <Loading />}
          {team.error && <Failed onRetry={team.retry} />}
          {team.data && (
            <div className="crew">
              {team.data.map((m) => <Polaroid key={m.id} foto={imgUrl(m.photo)} nombre={m.name} rol={m.role_title} alt={m.photo_alt} />)}
            </div>
          )}
        </div>
      </section>

      <section className="band next" id="calendario">
        <div className="wrap">
          <div className="kicker">{t('home.cal.k')}</div>
          <h2 className="d sec-title">{t('home.cal.h')}</h2>
          <Calendario items={calendar} />
          <Link className="btn btn--ghost" to={to('/calendario')}>{t('home.cal.cta')}</Link>
        </div>
      </section>

      <Verso />

      <section className="band contact" id="contacto">
        <div className="wrap">
          <div className="kicker">{t('home.contact.k')}</div>
          <h2 className="d">{t('home.contact.h')}</h2>
          <div className="row">
            <span className="num d">{WHATSAPP_DISPLAY}</span>
            <a className="btn" href={WHATSAPP_URL} target="_blank" rel="noreferrer">{t('home.contact.wa')}</a>
          </div>
        </div>
      </section>
    </>
  );
}
