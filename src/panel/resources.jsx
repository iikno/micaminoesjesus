import { Dot, fmtDate } from './ui';

// One entry per reviewable entity, keyed like the server's ENTITIES. `perm` is the key in /api/auth/me perms.
// Field types: text textarea select number date datetime bool multi json itin. Required/length rules mirror schemas.js.
const TIPOS = [['taller', 'Taller'], ['retiro', 'Retiro'], ['hora_santa', 'Hora santa'], ['vivencial', 'Vivencial'], ['experiencial', 'Experiencial'], ['estaciones', 'Estaciones']];
const MODE = [['own', 'Con inscripción en el sitio'], ['none', 'Entrada libre, sin inscripción']];

// Icons (24x24 strokes) and one short plain phrase for each choice card. Values and labels stay exactly the server's.
const D = {
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4', tent: 'M3 20l9-15 9 15zM9 20l3-5 3 5', host: 'M12 10m-3 0a3 3 0 106 0 3 3 0 10-6 0M12 3v3M12 14v3M5 10h3M16 10h3M8 21h8M12 17v4',
  candle: 'M12 3c1 2 2 3 2 4a2 2 0 01-4 0c0-1 1-2 2-4zM9 11h6v10H9z', compass: 'M12 21a9 9 0 100-18 9 9 0 000 18zM15 9l-2 5-4 1 2-5z', route: 'M5 6m-2 0a2 2 0 104 0 2 2 0 10-4 0M19 18m-2 0a2 2 0 104 0 2 2 0 10-4 0M7 6h6a3 3 0 010 6h-2a3 3 0 000 6h6',
  shield: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z', heart: 'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z', basin: 'M3 12h18c0 5-4 8-9 8s-9-3-9-8zM8 8c0-2 2-2 2-4M14 8c0-2 2-2 2-4',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2', flame: 'M12 3c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z',
  leaf: 'M12 21V10M12 10c0-4 3-6 7-6 0 4-2 7-7 6M12 14c0-3-2-5-6-5 0 3 2 5 6 5', star: 'M12 3l2.3 5.2 5.7.5-4.3 3.8 1.3 5.5L12 15l-5 3 1.3-5.5L4 8.7l5.7-.5z', cross: 'M12 3v18M6 9h12', dawn: 'M3 18h18M7 18a5 5 0 0110 0M12 7V4M5.5 10l-2-2M18.5 10l2-2',
  ticket: 'M7 4h10v16H7zM10 9h4M10 13h4', enter: 'M3 12h12M11 7l5 5-5 5M19 4v16', child: 'M12 7m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M8 21v-6a4 4 0 018 0v6', kids: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  group: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 100-5M21 19c0-2-1.5-3.5-4-4', none: 'M6 12h12',
};
const TIPO_CARD = {
  taller: { icon: D.pencil, color: 'var(--color-gold)' },
  retiro: { icon: D.tent, color: 'var(--color-red)' },
  hora_santa: { icon: D.host, color: 'var(--color-ink)' },
  vivencial: { icon: D.candle, color: 'var(--color-clay)' },
  experiencial: { icon: D.compass, color: 'var(--color-gray)' },
  estaciones: { icon: D.route, color: 'var(--season-ordinario)' },
};
const DEREJ_ICON = { guibor: D.shield, kavod: D.heart, mesharet: D.basin, simja: D.sun, oz: D.flame, jaim: D.leaf };
const SEASON_ICON = { ordinario: D.leaf, adviento: D.star, cuaresma: D.cross, pascua: D.dawn, pentecostes: D.flame };
const seasonCard = (v) => ({ icon: SEASON_ICON[v] ?? D.star, color: `var(--season-${v}, var(--color-gray))` });
const CORTE_CARD = { kinder: { icon: D.child }, primaria: { icon: D.kids }, ambos: { icon: D.group } };
const MODE_CARD = { own: { icon: D.ticket, text: 'La gente se apunta en el sitio y tú ves quién viene.' }, none: { icon: D.enter, text: 'Cualquiera puede llegar, sin apuntarse.' } };
// Guibor and Kavod (secuencial) and Oz (catalogo_sugerido, steps 1-10) number their retreats.
const hasPaso = (st, c) => ['secuencial', 'catalogo_sugerido'].includes(c.derej.find((d) => d.slug === st.derej_slug)?.esquema);
const PUBLISH = { n: 'publish_at', label: 'Fecha sugerida de publicación', t: 'datetime', help: 'Opcional. Quien revisa puede publicar al aprobar o programar esta fecha.' };

