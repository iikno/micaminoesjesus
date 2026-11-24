// Panel push: pure rules (no DB, no config, no network) so they can be tested. The DB/web-push side is pushsvc.js.
import { PERMS, can } from './perm.js';
import { canManage } from './regrules.js';

export const TZ = 'America/Mexico_City';
export const DIGEST_HOUR = 8;
export const MAX_PER_USER = 10;

// Only the push services of the browsers we support. A subscription endpoint is a URL the SERVER will POST to,
// so anything else (internal hosts, other ports, credentials) is refused: that is the SSRF guard.
const HOSTS = ['fcm.googleapis.com', 'push.services.mozilla.com', 'notify.windows.com', 'push.apple.com'];
export function endpointOk(raw) {
  if (typeof raw !== 'string' || raw.length > 1000) return false;
  let u;
  try { u = new URL(raw); } catch { return false; }
  return u.protocol === 'https:' && !u.username && !u.password && (u.port === '' || u.port === '443')
    && HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
}

// Roles that hold a permission, to pick recipients with the same rules the panel uses.
const rolesWith = (test) => Object.keys(PERMS).filter(test);
export const approverRolesOf = (resource) => rolesWith((r) => can(r, resource, 'approve'));
export const managerRolesOf = (kind) => rolesWith((r) => canManage(r, kind));
export const inboxRoles = () => rolesWith((r) => can(r, 'contact', 'read'));

// Spanish nouns for texts that carry no content of the item (a team member's name is personal data).
const ITEM = { retreats: ['retiro', 'o'], sessions: ['fecha', 'a'], pilgrimages: ['peregrinación', 'a'], team: ['integrante', 'o'], verses: ['versículo', 'o'] };
const PATH = { retreats: 'retiros', sessions: 'fechas', pilgrimages: 'peregrinaciones', team: 'equipo', verses: 'versiculos' };

export const submittedMsg = (entity) => ({ title: 'Algo espera tu aprobación', body: `Un${ITEM[entity][1] === 'a' ? 'a' : ''} ${ITEM[entity][0]} está en revisión.`, url: '/panel/revision', tag: 'review' });
export const decisionMsg = (entity, id, approved) => ({
  title: approved ? 'Aprobado' : 'Necesita cambios',
  body: approved ? `Tu ${ITEM[entity][0]} fue aprobad${ITEM[entity][1]}.` : `Tu ${ITEM[entity][0]} necesita cambios.`,
  url: `/panel/${PATH[entity]}/${id}`, tag: `decision-${entity}-${id}`,
});
export const contactMsg = () => ({ title: 'Mensaje nuevo', body: 'Llegó un mensaje nuevo a la bandeja de contacto.', url: '/panel/contacto', tag: 'contact' });
export const fullMsg = (kind, id, title) => ({ title: 'Se llenó el cupo', body: `Ya no quedan lugares en «${title}».`, url: `/panel/inscripciones/${kind}/${id}`, tag: `full-${kind}-${id}` });
export const digestMsg = ({ confirmed = 0, waiting = 0 }) => ({
  title: 'Inscripciones nuevas',
  body: [confirmed && `${confirmed} confirmada${confirmed === 1 ? '' : 's'}`, waiting && `${waiting} en lista de espera`].filter(Boolean).join(' y ') + '.',
  url: '/panel/inscripciones', tag: 'digest',
});

// Wall-clock day and hour in Mexico City for an instant (no DST math of our own: Intl knows the rules).
export function mxLocal(now) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' }).formatToParts(now).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}
export const digestDue = (now) => mxLocal(now).hour >= DIGEST_HOUR;

// One summary per day, at the first hourly run after 8:00 Mexico City time.
// deps: { claim(day, until) -> bool (atomic, true only for the first caller of that day), since() -> Date,
//         counts(since, until) -> [{kind, status, n}], managers(kind) -> [userId], send(userIds, payload) }
export async function runDigest(now, deps) {
  if (!digestDue(now)) return { sent: 0, reason: 'early' };
  const { day } = mxLocal(now);
  const since = await deps.since();
  if (!(await deps.claim(day, now))) return { sent: 0, reason: 'already' };
  const per = new Map();
  for (const { kind, status, n } of await deps.counts(since, now)) {
    for (const uid of await deps.managers(kind)) {
      const t = per.get(uid) ?? { confirmed: 0, waiting: 0 };
      t[status === 'confirmado' ? 'confirmed' : 'waiting'] += Number(n);
      per.set(uid, t);
    }
  }
  for (const [uid, t] of per) await deps.send([uid], digestMsg(t));
  return { sent: per.size, reason: 'ok' };
}

// Cupo reached by this change (and not before): the only moment a "full" notice is due.
export const justFilled = (cupo, before, after) => cupo != null && before < cupo && after >= cupo;

// Sends to every subscription through send(sub, json). Never throws: a dead subscription (404/410) is reported
// in `gone` for deletion, anything else is just counted as failed.
export async function deliver(subs, payload, send, log = () => {}) {
  const body = JSON.stringify({ ...payload, url: String(payload.url).startsWith('/panel') ? payload.url : '/panel' });
  const gone = [];
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    if (!endpointOk(s.endpoint)) return gone.push(s.id);
    try { await send(s, body); sent++; } catch (e) {
      if (e?.statusCode === 404 || e?.statusCode === 410) gone.push(s.id); else log(`push failed (${e?.statusCode ?? e?.code ?? e?.message})`);
    }
  }));
  return { sent, gone };
}
