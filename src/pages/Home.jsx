import { Link } from 'react-router-dom';
import isotipo from '../assets/logos/isotipo.png';
import xpLogo from '../assets/images/xp-lev.png';
import peregrinosLogo from '../assets/logos/peregrinos.png';
import heroVelas from '../assets/fotos-web/hero-velas.webp';
import heroPatio from '../assets/fotos-web/hero-patio.webp';
import heroSantisimo from '../assets/images/hero.webp';
import tiraAdoracion from '../assets/fotos-web/tira-adoracion.webp';
import tiraMesa from '../assets/fotos-web/tira-mesa.webp';
import tiraCruz from '../assets/fotos-web/tira-cruz.webp';
import tiraPredicador from '../assets/fotos-web/tira-predicador.webp';
import nosComunidad from '../assets/fotos-web/nosotros-comunidad.webp';
import nosEscalinata from '../assets/fotos-web/nosotros-escalinata.webp';
import { PROYECTOS } from '../data/proyectos';
import { CALENDARIO } from '../data/calendario';
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from '../data/site';
import Calendario from '../components/Calendario';
import Marquee from '../components/Marquee';
import PerPillars from '../components/PerPillars';
import PilgrimNext from '../components/PilgrimNext';
import Polaroid from '../components/Polaroid';
import ProjectPanels from '../components/ProjectPanels';
import { Failed, Loading } from '../components/Status';
import Verso from '../components/Verso';
import { useLang, useMeta } from '../i18n';
import { useApi, useData } from '../lib/api';
import { useCatalog } from '../lib/catalog';
import { imgUrl } from '../lib/img';

const OTROS = PROYECTOS.filter((p) => p.externo);

const Photo = ({ src, alt, className, eager }) => (
  <figure className={`pol ${className}`}><img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} /></figure>
);

