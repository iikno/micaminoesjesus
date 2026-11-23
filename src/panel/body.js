// Pure helpers of the retreat body editor: API shape <-> form state (strings and arrays only).
// Mirrors server/lib/schemas.js (retreatBody).
const str = (v) => (typeof v === 'string' ? v : '');
const list = (v) => (Array.isArray(v) ? v.map(str) : []);
const clean = (s) => { const t = str(s).trim(); return t === '' ? undefined : t; };
const cleanList = (a) => { const r = a.map((x) => x.trim()).filter(Boolean); return r.length ? r : undefined; };
const drop = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

export const ICONS = [['', 'Sin ícono'], ['clock', 'Reloj'], ['people', 'Personas'], ['building', 'Edificio']];

export const bodyToForm = (b) => ({
  basadoEn: str(b?.basadoEn), chipsLabel: str(b?.chipsLabel), chips: list(b?.chips),
  bloques: (b?.bloques ?? []).map((x) => ({ title: str(x.title), text: str(x.text) })),
  temas: (b?.temas ?? []).map((t) => ({
    titulo: str(t.titulo), resumen: str(t.resumen), puntos: list(t.puntos), evocacion: str(t.evocacion), actividadIntroductoria: str(t.actividadIntroductoria),
    contenido: str(t.contenido), actividadesAdicionales: str(t.actividadesAdicionales), simbolos: list(t.simbolos), reflexion: str(t.reflexion),
  })),
  cronograma: (b?.cronograma ?? []).map((x) => ({ bloque: str(x.bloque), duracionMinutos: x.duracionMinutos == null ? '' : String(x.duracionMinutos) })),
  fichaTecnica: (b?.fichaTecnica ?? []).map((x) => ({ icon: str(x.icon), label: str(x.label), value: str(x.value), desc: str(x.desc) })),
});

// Empty rows and empty fields are dropped; no body at all becomes null.
export function formToBody(f) {
  const out = drop({
    basadoEn: clean(f.basadoEn), chipsLabel: clean(f.chipsLabel), chips: cleanList(f.chips),
    bloques: f.bloques.filter((x) => x.title.trim() || x.text.trim()).map((x) => drop({ title: x.title.trim(), text: clean(x.text) })),
    temas: f.temas.filter((t) => t.titulo.trim() || t.resumen.trim() || t.contenido.trim()).map((t) => drop({
      titulo: t.titulo.trim(), resumen: clean(t.resumen), puntos: cleanList(t.puntos), evocacion: clean(t.evocacion), actividadIntroductoria: clean(t.actividadIntroductoria),
      contenido: clean(t.contenido), actividadesAdicionales: clean(t.actividadesAdicionales), simbolos: cleanList(t.simbolos), reflexion: clean(t.reflexion),
    })),
    cronograma: f.cronograma.filter((x) => x.bloque.trim()).map((x) => drop({ bloque: x.bloque.trim(), duracionMinutos: x.duracionMinutos.trim() === '' ? undefined : Number(x.duracionMinutos) })),
    fichaTecnica: f.fichaTecnica.filter((x) => x.label.trim() || x.value.trim()).map((x) => drop({ icon: clean(x.icon), label: x.label.trim(), value: x.value.trim(), desc: clean(x.desc) })),
  });
  for (const k of ['bloques', 'temas', 'cronograma', 'fichaTecnica']) if (!out[k]?.length) delete out[k];
  return Object.keys(out).length ? out : null;
}

// Client-side check mirroring the server rules that an editor can break by leaving a required box empty.
export function bodyErrors(f) {
  const bad = (rows, test, msg) => (rows.some(test) ? msg : null);
  return bad(f.bloques, (x) => (x.title.trim() || x.text.trim()) && !x.title.trim(), 'Cada módulo necesita título.')
    || bad(f.temas, (t) => (t.titulo.trim() || t.resumen.trim() || t.contenido.trim()) && !t.titulo.trim(), 'Cada tema necesita título.')
    || bad(f.fichaTecnica, (x) => (x.label.trim() || x.value.trim()) && !(x.label.trim() && x.value.trim()), 'Cada dato de la ficha técnica necesita etiqueta y valor.')
    || bad(f.cronograma, (x) => x.duracionMinutos.trim() !== '' && (!Number.isInteger(Number(x.duracionMinutos)) || Number(x.duracionMinutos) < 0 || Number(x.duracionMinutos) > 1440), 'La duración va en minutos enteros (0 a 1440).');
}

