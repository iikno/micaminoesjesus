// Panel push, DB + web-push side. Every entry point is fire-and-forget safe: it never throws and does nothing
// without VAPID keys. Callers invoke these AFTER the transaction committed.
import { createHash } from 'node:crypto';
import { sendNotification } from 'web-push';
import { config } from '../config.js';
import { q } from '../db.js';
import * as P from './push.js';

const TIMEOUT_MS = 8000;
export const hashEndpoint = (e) => createHash('sha256').update(e).digest('hex');
const subject = () => config.VAPID_SUBJECT || (config.PUBLIC_URL.startsWith('https:') ? config.PUBLIC_URL : `mailto:${config.SMTP_FROM}`); // web-push wants https: or mailto:
const send = (s, body) => sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body,
  { vapidDetails: { subject: subject(), publicKey: config.VAPID_PUBLIC_KEY, privateKey: config.VAPID_PRIVATE_KEY }, TTL: 86400, timeout: TIMEOUT_MS });

// Active users only: a disabled user never receives anything even if a device row is left over.
export async function pushToUsers(userIds, payload) {
  if (!config.pushEnabled || !userIds.length) return 0;
  try {
    const subs = await q("SELECT s.id, s.endpoint, s.p256dh, s.auth FROM push_subscriptions s JOIN users u ON u.id = s.user_id WHERE u.status = 'active' AND s.user_id IN (?)", [userIds]);
    const { sent, gone } = await P.deliver(subs, payload, send, console.error);
    if (gone.length) await q('DELETE FROM push_subscriptions WHERE id IN (?)', [gone]);
    return sent;
  } catch (e) {
    console.error('push failed:', e.message);
    return 0;
  }
}

const idsOf = (roles, exceptId = 0) => (roles.length ? q("SELECT id FROM users WHERE status = 'active' AND role IN (?) AND id <> ?", [roles, exceptId]).then((r) => r.map((x) => x.id)) : []);
const toRoles = async (roles, payload, exceptId) => { try { return await pushToUsers(await idsOf(roles, exceptId), payload); } catch (e) { console.error('push failed:', e.message); return 0; } };

export const pushSubmitted = (entity, resource, author) => toRoles(P.approverRolesOf(resource), P.submittedMsg(entity), author.id);
export const pushDecision = (entity, id, authorId, approved) => pushToUsers([authorId], P.decisionMsg(entity, id, approved));
export const pushContact = () => toRoles(P.inboxRoles(), P.contactMsg());
export const pushFull = (kind, id, title) => toRoles(P.managerRolesOf(kind), P.fullMsg(kind, id, title));

// Hourly job: the daily registrations summary (see push.runDigest).
export const runDailyDigest = (now = new Date()) => !config.pushEnabled ? { sent: 0, reason: 'off' } : P.runDigest(now, {
  since: async () => new Date((await q('SELECT MAX(until_at) m FROM push_digests'))[0].m ?? now.getTime() - 24 * 3600e3),
  claim: async (day, until) => (await q('INSERT IGNORE INTO push_digests (day, until_at) VALUES (?, ?)', [day, until])).affectedRows === 1,
  counts: (since, until) => q(`SELECT kind, status, COUNT(*) n FROM registrations WHERE status IN ('confirmado','lista_espera')
    AND COALESCE(queue_at, verified_at) > ? AND COALESCE(queue_at, verified_at) <= ? GROUP BY kind, status`, [since, until]),
  managers: (kind) => idsOf(P.managerRolesOf(kind)),
  send: pushToUsers,
});
