import { useEffect, useRef, useState } from 'react';
import { ApiError, del, errText, get, patch, upload } from './api';
import { useAuth } from './session';
import { Async, Confirm, Empty, Field, ICONS, Icon, PageHead, fmtDate, useLoad, useToast } from './ui';
import { imgUrl } from '../lib/img';

const thumbSrc = (m) => `/api/admin/media/${m.id}/raw?thumb=1`;
const MEDIA_REF = /^media:(\d+)$/;
// Photo for a cover/photo value: an uploaded media reference, a bundled legacy file, or null.
export const photoUrl = (v) => { const m = MEDIA_REF.exec(v ?? ''); return m ? `/api/admin/media/${m[1]}/raw?thumb=1` : imgUrl(v); };

// Upload button shared by the library screen and the picker.
function UploadButton({ onDone, disabled }) {
  const toast = useToast();
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    let last = null;
    for (const f of files) {
      try { last = await upload('/api/admin/media', f); } catch (x) { toast(`${f.name}: ${x instanceof ApiError ? errText(x) : 'No se pudo subir.'}`, 'error'); }
    }
    setBusy(false);
    if (last) { toast(files.length > 1 ? 'Imágenes subidas.' : 'Imagen subida.'); onDone(last); }
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} aria-label="Elegir imágenes para subir" onChange={pick} />
      <button type="button" className="p-btn p-btn-primary" disabled={disabled || busy} onClick={() => ref.current.click()}>{busy ? 'Subiendo…' : 'Subir imagen'}</button>
    </>
  );
}

