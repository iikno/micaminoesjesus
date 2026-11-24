// Registrations: DB-backed flows shared by the public routes, the panel and the hourly job.
// Every capacity decision runs inside a transaction that holds the event row lock (see regrules.decide).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import { one, q, tx } from '../db.js';
import { audit } from './audit.js';
import { parseKey } from './crypto.js';
import { verifyCaptcha } from './captcha.js';
import { localize } from './i18n.js';
import { trySend } from './mailer.js';
import { pushFull } from './pushsvc.js';
import { justFilled } from './push.js';
import * as R from './regrules.js';

export const TABLE = { session: 'retreat_sessions', pilgrimage: 'pilgrimages' };
export const KEY = parseKey(config.REG_ENC_KEY);

// Manage link token = id.HMAC(id). Derived (not stored) so emails can be re-sent; changing SESSION_SECRET invalidates old links.
const mac = (id) => createHmac('sha256', config.SESSION_SECRET).update(`reg:${id}`).digest('base64url').slice(0, 32);
export const tokenOf = (id) => `${id}.${mac(id)}`;
export function idOf(token) {
  const [id, m] = String(token).split('.');
  if (!/^\d{1,18}$/.test(id ?? '') || !m) return null;
  const a = Buffer.from(m), b = Buffer.from(mac(id));
  return a.length === b.length && timingSafeEqual(a, b) ? Number(id) : null;
}
const link = (reg) => `${config.PUBLIC_URL}${reg.lang === 'en' ? '/en' : ''}/inscripcion/${tokenOf(reg.id)}`;

export async function checkCaptcha(req, action, token) {
  if (!config.GC_SECRET) return config.isProd ? { ok: false, reason: 'unavailable' } : { ok: true, score: null, reason: 'skipped' }; // dev without keys
  return verifyCaptcha({ secret: config.GC_SECRET, token, action, ip: req.ip, minScore: config.RECAPTCHA_MIN_SCORE, url: config.captchaUrl });
}

// ---- events (always from the published snapshot: what the public sees is what is enforced) ----
export async function liveEvent(kind, id, lang = 'es') {
  const row = await one(`SELECT id, published_snapshot FROM ${TABLE[kind]} WHERE id = ? AND published_snapshot IS NOT NULL AND live_from <= ?`, [id, new Date()]);
  if (!row) return null;
  const snap = localize({ ...row.published_snapshot, id }, lang);
  let derej = null, retreat = null;
  if (kind === 'session' && snap.retreat_id) {
    const r = await one('SELECT published_snapshot FROM retreats WHERE id = ? AND published_snapshot IS NOT NULL', [snap.retreat_id]);
    if (r) { retreat = localize({ ...r.published_snapshot, id: snap.retreat_id }, lang); derej = retreat.derej_slug; }
  }
  const today = new Date().toISOString().slice(0, 10);
  const open = snap.registration_mode === 'own' && !!snap.starts_on && snap.starts_on >= today && (kind === 'session' || ['abierta', 'llena'].includes(snap.state));
  return { kind, id, snap, retreat, derej, open, cupo: snap.cupo ?? null, title: snap.title || retreat?.title || `#${id}`, starts_on: snap.starts_on, ends_on: snap.ends_on ?? snap.starts_on };
}

export async function availability(kind, id) {
  const rows = await q("SELECT status, COUNT(*) n FROM registrations WHERE kind = ? AND event_id = ? AND status IN ('confirmado','oferta','lista_espera') GROUP BY status", [kind, id]);
  const n = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  return { taken: (n.confirmado ?? 0) + (n.oferta ?? 0), waitlist: n.lista_espera ?? 0 };
}

// ---- emails ----
const send = (reg, tpl, ev, extra) => {
  const [subject, text] = R.MAILS[reg.lang === 'en' ? 'en' : 'es'][tpl](reg.name, ev.title, link(reg), extra);
  return trySend({ to: reg.email, subject, text });
};
// Mails are queued during the transaction and sent after commit, so a rollback never mails anyone.
async function flush(mails) {
  for (const m of mails) {
    if (m.full) { // the spots taken reached the cupo in this transaction; the notice never blocks or breaks the response
      liveEvent(m.full.kind, m.full.id).then((ev) => pushFull(m.full.kind, m.full.id, ev?.title ?? 'la actividad')).catch((e) => console.error('push full failed:', e.message));
      continue;
    }
    const ev = await liveEvent(m.reg.kind, m.reg.event_id, m.reg.lang) ?? { title: '' };
    let pos;
    if (m.tpl === 'waitlist') pos = R.position(await q("SELECT id, queue_at FROM registrations WHERE kind = ? AND event_id = ? AND status = 'lista_espera'", [m.reg.kind, m.reg.event_id]), m.reg.id);
    await send(m.reg, m.tpl, ev, pos);
  }
}

