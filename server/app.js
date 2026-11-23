import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import Fastify from 'fastify';
import { ZodError } from 'zod';
import { config } from './config.js';
import { one } from './db.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';

export async function buildApp() {
  // Behind Coolify's Traefik the real client IP is in X-Forwarded-For (needed for rate limits and audit).
  const app = Fastify({ logger: { level: config.isProd ? 'info' : 'debug', redact: ['req.headers.cookie', 'req.headers.authorization'] }, trustProxy: config.isProd, bodyLimit: 2 * 1024 * 1024 });

  await app.register(helmet, {
    contentSecurityPolicy: { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ['https://fonts.gstatic.com'],
      frameAncestors: ["'none'"], objectSrc: ["'none'"], upgradeInsecureRequests: config.secureCookies ? [] : null,
    } },
  });
  await app.register(cookie);
  await app.register(rateLimit, { global: false });

  // Same as the default JSON parser, except an empty body is {} (logout/approve send no payload).
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      done(null, body ? JSON.parse(body) : {});
    } catch {
      done(Object.assign(new Error('invalid_json'), { statusCode: 400 }));
    }
  });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) return reply.code(400).send({ error: 'validation', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
    if (err.status && err.status < 500) return reply.code(err.status).send({ error: err.message });
    if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ error: err.code ?? err.message });
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: 'duplicate' });
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') return reply.code(409).send({ error: 'reference_conflict' });
    req.log.error(err);
    return reply.code(500).send({ error: 'internal' });
  });

  app.get('/api/health', async (req, reply) => {
    try {
      await one('SELECT 1');
      return { ok: true };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });
  await app.register(authRoutes);
  await app.register(adminRoutes);
  await app.register(publicRoutes);

  const uploads = resolve(config.UPLOAD_DIR);
  mkdirSync(uploads, { recursive: true });
  await app.register(staticFiles, { root: uploads, prefix: '/uploads/', decorateReply: false, maxAge: '7d', immutable: true });

  // The built SPA, with fallback to index.html for client-side routes. Skipped if there is no build (API-only dev).
  const dist = resolve(config.DIST_DIR);
  if (existsSync(dist)) {
    await app.register(staticFiles, { root: dist, prefix: '/', wildcard: false, maxAge: '1h' });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api/') || (req.method !== 'GET' && req.method !== 'HEAD')) return reply.code(404).send({ error: 'not_found' });
      return reply.header('Cache-Control', 'no-cache').sendFile('index.html');
    });
  }
  return app;
}