export const RESOURCES = {
  retreats: {
    entity: 'retreats', perm: 'retreats', path: 'retiros', title: 'Retiros', one: 'retiro', label: (r) => r.title,
    text: ['title', 'subtitle', 'summary', 'tema_paso'],
    tr: ['title', 'subtitle', 'summary', 'tema_paso', 'body'], // fields with an English version; mirrors server/lib/entities.js
    fields: [
      { n: 'title', label: 'Título', t: 'text', req: true, max: 160 },
      { n: 'slug', label: 'Dirección en internet', t: 'text', req: true, slug: true, help: 'Se arma sola con el nombre. Solo cámbiala si hace falta: minúsculas, números y guiones (2 a 80). Es parte de la dirección pública.' },
      { n: 'derej_slug', label: 'Para quién es (Dérej)', t: 'select', req: true, opts: (c) => c.derej.map((d) => [d.slug, d.name]), cards: (v, c) => { const d = c.derej.find((x) => x.slug === v); return { icon: DEREJ_ICON[v] ?? D.group, color: d?.color, text: d?.audience }; } },
      { n: 'tipo', label: '¿Qué es?', t: 'select', req: true, opts: () => TIPOS, cards: (v) => TIPO_CARD[v] },
      { n: 'season_slug', label: 'Tiempo litúrgico principal', t: 'select', opts: (c) => c.seasons.map((s) => [s.slug, s.name]), cards: seasonCard },
      { n: 'season_secondary', label: 'Otros tiempos litúrgicos', t: 'multi', opts: (c) => c.seasons.map((s) => [s.slug, s.name]), cards: seasonCard },
      { n: 'paso', label: 'Número de paso', t: 'number', min: 1, max: 12, help: 'Qué paso del camino es este retiro: de 1 a 6 en Guibor y Kavod, de 1 a 10 en Oz.', when: hasPaso },
      { n: 'tema_paso', label: 'Tema del paso', t: 'text', max: 160, when: hasPaso },
      { n: 'codigo', label: 'Código interno', t: 'text', max: 60 },
      { n: 'corte_simja', label: 'Grupo de edad (Simjá)', t: 'select', opts: () => [['kinder', 'Kínder (4 a 6)'], ['primaria', 'Primaria (7 a 12)'], ['ambos', 'Ambos']], when: (st) => st.derej_slug === 'simja', cards: (v) => CORTE_CARD[v] },
      { n: 'estado_catalogo', label: 'Estado en el catálogo', t: 'select', omit: true, opts: () => [['publicado', 'Disponible'], ['proximamente', 'Próximamente']] },
      { n: 'subtitle', label: 'Subtítulo', t: 'text', max: 255, full: true },
      { n: 'summary', label: 'Concepto central', t: 'textarea', full: true, help: 'Texto principal que ve el público en el catálogo.' },
      { n: 'cover', label: 'Foto de portada', t: 'media', full: true, help: 'Es la foto que aparece en el catálogo. Se elige de la biblioteca de imágenes.' },
      { n: 'body', label: 'Contenido del retiro', t: 'body', full: true },
      PUBLISH,
    ],
    steps: [
      { title: 'Nombre y tipo', ask: 'Ponle nombre y di qué es y para quién.', fields: ['title', 'tipo', 'derej_slug', 'corte_simja', 'paso', 'tema_paso'] },
      { title: 'Foto', ask: 'Elige la foto que verá la gente.', fields: ['cover'] },
      { title: 'De qué trata', ask: 'Cuéntalo en pocas palabras.', fields: ['subtitle', 'summary', 'season_slug', 'season_secondary'] },
      { title: 'Contenido', ask: 'Lo que se vivirá, si ya lo tienes. Puedes dejarlo para después.', fields: ['body'] },
      { title: 'Resumen', ask: 'Revisa y envía: mira lo que escribiste y mándalo a revisión.', preview: true },
    ],
    meta: (r, c) => {
      const d = c.derej.find((x) => x.slug === r.derej_slug);
      return <Dot color={d?.color} label={d?.name ?? r.derej_slug} />;
    },
  },
  sessions: {
    entity: 'sessions', perm: 'sessions', path: 'fechas', title: 'Fechas de retiros', one: 'fecha', fem: true, label: (r) => r.title || `Fecha ${r.starts_on}`,
    text: ['title', 'note', 'place', 'cost_info'],
    tr: ['title', 'note', 'place', 'cost_info', 'date_text'],
    fields: [
      { n: 'retreat_id', label: 'Retiro', t: 'select', num: true, pick: 'retreat', opts: (c) => (c.retreats ?? []).map((r) => [r.id, r.title]), help: 'Elige un retiro, o deja vacío y escribe un título para una entrada libre del calendario.' },
      { n: 'title', label: 'Nombre de la actividad (si no es un retiro de la lista)', t: 'text', max: 160, when: (st) => !st.retreat_id },
      { n: 'starts_on', label: 'Fecha de inicio', t: 'date', req: true },
      { n: 'ends_on', label: 'Fecha final', t: 'date', after: 'starts_on', help: 'Déjala vacía si es un solo día.' },
      { n: 'date_text', label: 'Fecha en texto', t: 'text', max: 60, help: 'Opcional. Por ejemplo "21 al 27 de marzo". Si existe, se muestra en lugar del rango.' },
      { n: 'place', label: 'Lugar', t: 'text', max: 160 },
      { n: 'registration_mode', label: '¿La gente se inscribe?', t: 'select', omit: true, opts: () => MODE, cards: (v) => MODE_CARD[v], help: 'Si no eliges, se usa la inscripción propia.' },
      { n: 'cupo', label: '¿Cuántas personas caben?', t: 'number', min: 0, help: 'Déjalo vacío si no hay límite.', when: (st) => st.registration_mode !== 'none' },
      { n: 'cal_state', label: 'Estado en el calendario', t: 'select', omit: true, opts: () => [['confirmada', 'Confirmada'], ['por-confirmar', 'Por confirmar'], ['lista', 'Lista']] },
      { n: 'highlight', label: 'Destacar en el calendario', t: 'bool' },
      { n: 'note', label: 'Nota breve pública', t: 'text', max: 255, full: true },
      { n: 'cost_info', label: 'Costo', t: 'textarea', full: true, help: 'Texto libre, por ejemplo "$450 incluye alimentos".' },
      { n: 'notes', label: 'Notas internas', t: 'textarea', full: true, help: 'No se publican.' },
      PUBLISH,
    ],
    steps: [
      { title: 'Qué retiro', ask: '¿De qué retiro es esta fecha?', fields: ['retreat_id', 'title'] },
      { title: 'Cuándo y dónde', ask: 'Pon la fecha y el lugar.', fields: ['starts_on', 'ends_on', 'date_text', 'place'] },
      { title: 'Inscripción y cupo', ask: 'Di si la gente se inscribe, cuántos caben y cuánto cuesta.', fields: ['registration_mode', 'cupo', 'cost_info'] },
      { title: 'Resumen', ask: 'Revisa y envía: mira lo que escribiste y mándala a revisión.', preview: true },
    ],
    needsTitleOrRetreat: true,
    meta: (r, c) => `${r.date_text || (r.ends_on ? `${fmtDate(r.starts_on)} al ${fmtDate(r.ends_on)}` : fmtDate(r.starts_on))}${r.retreat_id ? ` · ${(c.retreats ?? []).find((x) => x.id === r.retreat_id)?.title ?? ''}` : ''}`,
  },
  pilgrimages: {
    entity: 'pilgrimages', perm: 'pilgrimages', path: 'peregrinaciones', title: 'Peregrinaciones', one: 'peregrinación', fem: true, label: (r) => r.title,
    text: ['title', 'summary', 'place', 'cost_info'],
    tr: ['title', 'summary', 'place', 'cost_info', 'itinerary'],
    fields: [
      { n: 'title', label: 'Título', t: 'text', req: true, max: 160 },
      { n: 'slug', label: 'Dirección en internet', t: 'text', req: true, slug: true, help: 'Se arma sola con el nombre. Solo cámbiala si hace falta: minúsculas, números y guiones (2 a 80).' },
      { n: 'place', label: 'Destino', t: 'text', max: 160 },
      { n: 'starts_on', label: 'Fecha de salida', t: 'date' },
      { n: 'ends_on', label: 'Fecha de regreso', t: 'date', after: 'starts_on' },
      { n: 'cupo', label: 'Cupo', t: 'number', min: 0 },
      { n: 'state', label: 'Estado', t: 'select', omit: true, opts: () => [['abierta', 'Abierta'], ['llena', 'Llena'], ['cerrada', 'Cerrada'], ['cancelada', 'Cancelada']] },
      { n: 'registration_mode', label: 'Inscripción', t: 'select', omit: true, opts: () => MODE },
      { n: 'summary', label: 'Resumen', t: 'textarea', full: true },
      { n: 'itinerary', label: 'Itinerario por días', t: 'itin', full: true },
      { n: 'cost_info', label: 'Costo', t: 'textarea', full: true, help: 'Texto libre, por ejemplo "$18,500 por persona, hospedaje doble".' },
      { n: 'cover', label: 'Imagen de portada', t: 'media', full: true },
      PUBLISH,
    ],
    steps: [
      { title: 'Nombre y destino', ask: '¿Cómo se llama y a dónde va?', fields: ['title', 'place'] },
      { title: 'Fechas y cupo', ask: '¿Cuándo sale, cuándo regresa y cuántos caben?', fields: ['starts_on', 'ends_on', 'cupo'] },
      { title: 'Foto', ask: 'Elige la foto que verá la gente.', fields: ['cover'] },
      { title: 'De qué trata', ask: 'Resumen, itinerario y costo.', fields: ['summary', 'itinerary', 'cost_info'] },
      { title: 'Resumen', ask: 'Revisa y envía: mira lo que escribiste y mándala a revisión.', preview: true },
    ],
    meta: (r) => `${r.place ?? 'Sin destino'} · ${fmtDate(r.starts_on)}`,
  },
  team: {
    entity: 'team', perm: 'team', path: 'equipo', title: 'Equipo', one: 'integrante', label: (r) => r.name,
    text: ['name', 'role_title'],
    tr: ['role_title'],
    fields: [
      { n: 'name', label: 'Nombre', t: 'text', req: true, max: 160 },
      { n: 'role_title', label: 'Cargo o rol', t: 'text', req: true, max: 160 },
      { n: 'photo', label: 'Foto', t: 'media', full: true, help: 'No uses fotos de menores: no se publican.' },
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
