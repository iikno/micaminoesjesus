import { CALENDARIO } from '../data/calendario';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n';

export default function Calendario({ items = CALENDARIO }) {
  const { t, to } = useLang();
  return (
    <ol className="cal">
      {items.map((it) => {
        const nota = [it.nota, t(`estado.${it.estado}`)].filter(Boolean).join(' · ');
        return (
          <li key={it.id ?? it.titulo} className={it.destacado ? 'hl' : undefined}>
            <span className="when d">{it.cuando}</span>
            <div><b>{it.titulo}</b><em>{nota}</em>{it.to && <Link className="cal-reg" to={to(it.to)}>{t('cal.reg')}</Link>}</div>
          </li>
        );
      })}
    </ol>
  );
}
