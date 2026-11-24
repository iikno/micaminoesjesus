import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import { dateRange } from '../lib/dates';
import { Failed, Loading } from './Status';

// Published departures from the API, or the "Próximamente" card when there are none. `list` is a useData state.
export default function PilgrimNext({ list, level = 3 }) {
  const H = `h${level}`;
  const { lang, t, to } = useLang();
  if (list.loading) return <Loading />;
  if (list.error) return <Failed onRetry={list.retry} />;
  const trips = list.data.filter((p) => p.state !== 'cancelada');
  if (!trips.length) {
    return (
      <div className="soon-card">
        <div><H>{t('pg.next.h')}</H><p>{t('pg.next.p')}</p></div>
        <Link className="btn" to={to('/contacto')}>{t('pg.next.contact')}</Link>
      </div>
    );
  }
  return (
    <>
      <H className="list-h">{t('pg.list.h')}</H>
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
  );
}
