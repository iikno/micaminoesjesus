import { useState } from 'react';
import { photoUrl } from './Media';
import { formToBody } from './body';
import { Icon, StatusPill, fmtDate, fmtDateTime, fromLocalInput } from './ui';
import { norm } from './wizardLogic';

const NONE = 'M6 12h12';
const CHECK = 'M5 12l5 5 9-10';

// Radio cards (one choice) or checkbox cards (several): colour + icon + short phrase, and the label in words.
export function ChoiceCards({ f, value, onChange, opts, meta, error, disabled }) {
  const multi = f.t === 'multi';
  const all = !multi && !f.req && !f.omit ? [['', 'Ninguno'], ...opts] : opts; // an omitted-when-empty field cannot be "cleared", so it gets no Ninguno
  return (
    <fieldset className={`p-field cards-field${error ? ' has-error' : ''}`} disabled={disabled}>
      <legend>{f.label}{f.req && <span className="req" aria-hidden="true"> *</span>}</legend>
      {f.help && <p className="help">{f.help}</p>}
      <div className="cards">
        {all.map(([v, l]) => {
          const on = multi ? value.includes(v) : value === String(v);
          const m = (v === '' ? null : meta?.(v)) ?? {};
          return (
            <label key={v} className={`card-opt${on ? ' on' : ''}`} style={m.color ? { '--c': m.color } : undefined}>
              <input type={multi ? 'checkbox' : 'radio'} name={f.n} value={v} checked={on} aria-invalid={error ? true : undefined}
                onChange={(e) => onChange(multi ? (e.target.checked ? [...value, v] : value.filter((x) => x !== v)) : String(v))} />
              <span className="co-box">
                <span className="co-ico"><Icon d={v === '' ? NONE : m.icon ?? NONE} /></span>
                <span className="co-text"><strong>{l}</strong>{m.text && <span>{m.text}</span>}</span>
                <span className="co-check" aria-hidden="true">{on && <Icon d={CHECK} />}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="p-err">{error}</p>}
    </fieldset>
  );
}

// Retreat photo for a card or the preview: uploaded media, bundled legacy file, or a calm placeholder.
export function Thumb({ value, size = 88 }) {
  const src = photoUrl(value);
  return src ? <img className="thumb" src={src} alt="" width={size} height={size} loading="lazy" /> : <span className="thumb thumb-empty" style={{ width: size, height: size }}><Icon d="M4 5h16v14H4zM8 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4 17l5-5 4 4 3-3 4 4" /></span>;
}

// "Qué retiro" for a date: photo cards with a search box. Picking the same card again is not needed; the name field below covers "no retreat".
export function RetreatPick({ f, value, onChange, retreats, derej, error, disabled }) {
  const [q, setQ] = useState('');
  const [more, setMore] = useState(false);
  const rows = [...retreats].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const hits = rows.filter((r) => !q || norm(r.title).includes(norm(q)));
  const shown = more || q ? hits : hits.filter((r, i) => i < 8 || String(r.id) === value);
  return (
    <fieldset className={`p-field cards-field${error ? ' has-error' : ''}`} disabled={disabled}>
      <legend>{f.label}</legend>
      <p className="help">Elige el retiro de esta fecha. Si no está en la lista, escribe el nombre más abajo.</p>
      {rows.length > 8 && (
        <div className="p-field">
          <label htmlFor="rp-q">Buscar un retiro</label>
          <input id="rp-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escribe parte del nombre" />
        </div>
      )}
      {!rows.length && <p className="help">Aún no hay retiros para elegir.</p>}
      {q && !hits.length && <p className="help" role="status">Ningún retiro se llama así. Prueba con otra palabra.</p>}
      <div className="rp-list">
        {shown.map((r) => {
          const d = derej.find((x) => x.slug === r.derej_slug);
          const on = value === String(r.id);
          return (
            <label key={r.id} className={`card-opt rp-card${on ? ' on' : ''}`} style={d?.color ? { '--c': d.color } : undefined}>
              <input type="radio" name={f.n} value={r.id} checked={on} aria-invalid={error ? true : undefined} onChange={() => onChange(String(r.id))} />
              <span className="co-box">
                <Thumb value={r.cover} />
                <span className="co-text"><strong>{r.title}</strong><span>{d?.name ?? r.derej_slug}</span>{r.status !== 'publicado' && <StatusPill status={r.status} />}</span>
                <span className="co-check" aria-hidden="true">{on && <Icon d={CHECK} />}</span>
              </span>
            </label>
          );
        })}
      </div>
      {!more && !q && hits.length > shown.length && <button type="button" className="p-btn p-btn-sm" onClick={() => setMore(true)}>Ver los {hits.length - shown.length} retiros restantes</button>}
      {value && <button type="button" className="p-btn p-btn-sm" onClick={() => onChange('')} disabled={disabled}>Quitar el retiro elegido</button>}
      {error && <p className="p-err">{error}</p>}
    </fieldset>
  );
}

// "Paso 2 de 5" as numbered buttons. While creating you can go back; when editing, jump to any step.
export function StepBar({ steps, step, max, free, go }) {
  return (
    <nav aria-label="Pasos">
      <ol className="wiz-steps">
        {steps.map((s, i) => (
          <li key={s.title}>
            <button type="button" className={i === step ? 'on' : i < max ? 'done' : ''} aria-current={i === step ? 'step' : undefined} disabled={!free && i > max} onClick={() => go(i)}>
              <span className="ws-n" aria-hidden="true">{i < step && i < max ? <Icon d={CHECK} /> : i + 1}</span>
              <span className="ws-t"><span className="sr-only">Paso {i + 1}: </span>{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---- preview: what was written, in words, with a way back to each step ----
const COUNTS = [['bloques', 'módulos'], ['temas', 'temas'], ['chips', 'etiquetas'], ['fichaTecnica', 'datos de la ficha'], ['cronograma', 'bloques de cronograma']];
const isEmpty = (f, v) => (f.t === 'body' ? !formToBody(v) : v == null || v === '' || v === false || (Array.isArray(v) && !v.length));

function show(f, v, ctx) {
  const label = (x) => f.opts?.(ctx).find(([k]) => String(k) === String(x))?.[1] ?? x;
  switch (f.t) {
    case 'media': return <Thumb value={v} size={96} />;
    case 'multi': return v.map(label).join(', ');
    case 'select': return label(v);
    case 'bool': return 'Sí';
    case 'date': return fmtDate(v);
    case 'datetime': return fmtDateTime(fromLocalInput(v));
    case 'itin': return `${v.length} ${v.length === 1 ? 'día' : 'días'}`;
    case 'body': { const b = formToBody(v); return COUNTS.filter(([k]) => b[k]?.length).map(([k, n]) => `${b[k].length} ${n}`).join(', ') || 'Con texto'; }
    default: return String(v);
  }
}

export function Summary({ steps, st, ctx, go }) {
  return (
    <div className="summary">
      {steps.filter((s) => !s.preview).map((s, i) => (
        <section key={s.title} className="sum-sec">
          <h3>{s.title}<button type="button" className="p-btn p-btn-sm" onClick={() => go(i)}>Cambiar<span className="sr-only"> {s.title.toLowerCase()}</span></button></h3>
          <dl className="facts">
            {s.fields.filter((f) => !isEmpty(f, st[f.n])).map((f) => <div key={f.n} className="sum-row"><dt>{f.label}</dt><dd>{show(f, st[f.n], ctx)}</dd></div>)}
            {s.fields.every((f) => isEmpty(f, st[f.n])) && <div className="sum-row"><dd className="help">Sin llenar.</dd></div>}
          </dl>
        </section>
      ))}
    </div>
  );
}
