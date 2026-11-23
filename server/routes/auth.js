import { authenticate, createSession, csrf, destroySession, hash, hashPassword, verifyPassword } from '../lib/auth.js';
import { audit } from '../lib/audit.js';
import { afterFailure, isLocked } from '../lib/lockout.js';
import { trySend } from '../lib/mailer.js';
import { issueToken, linkFor } from '../lib/users.js';
import * as s from '../lib/schemas.js';
import { one, q, tx } from '../db.js';

const limit = (max, timeWindow = '1 minute') => ({ rateLimit: { max, timeWindow } });
const BAD = { error: 'invalid_credentials' };

// Consumes a single-use token of the given kind; returns the user id or null.
async function useToken(c, raw, kinds) {
  const t = await c.one(
    `SELECT id, user_id, kind FROM tokens WHERE token_hash = ? AND kind IN (?) AND used_at IS NULL AND expires_at > ? FOR UPDATE`,
    [hash(raw), kinds, new Date()]);
  if (!t) return null;
  await c.q('UPDATE tokens SET used_at = ? WHERE id = ?', [new Date(), t.id]);
  return t;
}

export default async function authRoutes(app) {
  app.addHook('preHandler', csrf);
  app.post('/api/auth/login', { config: limit(5) }, async (req, reply) => {
    const { email, password } = s.login.parse(req.body);
    const u = await one('SELECT * FROM users WHERE email = ?', [email]);
    const ok = await verifyPassword(u?.pass_hash, password);
    const now = new Date();
    // Same answer for unknown email, wrong password, disabled and locked accounts: no enumeration.
    if (!u || u.status !== 'active' || isLocked(u, now)) return reply.code(401).send(BAD);
    if (!ok) {
      const f = afterFailure(u, now);
      await q('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?', [f.failed_logins, f.locked_until, u.id]);
      if (f.locked_until) {
        await tx((c) => audit(c, { ip: req.ip }, 'lockout', 'users', u.id));
        await trySend({ to: u.email, subject: 'Tu cuenta fue bloqueada 15 minutos', text: 'Hubo 5 intentos fallidos de inicio de sesión. Si no fuiste tú, restablece tu contraseña.\n' });
      }
      return reply.code(401).send(BAD);
    }
    await q('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?', [u.id]);
    await destroySession(req, reply); // fresh session id on every login
    await createSession(reply, u.id, req.ip);
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    await destroySession(req, reply);
    return reply.code(204).send();
  });

  app.get('/api/auth/me', { preHandler: authenticate }, async (req) => req.user);

  // Setting the first password through the invite link is what verifies the email.
  app.post('/api/auth/accept-invite', { config: limit(10) }, async (req, reply) => {
    const { token, password } = s.setPassword.parse(req.body);
    const hashed = await hashPassword(password);
    const ok = await tx(async (c) => {
      const t = await useToken(c, token, ['invite']);
      if (!t) return false;
      await c.q("UPDATE users SET pass_hash = ?, email_verified_at = ?, status = 'active' WHERE id = ?", [hashed, new Date(), t.user_id]);
      await audit(c, { ip: req.ip }, 'accept_invite', 'users', t.user_id);
      return true;
    });
    return ok ? reply.code(204).send() : reply.code(400).send({ error: 'invalid_token' });
  });

  app.post('/api/auth/forgot', { config: limit(5) }, async (req, reply) => {
    const { email } = s.forgot.parse(req.body);
    const u = await one("SELECT id, name FROM users WHERE email = ? AND status = 'active'", [email]);
    if (u) {
      const token = await tx((c) => issueToken(c, u.id, 'reset'));
      await trySend({ to: email, subject: 'Restablecer contraseña', text: `Hola ${u.name},\n\nUsa este enlace (válido 1 hora, un solo uso):\n\n${linkFor('reset', token)}\n\nSi no lo pediste, ignora este correo.\n` });
    }
    return reply.code(202).send(); // identical answer whether or not the email exists
  });

  app.post('/api/auth/reset', { config: limit(10) }, async (req, reply) => {
    const { token, password } = s.setPassword.parse(req.body);
    const hashed = await hashPassword(password);
    const ok = await tx(async (c) => {
      const t = await useToken(c, token, ['reset']);
      if (!t) return false;
      await c.q('UPDATE users SET pass_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?', [hashed, t.user_id]);
      await c.q('DELETE FROM sessions WHERE user_id = ?', [t.user_id]); // revoke every session
      await audit(c, { ip: req.ip }, 'reset_password', 'users', t.user_id);
      return true;
    });
    return ok ? reply.code(204).send() : reply.code(400).send({ error: 'invalid_token' });
  });
}
