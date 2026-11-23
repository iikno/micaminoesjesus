// Public F4 endpoints: config, event info, registrations (verify/confirm/cancel by emailed token) and the contact form.
import { z } from 'zod';
import { config } from '../config.js';
import { one, q, tx } from '../db.js';
import { audit } from '../lib/audit.js';
import { csrf } from '../lib/auth.js';
import { arcoDue, contactSchema } from '../lib/contact.js';
import { encrypt } from '../lib/crypto.js';
import { normLang } from '../lib/i18n.js';
import { trySend } from '../lib/mailer.js';
import * as R from '../lib/regrules.js';
import * as svc from '../lib/regsvc.js';

const limit = (max, timeWindow = '10 minutes') => ({ config: { rateLimit: { max, timeWindow } } });
const fail = (status, error) => { throw Object.assign(new Error(error), { status }); };
const notified = new Map(); // shortcut: in memory (single replica), resets on restart
const head = z.looseObject({ kind: z.enum(['session', 'pilgrimage']), event_id: z.int().positive() });

export default async function regPublicRoutes(app) {
  app.addHook('onSend', async (req, reply, payload) => { reply.header('Cache-Control', 'no-store'); return payload; });
  const post = { preHandler: csrf };

  app.get('/api/public/config', { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } }, () => ({
    recaptcha: config.GC_SITE || null, allergies: config.ALLERGIES_ENABLED, registrations: !!svc.KEY,
  }));

  // Registration state of one event: open, full, waitlist length and the Dérej that sets the minors rules.
  const info = async (kind, id, lang) => {
    const ev = await svc.liveEvent(kind, id, lang);
    if (!ev) return null;
    const a = await svc.availability(kind, id);
    return { ev, reg: { open: ev.open && !!svc.KEY, full: ev.cupo != null && a.taken >= ev.cupo, waitlist: a.waitlist, derej: ev.derej } };
  };
  app.get('/api/public/registration-info/:kind/:id', limit(120, '1 minute'), async (req, reply) => {
    const { kind, id } = req.params;
    const r = TABLE_OK(kind) && await info(kind, Number(id), normLang(req.query.lang));
    return r ? r.reg : reply.code(404).send({ error: 'not_found' });
  });
  // Detail of one calendar date (sessions have no other page).
  app.get('/api/public/sessions/:id', limit(120, '1 minute'), async (req, reply) => {
    const r = await info('session', Number(req.params.id), normLang(req.query.lang));
    if (!r) return reply.code(404).send({ error: 'not_found' });
    const { snap, retreat } = r.ev;
    return {
      id: snap.id, title: r.ev.title, note: snap.note, starts_on: snap.starts_on, ends_on: snap.ends_on, date_text: snap.date_text, place: snap.place,
      cost_info: snap.cost_info, registration_mode: snap.registration_mode, retreat_slug: retreat?.slug ?? null, derej_slug: r.ev.derej, reg: r.reg,
    };
  });

  app.post('/api/public/registrations', { ...post, ...limit(10) }, async (req, reply) => {
    if (!svc.KEY) return reply.code(503).send({ error: 'registrations_unavailable' });
    const { kind, event_id: eventId } = head.parse(req.body);
    const lang = normLang(req.body.lang);
    const ev = await svc.liveEvent(kind, eventId, lang);
    if (!ev) return reply.code(404).send({ error: 'event_not_found' });
    if (!ev.open) return reply.code(409).send({ error: 'registration_closed' });
    const d = R.registrationSchema({ derej: ev.derej, allergiesEnabled: config.ALLERGIES_ENABLED }).parse(req.body);
    const cap = await svc.checkCaptcha(req, 'register', d.captcha);
    if (!cap.ok) return reply.code(cap.reason === 'unavailable' ? 503 : 400).send({ error: cap.reason === 'unavailable' ? 'captcha_unavailable' : 'captcha_failed' });
    const dup = await one("SELECT id, name, lang FROM registrations WHERE kind = ? AND event_id = ? AND email = ? AND status NOT IN ('cancelado','expirado')", [kind, eventId, d.email]);
    if (dup) {
      // Same answer as a new registration (no way to probe whether an email is registered); the owner gets a mail instead.
      // Throttled to one mail per address per hour so this cannot be used to flood someone.
      const last = notified.get(d.email);
      if (!last || Date.now() - last > 3600e3) {
        notified.set(d.email, Date.now());
        const [subject, text] = R.MAILS[dup.lang === 'en' ? 'en' : 'es'].exists(dup.name, ev.title, `${config.PUBLIC_URL}${dup.lang === 'en' ? '/en' : ''}/inscripcion/${svc.tokenOf(dup.id)}`);
        await trySend({ to: d.email, subject, text });
      }
      return reply.code(201).send({ ok: true });
    }

    const now = new Date();
    const id = await tx(async (c) => {
      const r = await c.q(
        `INSERT INTO registrations (kind, event_id, lang, name, phone, email, contact_enc, allergies_enc, under18, minor_permission, consent_privacy_at, consent_health_at, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [kind, eventId, d.lang, d.name, d.phone, d.email, encrypt(svc.KEY, { emergency: d.emergency, guardian: d.guardian ?? null }),
          d.allergies ? encrypt(svc.KEY, d.allergies) : null, d.under18 ?? null, d.under18 ? d.permission === true : null, now, d.allergies ? now : null, now]);
      await audit(c, req, 'register', 'registrations', r.insertId);
      return r.insertId;
    });
    const [subject, text] = R.MAILS[d.lang].verify(d.name, ev.title, `${config.PUBLIC_URL}${d.lang === 'en' ? '/en' : ''}/inscripcion/${svc.tokenOf(id)}`);
    await trySend({ to: d.email, subject, text });
    return reply.code(201).send({ ok: true });
  });

  // ---- by token (links in the emails) ----
  const byToken = async (req) => svc.idOf(req.params.token) ?? fail(404, 'not_found');
  app.get('/api/public/registrations/:token', limit(60, '1 minute'), async (req) => {
    const id = await byToken(req);
    const reg = await one('SELECT * FROM registrations WHERE id = ?', [id]) ?? fail(404, 'not_found');
    const ev = await svc.liveEvent(reg.kind, reg.event_id, reg.lang);
    const wl = reg.status === 'lista_espera' ? await q("SELECT id, queue_at FROM registrations WHERE kind = ? AND event_id = ? AND status = 'lista_espera'", [reg.kind, reg.event_id]) : null;
    return {
      status: reg.status, name: reg.name, lang: reg.lang, event: ev && { title: ev.title, starts_on: ev.starts_on, ends_on: ev.ends_on },
      position: wl ? R.position(wl, id) : null, offer_expires_at: reg.status === 'oferta' ? reg.offer_expires_at : null,
      verify_expired: R.verifyExpired(reg, new Date()),
    };
  });
  const tokenAction = (path, fn) => app.post(`/api/public/registrations/:token/${path}`, { ...post, ...limit(20, '1 minute') }, async (req) => {
    const out = await fn(await byToken(req), req);
    return out ?? fail(404, 'not_found');
  });
  tokenAction('verify', (id) => svc.verify(id));
  tokenAction('confirm', (id) => svc.acceptOffer(id));
  tokenAction('cancel', (id, req) => svc.cancel(id, req));

  // ---- contact form ----
  app.post('/api/public/contact', { ...post, ...limit(5) }, async (req, reply) => {
    const d = contactSchema.parse(req.body);
    const cap = await svc.checkCaptcha(req, 'contact', d.captcha);
    if (!cap.ok && cap.reason === 'unavailable') return reply.code(503).send({ error: 'captcha_unavailable' });
    const spam = !cap.ok; // low score, missing or wrong token: stored for review, never emailed
    const now = new Date(), arco = d.subject === 'arco';
    const id = await tx(async (c) => {
      const r = await c.q(
        `INSERT INTO contact_messages (name, email, phone, subject, message, lang, status, is_arco, due_on, score, consent_at, ip, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [d.name, d.email, d.phone || null, d.subject, d.message, d.lang, spam ? 'spam' : 'nuevo', arco, arco ? arcoDue(now) : null, cap.score ?? null, now, req.ip, now]);
      await audit(c, req, 'contact', 'contact_messages', r.insertId);
      return r.insertId;
    });
    if (!spam && config.CONTACT_TO) {
      await trySend({
        to: config.CONTACT_TO, replyTo: d.email, subject: `${arco ? '[ARCO] ' : ''}Contacto web: ${d.name} (#${id})`,
        text: `De: ${d.name} <${d.email}>${d.phone ? `\nTeléfono: ${d.phone}` : ''}\nAsunto: ${d.subject}\nIdioma: ${d.lang}\n\n${d.message}\n`,
      });
    }
    return reply.code(201).send({ ok: true });
  });
}

const TABLE_OK = (k) => k === 'session' || k === 'pilgrimage';
