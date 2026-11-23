import { useState } from 'react';
import { ApiError, del, errText, fieldErrors, get, patch, post } from './api';
import { useAuth } from './session';
import { Async, Confirm, Empty, Field, PageHead, useLoad, useToast } from './ui';

const MODE = { keep: 'No traducir', map: 'Traducción fija' };
const blank = { term: '', mode: 'keep', en: '', note: '' };

function TermForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const [v, setV] = useState({ ...blank, ...initial, en: initial?.en ?? '', note: initial?.note ?? '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!v.term.trim()) er.term = 'Escribe el término.';
    if (v.mode === 'map' && !v.en.trim()) er.en = 'Escribe la traducción fija.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const body = { term: v.term.trim(), mode: v.mode, en: v.mode === 'map' ? v.en.trim() : null, note: v.note.trim() || null };
    try {
      if (initial?.id) await patch(`/api/admin/glossary/${initial.id}`, body); else await post('/api/admin/glossary', body);
      toast('Término guardado.');
      onSaved();
    } catch (x) {
      if (x instanceof ApiError && x.code === 'validation') setErrors(fieldErrors(x)); else toast(errText(x), 'error');
    } finally { setBusy(false); }
  };
  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>{initial?.id ? 'Editar término' : 'Nuevo término'}</h2>
      <div className="p-grid">
        <Field label="Término en español" required error={errors.term}>{(p) => <input {...p} maxLength={120} value={v.term} onChange={up('term')} />}</Field>
        <Field label="Qué hacer">{(p) => <select {...p} value={v.mode} onChange={up('mode')}><option value="keep">{MODE.keep}: se deja igual</option><option value="map">{MODE.map}: siempre se traduce así</option></select>}</Field>
        {v.mode === 'map' && <Field label="Traducción al inglés" required error={errors.en}>{(p) => <input {...p} maxLength={160} value={v.en} onChange={up('en')} />}</Field>}
        <Field label="Nota (solo para el equipo)">{(p) => <input {...p} maxLength={255} value={v.note} onChange={up('note')} />}</Field>
      </div>
      <div className="actions">
        <button className="p-btn p-btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        <button type="button" className="p-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

export default function Glossary() {
  const { can } = useAuth();
  const toast = useToast();
  const load = useLoad(() => get('/api/admin/glossary'), []);
  const usage = useLoad(() => get('/api/admin/translate/status'), []);
  const [edit, setEdit] = useState(null); // null = closed, {} = new, row = editing
  const [gone, setGone] = useState(null);
  const canWrite = can('glossary', 'write');
  const remove = async () => {
    try { await del(`/api/admin/glossary/${gone.id}`); toast('Término eliminado.'); setGone(null); load.reload(); } catch (x) { toast(errText(x), 'error'); setGone(null); }
  };
  return (
    <>
      <PageHead title="Glosario de traducción" sub="Reglas que se le dan al traductor automático. Los términos “no traducir” se conservan tal cual; los de “traducción fija” siempre se traducen igual.">
        {canWrite && <button type="button" className="p-btn p-btn-primary" onClick={() => setEdit({})}>Nuevo término</button>}
      </PageHead>
      <Async load={usage} rows={1}>
        {(u) => (
          <p className="help" role="status">
            {u.enabled
              ? `Traducción automática activa (${u.provider}, ${u.model}). Uso de ${u.month}: ${u.used.toLocaleString('es-MX')} de ${u.limit.toLocaleString('es-MX')} caracteres; ${u.input_tokens.toLocaleString('es-MX')} tokens de entrada y ${u.output_tokens.toLocaleString('es-MX')} de salida en ${u.calls} llamadas.`
              : 'La traducción automática no está activada: falta configurar la llave en el servidor. Mientras tanto el inglés se escribe a mano.'}
          </p>
        )}
      </Async>
      {edit && <TermForm key={edit.id ?? 'new'} initial={edit.id ? edit : null} onCancel={() => setEdit(null)} onSaved={() => { setEdit(null); load.reload(); }} />}
      <Async load={load} rows={5}>
        {(rows) => (!rows.length ? <Empty title="El glosario está vacío.">Agrega los términos que no deben traducirse.</Empty> : (
          <div className="table-wrap">
            <table className="tbl stack">
              <caption className="sr-only">Glosario</caption>
              <thead><tr><th scope="col">Término</th><th scope="col">Regla</th><th scope="col">En inglés</th><th scope="col">Nota</th>{canWrite && <th scope="col">Acciones</th>}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Término"><strong>{r.term}</strong></td>
                    <td data-label="Regla">{MODE[r.mode]}</td>
                    <td data-label="En inglés">{r.mode === 'map' ? r.en : '(igual)'}</td>
                    <td data-label="Nota">{r.note ?? ''}</td>
                    {canWrite && <td data-label="Acciones"><span className="p-row">
                      <button type="button" className="p-btn p-btn-sm" onClick={() => setEdit(r)}>Editar<span className="sr-only"> {r.term}</span></button>
                      <button type="button" className="p-btn p-btn-sm" onClick={() => setGone(r)}>Eliminar<span className="sr-only"> {r.term}</span></button>
                    </span></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Async>
      {gone && <Confirm title="Eliminar término" danger confirmLabel="Eliminar" onConfirm={remove} onCancel={() => setGone(null)}><p>Se quitará “{gone.term}” del glosario.</p></Confirm>}
    </>
  );
}