export default function Home() {
  useMeta('home');
  const { lang, t, r, to } = useLang();
  const cat = useCatalog();
  const team = useData(`/api/public/team?lang=${lang}`);
  const trips = useData(`/api/public/pilgrimages?lang=${lang}`);
  const calendar = useApi(`/api/public/calendar?lang=${lang}`, lang === 'es' ? CALENDARIO : []);
  const c = cat.data;
  const derejNames = c ? Object.values(c.DEREJ).map((d) => d.name) : [];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="pill-k">{t('home.kicker')}</div>
            <h1>{t('home.h1a')}<br /><mark>{t('home.h1b')}</mark></h1>
            <p className="tag">{t('site.tagline')}</p>
            <p className="lead">{t('home.lead')}</p>
            <p className="verse-pill">{t('home.verse')}</p>
            <div className="cta">
              <a className="btn" href="#proyectos">{t('home.cta1')}</a>
              <a className="link-arrow" href="#nosotros">{t('home.cta2')} <span aria-hidden="true">&rarr;</span></a>
            </div>
          </div>
          <div className="collage">
            <span className="sun" aria-hidden="true" />
            <Photo className="a" src={heroSantisimo} alt={t('photo.santisimo')} eager />
            <Photo className="b" src={heroVelas} alt={t('photo.velas')} />
            <Photo className="c" src={heroPatio} alt={t('photo.patio')} />
            <img className="mark-chip" src={isotipo} alt="" />
          </div>
        </div>
      </section>

      <section className="band values">
        <div className="wrap">
          <ol className="val-cards">
            {[0, 1, 2].map((i) => (
              <li key={i} className={`v${i}`}>
                <span className="num">{`0${i + 1}`}</span>
                <h2>{t(`home.val.${i}.h`)}</h2>
                <p>{t(`home.val.${i}.p`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="strip" aria-label={t('home.nos.k')}>
        <div className="wrap strip-grid">
          <Photo className="s1" src={tiraAdoracion} alt={t('photo.adoracion')} />
          <Photo className="s2" src={tiraMesa} alt={t('photo.mesa')} />
          <Photo className="s3" src={tiraCruz} alt={t('photo.cruz')} />
          <Photo className="s4" src={tiraPredicador} alt={t('photo.predicador')} />
        </div>
      </section>

      <section className="band" id="proyectos">
        <div className="wrap">
          <div className="kicker">{t('home.proj.k')}</div>
          <h2 className="h2">{t('home.proj.h')}</h2>
          <ProjectPanels items={calendar} />
        </div>
      </section>

      <section className="band sec-peach" id="catalogo">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="kicker">{t('home.xp.k')}</div>
              <h2 className="h2">{t('home.xp.h')}</h2>
              <p className="sub">{t('home.xp.p')}</p>
            </div>
            <aside className="mean-card">
              <img src={xpLogo} alt="" />
              <p>{r('home.xp.mean', (s) => <b>{s}</b>)}</p>
            </aside>
          </div>
          {cat.loading && <Loading />}
          {cat.error && <Failed onRetry={cat.retry} />}
          {c && (
            <>
              <Marquee label={t('home.xp.marquee', { list: derejNames.join(', ') })} items={Object.values(c.DEREJ).map((d) => ({ text: d.name, color: d.color }))} />
              <ul className="derej-cards">
                {Object.entries(c.DEREJ).map(([id, d]) => (
                  <li key={id} style={{ '--dc': d.color }}>
                    <Link className="dcard" to={to(`/proyectos/xp-lev?camino=${id}`)}>
                      <div className="ph">{d.foto && <img src={d.foto} alt="" loading="lazy" />}</div>
                      <h3>{d.name}</h3>
                      <p className="who"><b>{d.who}</b><span>{d.subtitle}</span></p>
                      <p className="more"><b>{d.audience}.</b> {d.more}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="cta-card">
            <div><h3>{t('xp.cta.h')}</h3><p>{t('xp.cta.p')}</p></div>
            <Link className="btn" to={to('/proyectos/xp-lev')}>{t('home.xp.cta')}</Link>
          </div>
        </div>
      </section>

      <section className="band sec-blush" id="peregrinaciones">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="kicker">{t('home.pg.k')}</div>
              <h2 className="h2">{t('home.pg.h')}</h2>
              <p className="sub">{t('home.pg.p')}</p>
            </div>
            <aside className="mean-card">
              <img src={peregrinosLogo} alt="" />
              <p>{t('home.pg.mean')}</p>
            </aside>
          </div>
          <Marquee label={t('home.pg.marquee')} items={[0, 1, 2, 3].map((i) => ({ text: t(`pilar.${i}`), color: ['#C79A2B', '#B5533C', '#8B1E2B', '#14293A'][i] }))} />
          <PerPillars />
          <article className="resp-card">
            <Polaroid foto={imgUrl('silvia.jpg')} nombre="Silvia “Silber” Ponce" rol={t('pg.resp.role')} />
            <div>
              <div className="kicker">{t('pg.resp.k')}</div>
              <h3>Silvia “Silber” Ponce</h3>
              <p className="role">{t('pg.resp.role')}</p>
              <p>{t('pg.resp.bio')}</p>
            </div>
          </article>
          <PilgrimNext list={trips} />
        </div>
      </section>

      <section className="band" id="nosotros">
        <div className="wrap nos-grid">
          <div className="nos-photos">
            <Photo className="n1" src={nosComunidad} alt={t('photo.comunidad')} />
            <Photo className="n2" src={nosEscalinata} alt={t('photo.escalinata')} />
          </div>
          <div>
            <div className="kicker red">{t('home.nos.k')}</div>
            <h2 className="h2">{t('home.nos.h')}</h2>
            <p className="body-l">{t('home.nos.p')}</p>
            <ul className="chips">{[0, 1, 2, 3].map((i) => <li key={i}>{t(`pilar.${i}`)}</li>)}</ul>
            <div className="mv">
              <div><h3>{t('home.mision')}</h3><p>{t('site.mision')}</p></div>
              <div><h3>{t('home.vision')}</h3><p>{t('site.vision')}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="band sec-peach">
        <div className="wrap">
          <div className="kicker">{t('home.team.k')}</div>
          <h2 className="h2">{t('home.team.h')}</h2>
          {team.loading && <Loading />}
          {team.error && <Failed onRetry={team.retry} />}
          {team.data && (
            <div className="crew">
              {team.data.map((m) => <Polaroid key={m.id} foto={imgUrl(m.photo)} nombre={m.name} rol={m.role_title} alt={m.photo_alt} />)}
            </div>
          )}
        </div>
      </section>

      <section className="band sec-sand" id="calendario">
        <div className="wrap">
          <div className="kicker">{t('home.cal.k')}</div>
          <h2 className="h2">{t('home.cal.h')}</h2>
          <Calendario items={calendar} />
          <Link className="btn btn--ghost" to={to('/calendario')}>{t('home.cal.cta')}</Link>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="kicker">{t('otros.k')}</div>
          <h2 className="h2">{t('otros.h')}</h2>
          <ul className="otros-rows">
            {OTROS.map((p) => (
              <li key={p.id}>
                <a href={p.links[0].href} target="_blank" rel="noreferrer">
                  <h3>{p.nombre}</h3><span>{t(`proy.${p.id}.tag`)}</span><i aria-hidden="true">&rarr;</i>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Verso />

      <section className="band sec-peach" id="contacto">
        <div className="wrap contact-row">
          <div>
            <div className="kicker">{t('home.contact.k')}</div>
            <h2 className="h2">{t('home.contact.h')}</h2>
          </div>
          <div className="contact-act">
            <span className="num">{WHATSAPP_DISPLAY}</span>
            <a className="btn" href={WHATSAPP_URL} target="_blank" rel="noreferrer">{t('home.contact.wa')}</a>
          </div>
        </div>
      </section>
    </>
  );
}
