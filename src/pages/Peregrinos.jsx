import { Link } from 'react-router-dom';
import peregrinosLogo from '../assets/logos/peregrinos.png';
import { WHATSAPP_URL } from '../data/site';
import Polaroid from '../components/Polaroid';
import { Failed, Loading } from '../components/Status';
import { useLang, useMeta } from '../i18n';
import { useData } from '../lib/api';
import { dateRange } from '../lib/dates';
import { imgUrl } from '../lib/img';

export default function Peregrinos() {
  useMeta('peregrinos');
  const { lang, t, to } = useLang();
  const list = useData(`/api/public/pilgrimages?lang=${lang}`);
  const trips = (list.data ?? []).filter((p) => p.state !== 'cancelada');
  return (
    <>
      <section className="band pg-sec pg-page">
        <div className="wrap grid">
          <div>
            <div className="kicker red">{t('pg.k')}</div>
            <h1 className="d">Peregrinos</h1>
            <p className="big">{t('pg.big')}</p>
            <p>{t('pg.p')}</p>
          </div>
          <div className="shot"><img src={peregrinosLogo} alt={t('pg.logo.alt')} /></div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="kicker red">{t('pg.logo.k')}</div>
          <h2 className="d sec-title">{t('pg.logo.h')}</h2>
          <ol className="pil">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>
                <span className="d n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="d">{t(`pg.sig.${i}.t`)}</h3>
                <p>{t(`pg.sig.${i}.d`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band team">
        <div className="wrap resp-grid">
          <Polaroid foto={imgUrl('silvia.jpg')} nombre="Silvia “Silber” Ponce" rol={t('pg.resp.role')} />
          <div>
            <div className="kicker red">{t('pg.resp.k')}</div>
            <h2 className="d sec-title">Silvia “Silber” Ponce</h2>
            <p>{t('pg.resp.bio')}</p>
          </div>
        </div>
      </section>

      <section className="band next">
        <div className="wrap">
          <div className="kicker">{t('pg.next.k')}</div>
          {list.loading && <Loading />}
          {list.error && <Failed onRetry={list.retry} />}
          {list.data && trips.length > 0 && (
            <>
              <h2 className="d sec-title">{t('pg.list.h')}</h2>
              <ul className="pg-list">
                {trips.map((p) => (
                  <li key={p.id}>
                    <Link to={to(`/proyectos/peregrinos/${p.slug}`)}>
                      <b>{p.title}</b>
                      <span>{[p.place, dateRange(lang, p.starts_on, p.ends_on)].filter(Boolean).join(' · ')}</span>
                      <em>{t(`pg.state.${p.state}`)}</em>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {list.data && trips.length === 0 && (
            <>
              <h2 className="d sec-title">{t('pg.next.h')}</h2>
              <p className="lead-block">{t('pg.next.p')}</p>
              <a className="btn" href={WHATSAPP_URL} target="_blank" rel="noreferrer">{t('pg.next.wa')}</a>
            </>
          )}
        </div>
      </section>
    </>
  );
}
