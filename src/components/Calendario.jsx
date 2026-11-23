import { CALENDARIO, ESTADO_LABEL } from '../data/calendario';

export default function Calendario({ items = CALENDARIO }) {
  return (
    <ol className="cal">
      {items.map((it) => {
        const nota = [it.nota, ESTADO_LABEL[it.estado]].filter(Boolean).join(' · ');
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
