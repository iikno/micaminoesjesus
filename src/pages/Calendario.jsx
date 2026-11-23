import { Link } from 'react-router-dom';
import Calendario from '../components/Calendario';
import { CALENDARIO } from '../data/calendario';
import { useLang, useMeta } from '../i18n';
import { useApi } from '../lib/api';

export default function CalendarioPage() {
  useMeta('calendario');
  const { lang, t, r, to } = useLang();
  const items = useApi(`/api/public/calendar?lang=${lang}`, lang === 'es' ? CALENDARIO : []);
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">{t('cal.k')}</div>
          <h1 className="d">{r('cal.h')}</h1>
          <p className="lead">{t('cal.lead')}</p>
        </div>
      </section>
      <section className="band next">
        <div className="wrap">
          <Calendario items={items} />
          <Link className="btn btn--ghost" to={to('/contacto')}>{t('cal.ask')}</Link>
        </div>
      </section>
    </>
  );
}
