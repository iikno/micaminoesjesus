import { Field } from './ui';
import { ICONS } from './body';

// Friendly editor for a retreat's `body`. The fields are exactly what the public detail page renders
// (ProyectoDetalle.jsx) and what server/lib/schemas.js (retreatBody) accepts. The route of steps
// ("Itinerario formativo") is not stored here: it is built from the Dérej, the step and the step theme.

// ---- small building blocks ----
const move = (a, i, d) => { const j = i + d; if (j < 0 || j >= a.length) return a; const c = [...a]; [c[i], c[j]] = [c[j], c[i]]; return c; };

export function Rows({ legend, items, onChange, blank, noun, disabled, empty, children }) {
  const set = (i, patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <fieldset className="p-field body-sec" disabled={disabled}>
      <legend>{legend}</legend>
      {!items.length && <p className="help">{empty}</p>}
      {items.map((x, i) => (
        <div className="body-row" key={i}>
          <div className="body-row-head">
            <strong>{noun} {i + 1}</strong>
            <span className="p-row">
              <button type="button" className="p-btn p-btn-sm" onClick={() => onChange(move(items, i, -1))} disabled={i === 0} aria-label={`Subir ${noun.toLowerCase()} ${i + 1}`}>↑</button>
              <button type="button" className="p-btn p-btn-sm" onClick={() => onChange(move(items, i, 1))} disabled={i === items.length - 1} aria-label={`Bajar ${noun.toLowerCase()} ${i + 1}`}>↓</button>
              <button type="button" className="p-btn p-btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>Quitar {noun.toLowerCase()} {i + 1}</button>
            </span>
          </div>
          {children(x, (patch) => set(i, patch), i)}
        </div>
      ))}
      <button type="button" className="p-btn p-btn-sm" onClick={() => onChange([...items, blank])}>Agregar {noun.toLowerCase()}</button>
    </fieldset>
  );
}

function Lines({ legend, items, onChange, noun, disabled, help }) {
  return (
    <fieldset className="p-field body-lines" disabled={disabled}>
      <legend>{legend}</legend>
      {help && <p className="help">{help}</p>}
      {items.map((x, i) => (
        <div className="body-line" key={i}>
          <Field label={`${noun} ${i + 1}`}>{(p) => <input {...p} value={x} onChange={(e) => onChange(items.map((y, j) => (j === i ? e.target.value : y)))} />}</Field>
          <button type="button" className="p-btn p-btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>Quitar {noun.toLowerCase()} {i + 1}</button>
        </div>
      ))}
      <button type="button" className="p-btn p-btn-sm" onClick={() => onChange([...items, ''])}>Agregar {noun.toLowerCase()}</button>
    </fieldset>
  );
}

export const Text = ({ label, value, onChange, disabled, rows, help }) => (
  <Field label={label} help={help}>
    {(p) => (rows ? <textarea {...p} rows={rows} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} /> : <input {...p} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />)}
  </Field>
);

// `value` is the form state from bodyToForm(); `onChange` receives the next state.
export default function BodyEditor({ value: f, onChange, disabled, error }) {
  const up = (patch) => onChange({ ...f, ...patch });
  return (
    <div className="body-editor span2">
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="help">El itinerario formativo (ruta de pasos) no se escribe aquí: se arma solo con el Dérej, el paso y el tema del paso.</p>

      <Text label="Basado en" value={f.basadoEn} onChange={(v) => up({ basadoEn: v })} disabled={disabled} help="Por ejemplo, el personaje o pasaje bíblico en que se inspira." />
      <Text label="Título de las etiquetas" value={f.chipsLabel} onChange={(v) => up({ chipsLabel: v })} disabled={disabled} help="Encabezado de la lista de etiquetas, por ejemplo “Dirigido a”." />
      <Lines legend="Etiquetas" noun="Etiqueta" items={f.chips} onChange={(chips) => up({ chips })} disabled={disabled} />

      <Rows legend="Módulos (tarjetas de la parte superior)" noun="Módulo" empty="Aún no hay módulos." items={f.bloques} onChange={(bloques) => up({ bloques })} blank={{ title: '', text: '' }} disabled={disabled}>
        {(x, set) => (<>
          <Text label="Título" value={x.title} onChange={(v) => set({ title: v })} />
          <Text label="Texto" value={x.text} onChange={(v) => set({ text: v })} rows={3} />
        </>)}
      </Rows>

      <Rows legend="Pedagogía vivencial: temas" noun="Tema" empty="Aún no hay temas." items={f.temas} onChange={(temas) => up({ temas })} disabled={disabled}
        blank={{ titulo: '', resumen: '', puntos: [], evocacion: '', actividadIntroductoria: '', contenido: '', actividadesAdicionales: '', simbolos: [], reflexion: '' }}>
        {(t, set) => (<>
          <Text label="Título del tema" value={t.titulo} onChange={(v) => set({ titulo: v })} />
          <Text label="Resumen" value={t.resumen} onChange={(v) => set({ resumen: v })} rows={4} help="Si lo llenas, la página muestra el resumen y los puntos; si no, muestra evocación, actividad y contenido." />
          <Lines legend="Puntos" noun="Punto" items={t.puntos} onChange={(puntos) => set({ puntos })} />
          <Text label="Evocación" value={t.evocacion} onChange={(v) => set({ evocacion: v })} rows={2} />
          <Text label="Actividad introductoria" value={t.actividadIntroductoria} onChange={(v) => set({ actividadIntroductoria: v })} rows={2} />
          <Text label="Contenido" value={t.contenido} onChange={(v) => set({ contenido: v })} rows={3} />
          <Text label="Actividades adicionales" value={t.actividadesAdicionales} onChange={(v) => set({ actividadesAdicionales: v })} rows={2} />
          <Lines legend="Símbolos" noun="Símbolo" items={t.simbolos} onChange={(simbolos) => set({ simbolos })} />
          <Text label="Reflexión" value={t.reflexion} onChange={(v) => set({ reflexion: v })} rows={2} />
        </>)}
      </Rows>

      <Rows legend="Ficha técnica" noun="Dato" empty="Sin datos: el sitio no mostrará ficha técnica." items={f.fichaTecnica} onChange={(fichaTecnica) => up({ fichaTecnica })} blank={{ icon: '', label: '', value: '', desc: '' }} disabled={disabled}>
        {(x, set) => (<>
          <Field label="Ícono">{(p) => <select {...p} value={x.icon} onChange={(e) => set({ icon: e.target.value })}>{ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
          <Text label="Etiqueta" value={x.label} onChange={(v) => set({ label: v })} help="Por ejemplo, “Duración sugerida”." />
          <Text label="Valor" value={x.value} onChange={(v) => set({ value: v })} help="Por ejemplo, “2 a 3 días”." />
          <Text label="Descripción" value={x.desc} onChange={(v) => set({ desc: v })} rows={2} />
        </>)}
      </Rows>

      <Rows legend="Cronograma" noun="Bloque" empty="Sin cronograma." items={f.cronograma} onChange={(cronograma) => up({ cronograma })} blank={{ bloque: '', duracionMinutos: '' }} disabled={disabled}>
        {(x, set) => (<>
          <Text label="Bloque" value={x.bloque} onChange={(v) => set({ bloque: v })} />
          <Field label="Duración (minutos)">{(p) => <input {...p} type="number" inputMode="numeric" min="0" max="1440" value={x.duracionMinutos} onChange={(e) => set({ duracionMinutos: e.target.value })} />}</Field>
        </>)}
      </Rows>
    </div>
  );
}
