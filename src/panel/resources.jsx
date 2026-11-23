import { Dot, fmtDate } from './ui';

// One entry per reviewable entity, keyed like the server's ENTITIES. `perm` is the key in /api/auth/me perms.
// Field types: text textarea select number date datetime bool multi json itin. Required/length rules mirror schemas.js.
const TIPOS = [['taller', 'Taller'], ['retiro', 'Retiro'], ['hora_santa', 'Hora santa'], ['vivencial', 'Vivencial'], ['experiencial', 'Experiencial'], ['estaciones', 'Estaciones']];
const MODE = [['own', 'Inscripción propia'], ['none', 'Entrada libre (sin inscripción)']];
const PUBLISH = { n: 'publish_at', label: 'Fecha sugerida de publicación', t: 'datetime', help: 'Opcional. Quien revisa puede publicar al aprobar o programar esta fecha.' };

export const RESOURCES = {
  retreats: {
    entity: 'retreats', perm: 'retreats', path: 'retiros', title: 'Retiros', one: 'retiro', label: (r) => r.title,
    text: ['title', 'subtitle', 'summary', 'tema_paso'],
    fields: [
      { n: 'title', label: 'Título', t: 'text', req: true, max: 160 },
      { n: 'slug', label: 'Clave de la dirección', t: 'text', req: true, slug: true, help: 'Minúsculas, números y guiones (2 a 80). Es parte de la dirección pública.' },
      { n: 'derej_slug', label: 'Dérej', t: 'select', req: true, opts: (c) => c.derej.map((d) => [d.slug, d.name]) },
      { n: 'tipo', label: 'Tipo', t: 'select', req: true, opts: () => TIPOS },
      { n: 'season_slug', label: 'Tiempo litúrgico principal', t: 'select', opts: (c) => c.seasons.map((s) => [s.slug, s.name]) },
      { n: 'season_secondary', label: 'Otros tiempos litúrgicos', t: 'multi', opts: (c) => c.seasons.map((s) => [s.slug, s.name]) },
      { n: 'paso', label: 'Paso', t: 'number', min: 1, max: 12, help: 'Solo en caminos secuenciales (1 a 12).' },
      { n: 'tema_paso', label: 'Tema del paso', t: 'text', max: 160 },
      { n: 'codigo', label: 'Código interno', t: 'text', max: 60 },
      { n: 'corte_simja', label: 'Corte Simjá', t: 'select', opts: () => [['kinder', 'Kínder (4 a 6)'], ['primaria', 'Primaria (7 a 12)'], ['ambos', 'Ambos']], help: 'Solo para el Dérej Simjá.' },
      { n: 'estado_catalogo', label: 'Estado en el catálogo', t: 'select', omit: true, opts: () => [['publicado', 'Disponible'], ['proximamente', 'Próximamente']] },
      { n: 'subtitle', label: 'Subtítulo', t: 'text', max: 255, full: true },
      { n: 'summary', label: 'Concepto central', t: 'textarea', full: true, help: 'Texto principal que ve el público en el catálogo.' },
      { n: 'cover', label: 'Imagen de portada', t: 'text', max: 255, help: 'Por ahora, el nombre del archivo. La biblioteca de imágenes llega en la siguiente fase.' },
      { n: 'body', label: 'Contenido del retiro (módulos o temas, ficha técnica, cronograma)', t: 'json', full: true, help: 'Formato JSON. Edítalo con cuidado; si dudas, deja lo que ya está.' },
      PUBLISH,
    ],
    meta: (r, c) => {
      const d = c.derej.find((x) => x.slug === r.derej_slug);
      return <Dot color={d?.color} label={d?.name ?? r.derej_slug} />;
    },
  },
  sessions: {
    entity: 'sessions', perm: 'sessions', path: 'fechas', title: 'Fechas de retiros', one: 'fecha', label: (r) => r.title || `Fecha ${r.starts_on}`,
    text: ['title', 'note', 'place', 'cost_info'],
    fields: [
      { n: 'retreat_id', label: 'Retiro', t: 'select', num: true, opts: (c) => (c.retreats ?? []).map((r) => [r.id, r.title]), help: 'Elige un retiro, o deja vacío y escribe un título para una entrada libre del calendario.' },
      { n: 'title', label: 'Título (si no hay retiro)', t: 'text', max: 160 },
      { n: 'starts_on', label: 'Fecha de inicio', t: 'date', req: true },
      { n: 'ends_on', label: 'Fecha final', t: 'date', after: 'starts_on', help: 'Déjala vacía si es un solo día.' },
      { n: 'date_text', label: 'Fecha en texto', t: 'text', max: 60, help: 'Opcional. Por ejemplo "21 al 27 de marzo". Si existe, se muestra en lugar del rango.' },
      { n: 'place', label: 'Lugar', t: 'text', max: 160 },
      { n: 'registration_mode', label: 'Inscripción', t: 'select', omit: true, opts: () => MODE },
      { n: 'cupo', label: 'Cupo', t: 'number', min: 0, help: 'Vacío = sin límite. No aplica con entrada libre.' },
      { n: 'cal_state', label: 'Estado en el calendario', t: 'select', omit: true, opts: () => [['confirmada', 'Confirmada'], ['por-confirmar', 'Por confirmar'], ['lista', 'Lista']] },
      { n: 'highlight', label: 'Destacar en el calendario', t: 'bool' },
      { n: 'note', label: 'Nota breve pública', t: 'text', max: 255, full: true },
      { n: 'cost_info', label: 'Costo', t: 'textarea', full: true, help: 'Texto libre, por ejemplo "$450 incluye alimentos".' },
      { n: 'notes', label: 'Notas internas', t: 'textarea', full: true, help: 'No se publican.' },
      PUBLISH,
    ],
    needsTitleOrRetreat: true,
    meta: (r, c) => `${r.date_text || (r.ends_on ? `${fmtDate(r.starts_on)} al ${fmtDate(r.ends_on)}` : fmtDate(r.starts_on))}${r.retreat_id ? ` · ${(c.retreats ?? []).find((x) => x.id === r.retreat_id)?.title ?? ''}` : ''}`,
  },
  pilgrimages: {
    entity: 'pilgrimages', perm: 'pilgrimages', path: 'peregrinaciones', title: 'Peregrinaciones', one: 'peregrinación', label: (r) => r.title,
    text: ['title', 'summary', 'place', 'cost_info'],
    fields: [
      { n: 'title', label: 'Título', t: 'text', req: true, max: 160 },
      { n: 'slug', label: 'Clave de la dirección', t: 'text', req: true, slug: true, help: 'Minúsculas, números y guiones (2 a 80).' },
      { n: 'place', label: 'Destino', t: 'text', max: 160 },
      { n: 'starts_on', label: 'Fecha de salida', t: 'date' },
      { n: 'ends_on', label: 'Fecha de regreso', t: 'date', after: 'starts_on' },
      { n: 'cupo', label: 'Cupo', t: 'number', min: 0 },
      { n: 'state', label: 'Estado', t: 'select', omit: true, opts: () => [['abierta', 'Abierta'], ['llena', 'Llena'], ['cerrada', 'Cerrada'], ['cancelada', 'Cancelada']] },
      { n: 'registration_mode', label: 'Inscripción', t: 'select', omit: true, opts: () => MODE },
      { n: 'summary', label: 'Resumen', t: 'textarea', full: true },
      { n: 'itinerary', label: 'Itinerario por días', t: 'itin', full: true },
      { n: 'cost_info', label: 'Costo', t: 'textarea', full: true, help: 'Texto libre, por ejemplo "$18,500 por persona, hospedaje doble".' },
      { n: 'cover', label: 'Imagen de portada', t: 'text', max: 255, help: 'Por ahora, el nombre del archivo.' },
      PUBLISH,
    ],
    meta: (r) => `${r.place ?? 'Sin destino'} · ${fmtDate(r.starts_on)}`,
  },
  team: {
    entity: 'team', perm: 'team', path: 'equipo', title: 'Equipo', one: 'integrante', label: (r) => r.name,
    text: ['name', 'role_title'],
    fields: [
      { n: 'name', label: 'Nombre', t: 'text', req: true, max: 160 },
      { n: 'role_title', label: 'Cargo o rol', t: 'text', req: true, max: 160 },
      { n: 'photo', label: 'Foto', t: 'text', max: 255, help: 'Por ahora, el nombre del archivo.' },
      { n: 'sort', label: 'Orden', t: 'number', min: 0, max: 32000, omit: true, help: 'Número menor aparece primero.' },
      PUBLISH,
    ],
    meta: (r) => `${r.role_title} · orden ${r.sort}`,
  },
  verses: {
    entity: 'verses', perm: 'verses', path: 'versiculos', title: 'Versículos', one: 'versículo', label: (r) => r.ref,
    text: ['text_es', 'text_en'],
    fields: [
      { n: 'ref', label: 'Cita', t: 'text', req: true, max: 80, help: 'Por ejemplo "Juan 3,16". Es la clave con la que el sitio lo busca.' },
      { n: 'text_es', label: 'Texto en español', t: 'textarea', req: true, full: true },
      { n: 'text_en', label: 'Texto en inglés', t: 'textarea', full: true, help: 'Se escribe a mano de la versión indicada; nunca se traduce con máquina.' },
      { n: 'version_en', label: 'Versión en inglés', t: 'text', max: 20, omit: true, help: 'Por defecto RSV-2CE.' },
      { n: 'source_note', label: 'Nota de fuente', t: 'text', max: 255 },
      PUBLISH,
    ],
    meta: (r) => (r.text_es ? `${r.text_es.slice(0, 70)}${r.text_es.length > 70 ? '…' : ''}` : ''),
  },
};
export const BY_PATH = Object.fromEntries(Object.values(RESOURCES).map((r) => [r.path, r]));
