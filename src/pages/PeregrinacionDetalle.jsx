import { Link, useParams } from 'react-router-dom';
import { Async } from '../components/Status';
import { useLang, useMeta } from '../i18n';
import { pageTitle } from '../i18n/meta';
import { useData } from '../lib/api';
import { dateRange } from '../lib/dates';

function Detail({ p }) {
  const { lang, t, to } = useLang();
  useMeta(null, { title: pageTitle(`${p.title} · Peregrinos`), desc: (p.summary ?? '').slice(0, 160) });
  const when = dateRange(lang, p.starts_on, p.ends_on);
  const days = Array.isArray(p.itinerary) ? p.itinerary : [];
  return (
    <>
      <section className="page-head">
        <div className="wrap detalle-header">
          <div className="detalle-tag">{t('pgd.k')}</div>
          <h1 className="d">{p.title}</h1>
          <div className="detalle-pills">
            {p.place && <span className="detalle-pill">{p.place}</span>}
            {when && <span className="detalle-pill">{when}</span>}
            <span className="detalle-pill detalle-pill--tipo">{t(`pg.state.${p.state}`)}</span>
          </div>
          {p.summary && <p className="detalle-concepto">{p.summary}</p>}
        </div>
      </section>

      {p.cover && (
        <section className="detalle-sec">
          <div className="wrap detalle-image-wrap">
            <img src={p.cover} alt={p.cover_alt || t('pgd.cover', { title: p.title })} className="detalle-image" width={p.cover_w} height={p.cover_h} />
          </div>
        </section>
      )}

      <section className="detalle-sec">
        <div className="wrap detalle-body">
          <dl className="pg-facts">
            {p.place && <><dt>{t('pgd.where')}</dt><dd>{p.place}</dd></>}
            {when && <><dt>{t('pgd.when')}</dt><dd>{when}</dd></>}
            {p.cost_info && <><dt>{t('pgd.cost')}</dt><dd>{p.cost_info}</dd></>}
            {p.registration_mode === 'none' && <><dt>{t('pgd.state')}</dt><dd>{t('pgd.free')}</dd></>}
          </dl>
          {days.length > 0 && (
            <div className="detalle-modules">
              <h2 className="d sec-title">{t('pgd.itin')}</h2>
              {days.map((d, i) => (
                <div className="detalle-bloque detalle-bloque--card" key={i}>
                  <h3>{d.title || t('pgd.day', { n: i + 1 })}</h3>
                  <p>{d.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="band contact">
        <div className="wrap">
          <h2 className="d sec-title">{t('pgd.cta.h')}</h2>
          <div className="row">
            <Link className="btn" to={to('/contacto')}>{t('det.cta.contact')}</Link>
            <Link className="btn btn--ghost" to={to('/proyectos/peregrinos')}>{t('pgd.back')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function PeregrinacionDetalle() {
  const { slug } = useParams();
  const { lang } = useLang();
  const state = useData(`/api/public/pilgrimages/${encodeURIComponent(slug)}?lang=${lang}`);
  return <Async state={state}>{(p) => <Detail p={p} />}</Async>;
}