// ---- transactional core ----
async function lockEvent(c, kind, id) {
  const row = await c.one(`SELECT id, published_snapshot, cupo FROM ${TABLE[kind]} WHERE id = ? FOR UPDATE`, [id]);
  return { kind, id, cupo: row ? (row.published_snapshot ? row.published_snapshot.cupo ?? null : row.cupo) : null };
}
const taken = async (c, ev) => (await c.one("SELECT COUNT(*) n FROM registrations WHERE kind = ? AND event_id = ? AND status IN ('confirmado','oferta')", [ev.kind, ev.id])).n;
// Run inside the event lock: if the spots taken reach the cupo because of fn, queue one "full" notice.
// Waitlist joins do not change `taken`, so they never repeat it; it fires again only after spots were freed and refilled.
async function watchFull(c, ev, fn, mails) {
  if (ev.cupo == null || !config.pushEnabled) return fn();
  const before = await taken(c, ev);
  const out = await fn();
  if (justFilled(ev.cupo, before, await taken(c, ev))) mails.push({ full: { kind: ev.kind, id: ev.id } });
  return out;
}
const setStatus = (c, id, status, extra = {}) => c.q(`UPDATE registrations SET status = ?${Object.keys(extra).map((k) => `, ${k} = ?`).join('')} WHERE id = ?`, [status, ...Object.values(extra), id]);

// Fills free spots from the waitlist: each person gets an offer valid 48h.
async function promote(c, ev, now, mails) {
  const free = R.freeSpots(ev.cupo, await taken(c, ev));
  if (!free) return 0;
  const wl = await c.q("SELECT * FROM registrations WHERE kind = ? AND event_id = ? AND status = 'lista_espera'", [ev.kind, ev.id]);
  const chosen = R.nextInLine(wl, free);
  for (const r of chosen) {
    await setStatus(c, r.id, 'oferta', { offer_expires_at: new Date(now.getTime() + R.OFFER_MS) });
    mails.push({ reg: r, tpl: 'offer' });
  }
  return chosen.length;
}

// Runs fn(c, reg, ev, mails) with the event row and then the registration row locked (always in that order).
async function act(id, fn) {
  const head = await one('SELECT kind, event_id FROM registrations WHERE id = ?', [id]);
  if (!head) return null;
  const mails = [];
  const out = await tx(async (c) => {
    const ev = await lockEvent(c, head.kind, head.event_id);
    const reg = await c.one('SELECT * FROM registrations WHERE id = ? FOR UPDATE', [id]);
    return watchFull(c, ev, () => fn(c, reg, ev, mails), mails);
  });
  await flush(mails);
  return out;
}
export async function withEvent(kind, eventId, fn) {
  const mails = [];
  const out = await tx(async (c) => { const ev = await lockEvent(c, kind, eventId); return watchFull(c, ev, () => fn(c, ev, mails), mails); });
  await flush(mails);
  return out;
}

const bad = (error, status = 409) => Object.assign(new Error(error), { status });

// Email verified: confirmed if there is a spot, waitlist otherwise.
export const verify = (id, now = new Date()) => act(id, async (c, reg, ev, mails) => {
  if (reg.status !== 'pendiente_verificacion') return { status: reg.status };
  if (R.verifyExpired(reg, now)) { await setStatus(c, id, 'expirado'); return { status: 'expirado', expired: true }; }
  const status = R.decide(ev.cupo, await taken(c, ev));
  await setStatus(c, id, status, { verified_at: now, queue_at: now });
  mails.push({ reg, tpl: status === 'confirmado' ? 'confirmed' : 'waitlist' });
  return { status };
});

export const cancel = (id, req = null, now = new Date()) => act(id, async (c, reg, ev, mails) => {
  if (!R.transition(reg.status, 'cancel').ok) throw bad('invalid_state');
  await setStatus(c, id, 'cancelado');
  await promote(c, ev, now, mails);
  if (req) await audit(c, req, 'cancel', 'registrations', id, { from: reg.status });
  return { status: 'cancelado' };
});