function Grid({ rows, selected, onSelect }) {
  return (
    <ul className="media-grid">
      {rows.map((m) => (
        <li key={m.id}>
          <button type="button" className={`media-card${selected === m.id ? ' is-selected' : ''}`} aria-pressed={selected === m.id} onClick={() => onSelect(m)}>
            <img src={thumbSrc(m)} alt={m.alt_es || `Imagen ${m.id}`} loading="lazy" width={m.width} height={m.height} />
            <span className="media-meta">
              {m.caption_retreat || m.alt_es || `Imagen ${m.id}`}
              {m.has_minors && <b className="media-flag">Con menores</b>}
              {m.used && <b className="media-flag media-flag-ok">En uso</b>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------ picker used by cover / photo fields
export function MediaPicker({ value, onChange, disabled, label, help, error }) {
  const [open, setOpen] = useState(false);
  const m = MEDIA_REF.exec(value ?? '');
  const legacy = !m && value ? imgUrl(value) : null;
  return (
    <fieldset className="p-field media-field" disabled={disabled}>
      <legend>{label}</legend>
      <div className="media-current">
        {m && <img src={`/api/admin/media/${m[1]}/raw?thumb=1`} alt="" width="120" />}
        {legacy && <img src={legacy} alt="" width="120" />}
        {!value && <span className="help">Sin imagen.</span>}
        {legacy && <span className="help">Imagen original del sitio ({value}). Elige una de la biblioteca para reemplazarla.</span>}
        {value && !m && !legacy && <span className="help">Archivo heredado “{value}” (sin vista previa).</span>}
      </div>
      <div className="p-row">
        <button type="button" className="p-btn p-btn-sm" onClick={() => setOpen(true)}>{value ? 'Cambiar imagen' : 'Elegir imagen'}</button>
        {value && <button type="button" className="p-btn p-btn-sm" onClick={() => onChange('')}>Quitar</button>}
      </div>
      {help && <p className="help">{help}</p>}
      {error && <p className="p-err">{error}</p>}
      {open && <PickerDialog onClose={() => setOpen(false)} onPick={(row) => { onChange(`media:${row.id}`); setOpen(false); }} />}
    </fieldset>
  );
}

function PickerDialog({ onClose, onPick }) {
  const { can } = useAuth();
  const ref = useRef();
  const load = useLoad(() => get('/api/admin/media'), []);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="dialog dialog-wide" onClose={onClose} aria-labelledby="pick-t">
      <h2 id="pick-t">Elegir imagen</h2>
      <div className="p-row">
        {can('media', 'write') && <UploadButton onDone={(row) => onPick(row)} />}
        <span className="help">Las fotos con menores no se publican hasta que exista una política de consentimiento.</span>
      </div>
      <Async load={load} rows={3}>
        {(rows) => (rows.length ? <Grid rows={rows} onSelect={onPick} /> : <Empty title="La biblioteca está vacía.">Sube la primera imagen.</Empty>)}
      </Async>
      <div className="p-row end"><button type="button" className="p-btn" onClick={onClose}>Cancelar</button></div>
    </dialog>
  );
}

// ------------------------------------------------------------ library screen
function Editor({ m, canWrite, reload, onDeleted }) {
  const toast = useToast();
  const [v, setV] = useState({ alt_es: m.alt_es ?? '', alt_en: m.alt_en ?? '', caption_retreat: m.caption_retreat ?? '', caption_place: m.caption_place ?? '', caption_date: m.caption_date?.slice(0, 10) ?? '', has_minors: !!m.has_minors });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const up = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await patch(`/api/admin/media/${m.id}`, { alt_es: v.alt_es.trim() || null, alt_en: v.alt_en.trim() || null, caption_retreat: v.caption_retreat.trim() || null, caption_place: v.caption_place.trim() || null, caption_date: v.caption_date || null, has_minors: v.has_minors });
      toast('Imagen guardada.');
      reload();
    } catch (x) { toast(errText(x), 'error'); } finally { setBusy(false); }
  };
  const remove = async () => {
    try { await del(`/api/admin/media/${m.id}`); toast('Imagen eliminada.'); onDeleted(); } catch (x) { toast(errText(x), 'error'); setConfirm(false); }
  };
  return (
    <form className="card" onSubmit={save} noValidate>
      <h2>Imagen {m.id}</h2>
      <img className="media-big" src={`/api/admin/media/${m.id}/raw`} alt={m.alt_es || ''} width={m.width} height={m.height} />
      <p className="help">{m.width} × {m.height} px · {Math.round(m.bytes / 1024)} KB · subida el {fmtDate(m.created_at)}</p>
      <Field label="Texto alternativo (español)" help="Describe la imagen para quien no puede verla.">{(p) => <input {...p} maxLength={255} value={v.alt_es} onChange={up('alt_es')} disabled={!canWrite} />}</Field>
      <Field label="Texto alternativo (inglés)">{(p) => <input {...p} maxLength={255} value={v.alt_en} onChange={up('alt_en')} disabled={!canWrite} />}</Field>
      <Field label="Retiro">{(p) => <input {...p} maxLength={160} value={v.caption_retreat} onChange={up('caption_retreat')} disabled={!canWrite} />}</Field>
      <Field label="Lugar">{(p) => <input {...p} maxLength={160} value={v.caption_place} onChange={up('caption_place')} disabled={!canWrite} />}</Field>
      <Field label="Fecha">{(p) => <input {...p} type="date" value={v.caption_date} onChange={up('caption_date')} disabled={!canWrite} />}</Field>
      <div className="p-field">
        <label className="p-check"><input type="checkbox" checked={v.has_minors} onChange={up('has_minors')} disabled={!canWrite} /> En la foto aparecen menores de edad</label>
        <p className="help">Estas fotos no se muestran en el sitio público hasta que se defina el consentimiento de madres, padres o tutores.</p>
      </div>
      {canWrite && (
        <div className="actions">
          <button className="p-btn p-btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
          <button type="button" className="p-btn p-btn-danger-ghost" disabled={m.used} title={m.used ? 'Está en uso como portada o foto' : undefined} onClick={() => setConfirm(true)}><Icon d={ICONS.trash} />Eliminar</button>
          {m.used && <span className="help">En uso: no se puede eliminar.</span>}
        </div>
      )}
      {confirm && <Confirm title="Eliminar imagen" danger confirmLabel="Eliminar" onConfirm={remove} onCancel={() => setConfirm(false)}><p>Se borrará el archivo de forma permanente.</p></Confirm>}
    </form>
  );
}

export default function MediaPage() {
  const { can } = useAuth();
  const load = useLoad(() => get('/api/admin/media'), []);
  const [sel, setSel] = useState(null);
  const canWrite = can('media', 'write');
  return (
    <>
      <PageHead title="Imágenes" sub="Biblioteca de fotos para portadas y equipo. Se convierten a WebP y se reducen automáticamente.">
        {canWrite && <UploadButton onDone={(row) => { load.reload(); setSel(row.id); }} />}
      </PageHead>
      <Async load={load} rows={4}>
        {(rows) => {
          const cur = rows.find((r) => r.id === sel);
          if (!rows.length) return <Empty title="Aún no hay imágenes.">{canWrite ? 'Sube la primera con “Subir imagen”.' : 'Cuando alguien las suba aparecerán aquí.'}</Empty>;
          return (
            <div className="split">
              <Grid rows={rows} selected={sel} onSelect={(m) => setSel(m.id)} />
              <aside className="side">
                {cur ? <Editor key={`${cur.id}${cur.updated_at}`} m={cur} canWrite={canWrite} reload={load.reload} onDeleted={() => { setSel(null); load.reload(); }} /> : <p className="help">Elige una imagen para editar sus textos.</p>}
              </aside>
            </div>
          );
        }}
      </Async>
    </>
  );
}
