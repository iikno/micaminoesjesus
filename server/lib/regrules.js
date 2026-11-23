// Pure rules for registrations (no DB, no config): capacity, state machine, timing, retention, minors.
import { z } from 'zod';

const H = 3600e3, D = 24 * H;
export const VERIFY_REMIND_MS = 24 * H;
export const VERIFY_EXPIRE_MS = 72 * H;
export const OFFER_MS = 48 * H;
export const SENSITIVE_DAYS = 30; // alergias + contacto de emergencia, desde el fin del evento
export const REG_DAYS = 90; // inscripción completa, desde el fin del evento
export const CONTACT_MONTHS = 12;
export const SPAM_DAYS = 30;
export const AUDIT_MONTHS = 24;

// Statuses that hold a spot: confirmed, and an offer waiting for its 48h answer.
export const HOLDS = ['confirmado', 'oferta'];

// Capacity. Concurrency semantics: callers MUST evaluate this inside a transaction holding the event row
// lock (SELECT ... FOR UPDATE on the session/pilgrimage), so two verifications cannot both see the last spot.
// cupo null = unlimited. Pending (unverified) registrations never hold a spot.
export const decide = (cupo, taken) => (cupo == null || taken < cupo ? 'confirmado' : 'lista_espera');
export const freeSpots = (cupo, taken) => (cupo == null ? Infinity : Math.max(0, cupo - taken));
const byQueue = (a, b) => new Date(a.queue_at) - new Date(b.queue_at) || a.id - b.id;
// Who gets the free spots: the first N of the waitlist by verification time, then id.
export const nextInLine = (waitlist, free) => [...waitlist].sort(byQueue).slice(0, Number.isFinite(free) ? free : waitlist.length);
export const position = (waitlist, id) => [...waitlist].sort(byQueue).findIndex((r) => r.id === id) + 1;

// State machine. Actions: verify, offer, accept, expire_offer, expire, cancel, confirm (manual), waitlist (manual).
const T = {
  verify: { from: ['pendiente_verificacion'], to: null }, // target decided by decide()
  expire: { from: ['pendiente_verificacion'], to: 'expirado' },
  offer: { from: ['lista_espera'], to: 'oferta' },
  accept: { from: ['oferta'], to: 'confirmado' },
  expire_offer: { from: ['oferta'], to: 'expirado' },
  cancel: { from: ['pendiente_verificacion', 'lista_espera', 'oferta', 'confirmado'], to: 'cancelado' },
  confirm: { from: ['pendiente_verificacion', 'lista_espera', 'oferta'], to: 'confirmado' },
  waitlist: { from: ['pendiente_verificacion', 'oferta', 'confirmado'], to: 'lista_espera' },
};
export const transition = (from, action) => {
  const t = T[action];
  return t && t.from.includes(from) ? { ok: true, to: t.to } : { ok: false, to: null };
};

// Time math. `r` has status, created_at, verify_reminded_at, offer_expires_at.
export const reminderDue = (r, now) => r.status === 'pendiente_verificacion' && !r.verify_reminded_at && now - new Date(r.created_at) >= VERIFY_REMIND_MS;
export const verifyExpired = (r, now) => r.status === 'pendiente_verificacion' && now - new Date(r.created_at) >= VERIFY_EXPIRE_MS;
export const offerExpired = (r, now) => r.status === 'oferta' && new Date(r.offer_expires_at) <= now;

// Retention: events whose end date is on or before the cutoff are due. Returns 'YYYY-MM-DD'.
export const retentionCutoff = (now, days) => new Date(now - days * D).toISOString().slice(0, 10);
export const monthsAgo = (now, m) => { const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - m); return d; };

// ---- who may see what (rows are scoped by kind; asesor reads the list but never the decrypted data) ----
export const scopeOf = (role) => ({ admin: ['session', 'pilgrimage'], asesor: ['session', 'pilgrimage'], pastoral: ['session'], peregrinacion: ['pilgrimage'] }[role] ?? []);
export const canRead = (role, kind) => scopeOf(role).includes(kind);
export const canManage = (role, kind) => role !== 'asesor' && canRead(role, kind); // write, decrypt, export

// ---- input rules ----
const s = (max) => z.string().trim().max(max);
const phone = s(30).regex(/^[0-9+()\-\s.]{7,30}$/);
const person = z.strictObject({ name: s(120).min(1), phone });

