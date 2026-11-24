import { CALENDARIO } from '../data/calendario';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n';

// Project badge per row: items from the API carry kind 'peregrinacion'; the rest are XP Lev (retreats, workshops, adorations).
const isPer = (it) => it.kind === 'peregrinacion';

export default function Calendario({ items = CALENDARIO }) {
  const { t, to } = useLang();
  // Only while the API has no pilgrimage at all: an empty row so the project is visible in the calendar.
  const rows = items.some(isPer) ? items : [...items, { id: 'per-soon', kind: 'peregrinacion', cuando: t('cal.per.when'), titulo: t('cal.per.t'), nota: t('pg.next.p') }];
  return (
    <>
      <p className="cal-key"><span>{t('cal.key')}</span><b className="proj-tag xp">XP Lev</b><b className="proj-tag per">Peregrinos</b></p>
      <ol className="cal">
        {rows.map((it) => {
          const nota = [it.nota, it.estado && t(`estado.${it.estado}`)].filter(Boolean).join(' · ');
          return (
            <li key={it.id ?? it.titulo} className={`${isPer(it) ? 'per' : 'xp'}${it.destacado ? ' hl' : ''}`}>
              <span className="when">{it.cuando}</span>
              <div><b>{it.titulo}</b><em>{nota}</em>{it.to && <Link className="cal-reg" to={to(it.to)}>{t('cal.reg')}</Link>}</div>
              <span className={`proj-tag ${isPer(it) ? 'per' : 'xp'}`}>{isPer(it) ? 'Peregrinos' : 'XP Lev'}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
