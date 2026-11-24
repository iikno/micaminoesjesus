import { Link } from 'react-router-dom';
import nosComunidad from '../assets/fotos-web/nosotros-comunidad.webp';
import nosEscalinata from '../assets/fotos-web/nosotros-escalinata.webp';
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
          <h1>{r('nos.h')}</h1>
          <p className="lead">{t('site.tagline')}</p>
        </div>
      </section>

      <section className="band nos">
        <div className="wrap nos-grid">
          <div className="nos-photos">
            <figure className="pol n1"><img src={nosComunidad} alt={t('photo.comunidad')} /></figure>
            <figure className="pol n2"><img src={nosEscalinata} alt={t('photo.escalinata')} /></figure>
          </div>
          <div>
            <p className="body-l">{t('nos.p1')}</p>
            <p className="body-l">{t('nos.p2')}</p>
            <div className="mv">
              <div><h3>{t('home.mision')}</h3><p>{t('site.mision')}</p></div>
              <div><h3>{t('home.vision')}</h3><p>{t('site.vision')}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="band pilares">
        <div className="wrap">
          <div className="kicker">{t('nos.pil.k')}</div>
          <h2 className="h2">{t('nos.pil.h')}</h2>
          <ol className="pil">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{t(`pilar.${i}`)}</h3>
                <p>{t(`pilar.${i}.t`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band team">
        <div className="wrap">
          <div className="kicker red">{t('nos.team.k')}</div>
          <h2 className="h2">{t('nos.team.h')}</h2>
          <Async state={team}>
            {(rows) => (
              <ul className="staff">
                {rows.map((m) => (
                  <li key={m.id}>
                    <figure className="p"><div className="ph">{m.photo && <img src={imgUrl(m.photo)} alt={m.photo_alt || m.name} loading="lazy" />}</div></figure>
                    <div>
                      <h3>{m.name}</h3>
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
