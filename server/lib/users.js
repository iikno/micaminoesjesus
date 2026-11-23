import { config } from '../config.js';
import { hash, newToken } from './auth.js';
import { trySend } from './mailer.js';

const DAY = 24 * 3600e3;

// kind 'invite' lives 7 days, 'reset' 1 hour. Older unused tokens of the same kind are revoked.
export async function issueToken(c, userId, kind) {
  const raw = newToken();
  const ttl = kind === 'reset' ? 3600e3 : 7 * DAY;
  await c.q('UPDATE tokens SET used_at = ? WHERE user_id = ? AND kind = ? AND used_at IS NULL', [new Date(), userId, kind]);
  await c.q('INSERT INTO tokens (user_id, kind, token_hash, expires_at) VALUES (?,?,?,?)', [userId, kind, hash(raw), new Date(Date.now() + ttl)]);
  return raw;
}

export const linkFor = (kind, token) =>
  `${config.PUBLIC_URL}/panel/${kind === 'reset' ? 'restablecer' : 'invitacion'}?token=${token}`;

// Creates (or re-invites a still-invited) user and mails the set-password link.
// Returns the link so the CLI can print it when mail is disabled or failed.
export async function inviteUser(c, { email, name, role }) {
  let user = await c.one('SELECT id, status FROM users WHERE email = ?', [email]);
  if (user && user.status !== 'invited') return { exists: true };
  if (!user) {
    const r = await c.q('INSERT INTO users (email, name, role) VALUES (?,?,?)', [email, name, role]);
    user = { id: r.insertId };
  } else {
    await c.q('UPDATE users SET name = ?, role = ? WHERE id = ?', [name, role, user.id]);
  }
  const link = linkFor('invite', await issueToken(c, user.id, 'invite'));
  const sent = await trySend({
    to: email, subject: 'Invitación al panel de Mi Camino es Jesús',
    text: `Hola ${name},\n\nFuiste invitado al panel de Mi Camino es Jesús. Crea tu contraseña (mínimo 6 caracteres) en este enlace, válido 7 días:\n\n${link}\n`,
  });
  return { id: user.id, link, sent };
}
