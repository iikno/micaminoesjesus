import { createHmac, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { config } from '../config.js';
import { one, q } from '../db.js';

export const COOKIE = 'mcj_sid';
const IDLE_MS = 8 * 3600e3;
const MAX_MS = 30 * 24 * 3600e3;

// Keyed hash: tokens and session ids are stored hashed, so a DB leak yields nothing usable.
export const hash = (v) => createHmac('sha256', config.SESSION_SECRET).update(v).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

export const hashPassword = (pw) => argon2.hash(pw, { type: argon2.argon2id });
let dummy;
// Verifying against a fake hash keeps unknown-email logins as slow as real ones.
export async function verifyPassword(stored, pw) {
  if (!stored) {
    dummy ??= await hashPassword('dummy-password-for-timing');
    await argon2.verify(dummy, pw);
    return false;
  }
  return argon2.verify(stored, pw);
}

export const cookieOptions = () => ({
  httpOnly: true, secure: config.secureCookies, sameSite: 'lax', path: '/', maxAge: MAX_MS / 1000,
});

export async function createSession(reply, userId, ip) {
  const raw = newToken();
  const now = new Date();
  await q('INSERT INTO sessions (id, user_id, created_at, last_seen_at, ip) VALUES (?,?,?,?,?)', [hash(raw), userId, now, now, ip]);
  reply.setCookie(COOKIE, raw, cookieOptions());
}

export async function destroySession(req, reply) {
  const raw = req.cookies[COOKIE];
  if (raw) await q('DELETE FROM sessions WHERE id = ?', [hash(raw)]);
  reply.clearCookie(COOKIE, { path: '/' });
}

// preHandler: loads req.user from the session cookie or answers 401.
export async function authenticate(req, reply) {
  const raw = req.cookies[COOKIE];
  const s = raw && await one(
    `SELECT s.id sid, s.created_at, s.last_seen_at, u.id, u.email, u.name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND u.status = 'active'`, [hash(raw)]);
  const now = Date.now();
  if (!s || now - new Date(s.last_seen_at) > IDLE_MS || now - new Date(s.created_at) > MAX_MS) {
    if (s) await q('DELETE FROM sessions WHERE id = ?', [s.sid]);
    return reply.code(401).send({ error: 'unauthenticated' });
  }
  if (now - new Date(s.last_seen_at) > 60e3) await q('UPDATE sessions SET last_seen_at = ? WHERE id = ?', [new Date(), s.sid]);
  req.user = { id: Number(s.id), email: s.email, name: s.name, role: s.role };
}

// CSRF: SameSite=Lax plus a custom header (browsers cannot add it cross-site without a CORS preflight,
// and we send no CORS headers) plus an Origin allow-list for browsers that do send Origin.
export async function csrf(req, reply) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return;
  const origin = req.headers.origin;
  if (req.headers['x-requested-with'] !== 'mcj' || (origin && !config.allowedOrigins.includes(origin))) {
    return reply.code(403).send({ error: 'csrf' });
  }
}
