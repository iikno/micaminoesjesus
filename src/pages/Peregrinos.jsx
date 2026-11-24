import peregrinosLogo from '../assets/logos/peregrinos.png';
import PerPillars from '../components/PerPillars';
import PilgrimNext from '../components/PilgrimNext';
import Polaroid from '../components/Polaroid';
import { useLang, useMeta } from '../i18n';
import { useData } from '../lib/api';
import { imgUrl } from '../lib/img';

export default function Peregrinos() {
  useMeta('peregrinos');
  const { lang, t } = useLang();
  const list = useData(`/api/public/pilgrimages?lang=${lang}`);
  return (
    <>
      <section className="page-head pg-page">
        <div className="wrap head-grid">
          <div>
            <div className="kicker">{t('pg.k')}</div>
            <h1>Peregrinos</h1>
            <p className="lead">{t('pg.big')}</p>
            <p className="lead">{t('pg.p')}</p>
          </div>
          <div className="logo-card"><img src={peregrinosLogo} alt={t('pg.logo.alt')} /></div>
        </div>
      </section>

      <section className="band sec-blush">
        <div className="wrap">
          <PerPillars />
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="kicker">{t('pg.logo.k')}</div>
          <h2 className="h2">{t('pg.logo.h')}</h2>
          <ol className="pil">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{t(`pg.sig.${i}.t`)}</h3>
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
            <div className="kicker">{t('pg.resp.k')}</div>
            <h2 className="h2">Silvia “Silber” Ponce</h2>
            <p className="body-l">{t('pg.resp.bio')}</p>
          </div>
        </div>
      </section>

      <section className="band sec-sand">
        <div className="wrap">
          <div className="kicker">{t('pg.next.k')}</div>
          <PilgrimNext list={list} level={2} />
        </div>
      </section>
    </>
  );
}
