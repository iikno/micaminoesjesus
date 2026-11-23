import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import Fastify from 'fastify';
import { ZodError } from 'zod';
import { config } from './config.js';
import { TranslateError } from './lib/translate.js';
import { one } from './db.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import regPublicRoutes from './routes/regpublic.js';
import seoRoutes, { renderPage } from './routes/seo.js';

export async function buildApp() {
  // Behind Coolify's Traefik the real client IP is in X-Forwarded-For (needed for rate limits and audit).
  const app = Fastify({ logger: { level: config.isProd ? 'info' : 'debug', redact: ['req.headers.cookie', 'req.headers.authorization'] }, trustProxy: config.isProd, bodyLimit: 2 * 1024 * 1024 });

  await app.register(helmet, {
    contentSecurityPolicy: { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'", 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'], frameSrc: ['https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"],
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
    if (err instanceof TranslateError) return reply.code(err.status).send({ error: err.message });
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
  await app.register(regPublicRoutes);
  await app.register(seoRoutes);

  // Only uploads/pub is public; photos flagged has_minors live in uploads/private and are never served from here.
  const uploads = join(resolve(config.uploadsDir), 'pub');
  mkdirSync(uploads, { recursive: true });
  // Names are random per upload and never reused, so they can be cached for a year.
  await app.register(staticFiles, { root: uploads, prefix: '/uploads/', decorateReply: false, maxAge: '365d', immutable: true, index: false });

  // The built SPA, with fallback to index.html for client-side routes. Skipped if there is no build (API-only dev).
  const dist = resolve(config.DIST_DIR);
  if (existsSync(dist)) {
    await app.register(staticFiles, {
      root: dist, prefix: '/', wildcard: false, maxAge: '1h', index: false, // '/' goes through renderPage below
      // Vite hashes everything under /assets, so it can be cached for a year; index.html must always be revalidated.
      setHeaders: (res, path) => res.header('Cache-Control', /[\/]assets[\/]/.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache'),
    });
    const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');
    app.setNotFoundHandler(async (req, reply) => {
      if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/') || (req.method !== 'GET' && req.method !== 'HEAD')) return reply.code(404).send({ error: 'not_found' });
      const { status, html } = await renderPage(req.url, indexHtml);
      return reply.code(status).type('text/html; charset=utf-8').header('Cache-Control', 'no-cache').send(html);
    });
  }
  return app;
}
