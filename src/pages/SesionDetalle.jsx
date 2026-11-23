import { Link, useParams } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';
import { Async } from '../components/Status';
import { useLang, useMeta } from '../i18n';
import { pageTitle } from '../i18n/meta';
import { useData } from '../lib/api';
import { dateRange } from '../lib/dates';

// One calendar date: facts plus the registration form (or "free entry" when there is no registration).
function Detail({ s }) {
  const { lang, t, to } = useLang();
  useMeta(null, { title: pageTitle(s.title), desc: (s.note ?? '').slice(0, 160) });
  const when = s.date_text || dateRange(lang, s.starts_on, s.ends_on);
  return (
    <>
      <section className="page-head">
        <div className="wrap detalle-header">
          <div className="detalle-tag">{t('ses.k')}</div>
          <h1 className="d">{s.title}</h1>
          {s.note && <p className="detalle-concepto">{s.note}</p>}
        </div>
      </section>
      <section className="detalle-sec">
        <div className="wrap detalle-body">
          <dl className="pg-facts">
            {when && <><dt>{t('ses.when')}</dt><dd>{when}</dd></>}
            {s.place && <><dt>{t('ses.where')}</dt><dd>{s.place}</dd></>}
            {s.cost_info && <><dt>{t('ses.cost')}</dt><dd>{s.cost_info}</dd></>}
          </dl>
          {s.registration_mode === 'none' ? <p className="reg-note">{t('ses.free')}</p> : <RegistrationForm kind="session" eventId={s.id} info={s.reg} />}
          <p className="row">
            {s.retreat_slug && <Link className="btn btn--ghost" to={to(`/proyectos/${s.retreat_slug}`)}>{t('ses.retreat')}</Link>}
            <Link className="btn btn--ghost" to={to('/calendario')}>{t('ses.back')}</Link>
          </p>
        </div>
      </section>
    </>
  );
}

export default function SesionDetalle() {
  const { id } = useParams();
  const { lang } = useLang();
  const state = useData(`/api/public/sessions/${encodeURIComponent(id)}?lang=${lang}`);
  return <Async state={state}>{(s) => <Detail s={s} />}</Async>;
}
