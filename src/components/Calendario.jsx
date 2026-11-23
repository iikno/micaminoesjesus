import { CALENDARIO } from '../data/calendario';
import { useLang } from '../i18n';

export default function Calendario({ items = CALENDARIO }) {
  const { t } = useLang();
  return (
    <ol className="cal">
      {items.map((it) => {
        const nota = [it.nota, t(`estado.${it.estado}`)].filter(Boolean).join(' · ');
        return (
          <li key={it.id ?? it.titulo} className={it.destacado ? 'hl' : undefined}>
            <span className="when d">{it.cuando}</span>
            <div><b>{it.titulo}</b><em>{nota}</em></div>
          </li>
        );
      })}
    </ol>
  );
}
