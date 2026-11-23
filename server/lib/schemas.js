import { z } from 'zod';

const str = (max) => z.string().trim().max(max);
const text = z.string().trim().max(20000);
const date = z.iso.date();
const when = z.iso.datetime().nullish(); // publish_at; absent = publish on approval
const slug = z.string().regex(/^[a-z0-9-]{2,80}$/);
const mode = z.enum(['none', 'own']);
const json = z.record(z.string(), z.unknown());

export const retreat = z.strictObject({
  slug, codigo: str(60).nullish(), derej_slug: str(40),
  tipo: z.enum(['taller', 'retiro', 'hora_santa', 'vivencial', 'experiencial', 'estaciones']),
  paso: z.int().min(1).max(12).nullish(), tema_paso: str(160).nullish(),
  title: str(160).min(1), subtitle: str(255).nullish(), summary: text.nullish(),
  season_slug: str(40).nullish(), season_secondary: z.array(str(40)).nullish(),
  corte_simja: z.enum(['kinder', 'primaria', 'ambos']).nullish(), cover: str(255).nullish(),
  estado_catalogo: z.enum(['publicado', 'proximamente']).optional(),
  body: json.nullish(), publish_at: when,
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
export const forgot = z.strictObject({ email: z.email().transform((e) => e.toLowerCase()) });

export const decision = z.strictObject({ comment: str(2000).optional(), publish_at: when });
export const rejection = z.strictObject({ comment: str(2000).min(1) });