export const acceptOffer = (id, now = new Date()) => act(id, async (c, reg, _ev, mails) => {
  if (!R.transition(reg.status, 'accept').ok) throw bad('invalid_state');
  if (R.offerExpired(reg, now)) throw bad('offer_expired', 410);
  await setStatus(c, id, 'confirmado', { offer_expires_at: null });
  mails.push({ reg, tpl: 'confirmed' });
  return { status: 'confirmado' };
});

// Panel actions by the responsible role. confirm may exceed the cupo on purpose (a person decided); it is audited.
export const manual = (id, action, req, now = new Date()) => act(id, async (c, reg, ev, mails) => {
  const t = R.transition(reg.status, action);
  if (!t.ok) throw bad('invalid_state');
  const over = action === 'confirm' && R.freeSpots(ev.cupo, await taken(c, ev)) === 0 && reg.status !== 'oferta';
  if (action === 'cancel') await setStatus(c, id, t.to);
  else if (action === 'confirm') { await setStatus(c, id, t.to, { verified_at: reg.verified_at ?? now, offer_expires_at: null }); mails.push({ reg, tpl: 'confirmed' }); }
  else await setStatus(c, id, t.to, { queue_at: now, offer_expires_at: null }); // waitlist: goes to the end of the line
  if (action === 'cancel') await promote(c, ev, now, mails);
  await audit(c, req, `reg_${action}`, 'registrations', id, { from: reg.status, to: t.to, ...(over && { over_cupo: true }) });
  return { status: t.to };
});

// ---- hourly job part: reminders, expiry, offers, promotion, retention. Idempotent. ----
export async function runRegistrationJobs(now = new Date()) {
  const n = { expired: 0, reminded: 0, offersExpired: 0, promoted: 0, sensitiveWiped: 0, deleted: 0 };
  const ago = (ms) => new Date(now.getTime() - ms);

  for (const r of await q("SELECT * FROM registrations WHERE status = 'pendiente_verificacion' AND created_at <= ?", [ago(R.VERIFY_EXPIRE_MS)])) {
    await q("UPDATE registrations SET status = 'expirado' WHERE id = ? AND status = 'pendiente_verificacion'", [r.id]);
    const ev = await liveEvent(r.kind, r.event_id, r.lang);
    if (ev) await send(r, 'released', ev);
    n.expired++;
  }
  for (const r of await q("SELECT * FROM registrations WHERE status = 'pendiente_verificacion' AND verify_reminded_at IS NULL AND created_at <= ?", [ago(R.VERIFY_REMIND_MS)])) {
    if (!R.reminderDue(r, now)) continue;
    await q('UPDATE registrations SET verify_reminded_at = ? WHERE id = ?', [now, r.id]);
    const ev = await liveEvent(r.kind, r.event_id, r.lang);
    if (ev) await send(r, 'remind', ev);
    n.reminded++;
  }
  // An offer nobody answered in 48h is released; the next person in line is offered the spot.
  for (const r of await q("SELECT * FROM registrations WHERE status = 'oferta' AND offer_expires_at <= ?", [now])) {
    const done = await act(r.id, async (c, reg, ev, mails) => {
      if (!R.offerExpired(reg, now)) return false;
      await setStatus(c, reg.id, 'expirado', { offer_expires_at: null });
      mails.push({ reg, tpl: 'released' });
      await promote(c, ev, now, mails);
      return true;
    });
    if (done) n.offersExpired++;
  }
  // Spots freed some other way (cupo raised in the content flow, manual changes) are offered here.
  for (const e of await q("SELECT DISTINCT kind, event_id FROM registrations WHERE status = 'lista_espera'")) {
    n.promoted += await withEvent(e.kind, e.event_id, (c, ev, mails) => promote(c, ev, now, mails));
  }

  // Retention, counted from the end of the event.
  const sens = R.retentionCutoff(now, R.SENSITIVE_DAYS), all = R.retentionCutoff(now, R.REG_DAYS);
  for (const [kind, table] of Object.entries(TABLE)) {
    const j = `JOIN ${table} e ON r.kind = '${kind}' AND e.id = r.event_id`;
    n.sensitiveWiped += (await q(`UPDATE registrations r ${j} SET r.contact_enc = NULL, r.allergies_enc = NULL
      WHERE COALESCE(e.ends_on, e.starts_on) <= ? AND (r.contact_enc IS NOT NULL OR r.allergies_enc IS NOT NULL)`, [sens])).affectedRows;
    n.deleted += (await q(`DELETE r FROM registrations r ${j} WHERE COALESCE(e.ends_on, e.starts_on) <= ?`, [all])).affectedRows;
  }
  return n;
}
