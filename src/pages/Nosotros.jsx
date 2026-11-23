import { Link } from 'react-router-dom';
import nosotrosImage from '../assets/images/nosotros.webp';
import { Async } from '../components/Status';
import Verso from '../components/Verso';
import { useLang, useMeta } from '../i18n';
import { useData } from '../lib/api';
import { imgUrl } from '../lib/img';

export default function Nosotros() {
  useMeta('nosotros');
  const { lang, t, r, to } = useLang();
  const team = useData(`/api/public/team?lang=${lang}`);
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">{t('nos.k')}</div>
          <h1 className="d">{r('nos.h')}</h1>
          <p className="lead">{t('site.tagline')}</p>
        </div>
      </section>

      <section className="band nos">
        <div className="wrap grid">
          <div className="pol"><img src={nosotrosImage} alt={t('nos.img')} /></div>
          <div>
            <p>{t('nos.p1')}</p>
            <p>{t('nos.p2')}</p>
            <div className="mv">
              <div><h2 className="d">{t('home.mision')}</h2><p>{t('site.mision')}</p></div>
              <div><h2 className="d">{t('home.vision')}</h2><p>{t('site.vision')}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="band pilares">
        <div className="wrap">
          <div className="kicker gold">{t('nos.pil.k')}</div>
          <h2 className="d sec-title">{t('nos.pil.h')}</h2>
          <ol className="pil">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>
                <span className="d n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="d">{t(`pilar.${i}`)}</h3>
                <p>{t(`pilar.${i}.t`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band team">
        <div className="wrap">
          <div className="kicker red">{t('nos.team.k')}</div>
          <h2 className="d sec-title">{t('nos.team.h')}</h2>
          <Async state={team}>
            {(rows) => (
              <ul className="staff">
                {rows.map((m) => (
                  <li key={m.id}>
                    <figure className="p"><div className="ph">{m.photo && <img src={imgUrl(m.photo)} alt={m.photo_alt || m.name} loading="lazy" />}</div></figure>
                    <div>
                      <h3 className="d">{m.name}</h3>
                      <p>{m.role_title}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Async>
          <Link className="btn" to={to('/contacto')}>{t('nos.write')}</Link>
        </div>
      </section>

      <Verso />
    </>
  );
}