// derej: slug of the retreat's Dérej, or null (pilgrimages and free-form dates are for adults).
// Simjá (children up to 12): a parent/guardian registers them. Oz (13-17 allowed): under-18s need the permission checkbox.
export function registrationSchema({ derej = null, allergiesEnabled = false } = {}) {
  const guardian = derej === 'simja';
  return z.strictObject({
    kind: z.enum(['session', 'pilgrimage']), event_id: z.int().positive(), lang: z.enum(['es', 'en']).default('es'),
    captcha: s(4000).default(''),
    name: s(120).min(1), phone, email: z.email().max(190).transform((e) => e.toLowerCase()),
    emergency: person,
    allergies: s(500).nullish(), consent_health: z.boolean().optional(),
    consent_privacy: z.literal(true),
    guardian: guardian ? person : z.never().optional(), // required for Simjá, not accepted elsewhere
    under18: derej === 'oz' ? z.boolean() : z.never().optional(),
    permission: z.boolean().optional(),
  }).superRefine((v, ctx) => {
    const bad = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (v.allergies && !allergiesEnabled) bad('allergies', 'allergies_disabled');
    if (v.allergies && allergiesEnabled && v.consent_health !== true) bad('consent_health', 'consent_health required for allergies');
    if (derej === 'oz' && v.under18 && v.permission !== true) bad('permission', 'permission required for under 18');
  });
}

// Plain-text emails by registrant language. Each returns [subject, body].
export const MAILS = {
  es: {
    verify: (n, ev, url) => [`Confirma tu correo: ${ev}`, `Hola ${n},\n\nRecibimos tu solicitud de inscripción a "${ev}". Confirma tu correo en este enlace (vence en 72 horas):\n${url}\n\nSi no fuiste tú, ignora este mensaje.`],
    remind: (n, ev, url) => [`Recordatorio: confirma tu correo (${ev})`, `Hola ${n},\n\nAún no confirmas tu correo para "${ev}". El enlace vence pronto:\n${url}`],
    confirmed: (n, ev, url) => [`Inscripción confirmada: ${ev}`, `Hola ${n},\n\nTu lugar en "${ev}" está confirmado.\nSi ya no puedes asistir, cancela aquí para liberar tu lugar:\n${url}`],
    waitlist: (n, ev, url, pos) => [`Lista de espera: ${ev}`, `Hola ${n},\n\nEl cupo de "${ev}" está lleno. Estás en la lista de espera, lugar ${pos}. Si se libera un lugar te avisaremos y tendrás 48 horas para confirmarlo.\nVer o cancelar: ${url}`],
    offer: (n, ev, url) => [`Se liberó un lugar: ${ev}`, `Hola ${n},\n\nSe liberó un lugar en "${ev}". Tienes 48 horas para confirmarlo; si no, pasará a la siguiente persona:\n${url}`],
    exists: (n, ev, url) => [`Ya tienes una inscripción: ${ev}`, `Hola ${n},

Ya tienes una inscripción para "${ev}". Aquí tu enlace de gestión:
${url}

Si no fuiste tú, ignora este mensaje.`],
    released: (n, ev) => [`Inscripción liberada: ${ev}`, `Hola ${n},\n\nTu inscripción a "${ev}" venció sin confirmarse y el lugar fue liberado. Si aún quieres asistir, puedes inscribirte de nuevo.`],
  },
  en: {
    verify: (n, ev, url) => [`Confirm your email: ${ev}`, `Hello ${n},\n\nWe received your registration request for "${ev}". Confirm your email with this link (expires in 72 hours):\n${url}\n\nIf this was not you, ignore this message.`],
    remind: (n, ev, url) => [`Reminder: confirm your email (${ev})`, `Hello ${n},\n\nYou have not confirmed your email for "${ev}" yet. The link expires soon:\n${url}`],
    confirmed: (n, ev, url) => [`Registration confirmed: ${ev}`, `Hello ${n},\n\nYour spot at "${ev}" is confirmed.\nIf you can no longer attend, cancel here to free your spot:\n${url}`],
    waitlist: (n, ev, url, pos) => [`Waitlist: ${ev}`, `Hello ${n},\n\n"${ev}" is full. You are on the waitlist, position ${pos}. If a spot opens we will email you and you will have 48 hours to confirm it.\nView or cancel: ${url}`],
    offer: (n, ev, url) => [`A spot opened: ${ev}`, `Hello ${n},\n\nA spot opened at "${ev}". You have 48 hours to confirm it; otherwise it goes to the next person:\n${url}`],
    exists: (n, ev, url) => [`You already have a registration: ${ev}`, `Hello ${n},

You already have a registration for "${ev}". Here is your management link:
${url}

If this was not you, ignore this message.`],
    released: (n, ev) => [`Registration released: ${ev}`, `Hello ${n},\n\nYour registration for "${ev}" expired without confirmation and the spot was released. You can register again if you still want to attend.`],
  },
};
