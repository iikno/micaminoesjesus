import { z } from 'zod';

const str = (max) => z.string().trim().max(max);
const text = z.string().trim().max(20000);
const date = z.iso.date();
const when = z.iso.datetime().nullish(); // publish_at; absent = publish on approval
const slug = z.string().regex(/^[a-z0-9-]{2,80}$/);
const mode = z.enum(['none', 'own']);

// Structured body of a retreat: exactly what the public detail page renders (see ProyectoDetalle.jsx).
const lines = (n, max) => z.array(str(max)).max(n);
export const retreatBody = z.strictObject({
  basadoEn: str(255).nullish(),
  chipsLabel: str(160).nullish(), chips: lines(30, 120).nullish(),
  bloques: z.array(z.strictObject({ title: str(160).min(1), text: text.nullish() })).max(20).nullish(), // módulos
  temas: z.array(z.strictObject({ // pedagogía vivencial
    titulo: str(200).min(1), resumen: text.nullish(), puntos: lines(12, 1500).nullish(),
    evocacion: text.nullish(), actividadIntroductoria: text.nullish(), contenido: text.nullish(),
    actividadesAdicionales: text.nullish(), simbolos: lines(12, 400).nullish(), reflexion: text.nullish(),
  })).max(30).nullish(),
  cronograma: z.array(z.strictObject({ bloque: str(160).min(1), duracionMinutos: z.int().min(0).max(1440).nullish() })).max(60).nullish(),
  fichaTecnica: z.array(z.strictObject({ icon: z.enum(['clock', 'people', 'building']).nullish(), label: str(80).min(1), value: str(160).min(1), desc: str(1000).nullish() })).max(12).nullish(),
});

export const retreat = z.strictObject({
  slug, codigo: str(60).nullish(), derej_slug: str(40),
  tipo: z.enum(['taller', 'retiro', 'hora_santa', 'vivencial', 'experiencial', 'estaciones']),
  paso: z.int().min(1).max(12).nullish(), tema_paso: str(160).nullish(),
  title: str(160).min(1), subtitle: str(255).nullish(), summary: text.nullish(),
  season_slug: str(40).nullish(), season_secondary: z.array(str(40)).nullish(),
  corte_simja: z.enum(['kinder', 'primaria', 'ambos']).nullish(), cover: str(255).nullish(),
  estado_catalogo: z.enum(['publicado', 'proximamente']).optional(),
  body: retreatBody.nullish(), publish_at: when,
});

// No .default() anywhere: PATCH uses .partial() and must not reset omitted fields; the DB columns carry the defaults.
export const sessionObj = z.strictObject({
  retreat_id: z.int().positive().nullish(), title: str(160).nullish(), note: str(255).nullish(),
  starts_on: date, ends_on: date.nullish(), date_text: str(60).nullish(),
  cal_state: z.enum(['lista', 'confirmada', 'por-confirmar']).optional(),
  highlight: z.boolean().optional(), place: str(160).nullish(),
  registration_mode: mode.optional(), cupo: z.int().min(0).nullish(),
  cost_info: text.nullish(), notes: text.nullish(), publish_at: when,
});
export const session = sessionObj.refine((s) => s.retreat_id || s.title, { message: 'retreat_id or title is required', path: ['title'] })
  .refine((s) => !s.ends_on || s.ends_on >= s.starts_on, { message: 'ends_on is before starts_on', path: ['ends_on'] });

export const pilgrimage = z.strictObject({
  slug, title: str(160).min(1), summary: text.nullish(), itinerary: z.array(z.unknown()).nullish(),
  place: str(160).nullish(), starts_on: date.nullish(), ends_on: date.nullish(), cupo: z.int().min(0).nullish(),
  cost_info: text.nullish(), registration_mode: mode.optional(),
  state: z.enum(['abierta', 'llena', 'cerrada', 'cancelada']).optional(),
  cover: str(255).nullish(), publish_at: when,
});

export const team = z.strictObject({
  name: str(160).min(1), role_title: str(160).min(1), photo: str(255).nullish(),
  sort: z.int().min(0).max(32000).optional(), publish_at: when,
});

export const verse = z.strictObject({
  ref: str(80).min(1), text_es: text.min(1), text_en: text.nullish(),
  version_en: str(20).optional(), source_note: str(255).nullish(), publish_at: when,
});

export const roles = z.enum(['admin', 'asesor', 'pastoral', 'peregrinacion']);
export const invite = z.strictObject({ email: z.email().max(190).transform((e) => e.toLowerCase()), name: str(120).min(1), role: roles });
export const userPatch = z.strictObject({ name: str(120).min(1), role: roles, status: z.enum(['active', 'disabled']) }).partial();

export const password = z.string().min(12).max(200);
export const login = z.strictObject({ email: z.email().transform((e) => e.toLowerCase()), password: z.string().min(1).max(200) });
export const setPassword = z.strictObject({ token: z.string().min(20).max(200), password });
export const changePassword = z.strictObject({ current: z.string().min(1).max(200), password });
export const forgot = z.strictObject({ email: z.email().transform((e) => e.toLowerCase()) });

export const decision = z.strictObject({ comment: str(2000).optional(), publish_at: when });
export const rejection = z.strictObject({ comment: str(2000).min(1) });

// ---- F3b: media, glossary, translations ----
export const mediaPatch = z.strictObject({
  alt_es: str(255).nullish(), alt_en: str(255).nullish(), caption_retreat: str(160).nullish(),
  caption_place: str(160).nullish(), caption_date: date.nullish(), has_minors: z.boolean(),
}).partial();
export const glossaryTerm = z.strictObject({
  term: str(120).min(1), mode: z.enum(['keep', 'map']), en: str(160).nullish(), note: str(255).nullish(),
}).refine((g) => g.mode === 'keep' || g.en, { message: 'en is required for map terms', path: ['en'] });

// English fields per entity: same shapes as the Spanish ones, all optional (missing = fall back to Spanish).
const enText = str(20000).nullish();
export const translationFields = {
  retreats: z.strictObject({ title: enText, subtitle: enText, summary: enText, tema_paso: enText, body: retreatBody.nullish() }).partial(),
  sessions: z.strictObject({ title: enText, note: enText, place: enText, cost_info: enText, date_text: enText }).partial(),
  pilgrimages: z.strictObject({ title: enText, summary: enText, place: enText, cost_info: enText, itinerary: z.array(z.unknown()).nullish() }).partial(),
  team: z.strictObject({ role_title: enText }).partial(),
};
