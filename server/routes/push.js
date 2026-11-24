// Panel push subscriptions. Registered inside adminRoutes, so CSRF/Origin and authentication already apply.
import { z } from 'zod';
import { config } from '../config.js';
import { q, tx } from '../db.js';
import { MAX_PER_USER, endpointOk } from '../lib/push.js';
import { hashEndpoint } from '../lib/pushsvc.js';

const limit = (max) => ({ rateLimit: { max, timeWindow: '1 minute' } });
const b64 = z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/);
const sub = z.object({ endpoint: z.string().refine(endpointOk, 'bad_endpoint'), keys: z.object({ p256dh: b64.max(255), auth: b64.max(100) }) });

export default async function pushRoutes(app) {
  // enabled=false: no VAPID keys on the server, the panel then offers no avisos at all.
  app.get('/api/admin/push/key', { config: limit(60) }, async () => ({ enabled: config.pushEnabled, key: config.pushEnabled ? config.VAPID_PUBLIC_KEY : null }));

  // Idempotent: also used by the panel to re-attach this device to whoever is signed in now.
  app.post('/api/admin/push/subscribe', { config: limit(30) }, async (req, reply) => {
    if (!config.pushEnabled) return reply.code(503).send({ error: 'push_disabled' });
    const { endpoint, keys } = sub.parse(req.body);
    const h = hashEndpoint(endpoint);
    await tx(async (c) => {
      // The same device signing in as someone else takes the row over (unique endpoint_hash).
      await c.q(`INSERT INTO push_subscriptions (user_id, endpoint_hash, endpoint, p256dh, auth, user_agent) VALUES (?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth), user_agent = VALUES(user_agent)`,
      [req.user.id, h, endpoint, keys.p256dh, keys.auth, String(req.headers['user-agent'] ?? '').slice(0, 160) || null]);
      // Cap per person: the oldest devices make room (they are usually stale phones).
      const old = await c.q('SELECT id FROM push_subscriptions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 18446744073709551615 OFFSET ?', [req.user.id, MAX_PER_USER]);
      if (old.length) await c.q('DELETE FROM push_subscriptions WHERE id IN (?)', [old.map((r) => r.id)]);
    });
    return reply.code(204).send();
  });

  // Only the signed-in user's own row for that device.
  app.post('/api/admin/push/unsubscribe', { config: limit(30) }, async (req, reply) => {
    const { endpoint } = z.object({ endpoint: z.string().max(1000) }).parse(req.body);
    await q('DELETE FROM push_subscriptions WHERE endpoint_hash = ? AND user_id = ?', [hashEndpoint(endpoint), req.user.id]);
    return reply.code(204).send();
  });
}
