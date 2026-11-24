import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { injectPanel, isPanelPath } from '../lib/pwa.js';
import * as P from '../lib/push.js';
import { detectEnv } from '../../src/panel/env.js';

const root = new URL('../../', import.meta.url);
const ENV = { NODE_ENV: 'development', DB_HOST: 'x', DB_USER: 'x', DB_PASS: 'x', DB_NAME: 'x', MAIL_DISABLED: '1', SESSION_SECRET: 'a'.repeat(32) };

test('endpoint: only https push services on the standard port, no credentials (SSRF guard)', () => {
  for (const ok of ['https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/abc', 'https://wns2-par02p.notify.windows.com/w/?token=x', 'https://web.push.apple.com/QAb']) assert.equal(P.endpointOk(ok), true, ok);
  for (const bad of ['http://fcm.googleapis.com/x', 'https://127.0.0.1/x', 'https://localhost/x', 'https://evilfcm.googleapis.com.attacker.io/x', 'https://notfcm.googleapis.com.evil.com/', 'https://fcm.googleapis.com:8443/x', 'https://u:p@fcm.googleapis.com/x', 'https://169.254.169.254/latest', 'ftp://fcm.googleapis.com/x', 'javascript:alert(1)', '', null, 'https://fcm.googleapis.com/' + 'a'.repeat(1000)]) assert.equal(P.endpointOk(bad), false, String(bad));
});

test('recipients follow the existing permissions', () => {
  assert.deepEqual(P.approverRolesOf('retreats'), ['admin', 'asesor']);
  assert.deepEqual(P.approverRolesOf('pilgrimages'), ['admin', 'asesor']);
  assert.deepEqual(P.managerRolesOf('session'), ['admin', 'pastoral']); // asesor only reads
  assert.deepEqual(P.managerRolesOf('pilgrimage'), ['admin', 'peregrinacion']);
  assert.deepEqual(P.inboxRoles(), ['admin']);
});

test('texts carry no names or message content and always open /panel URLs', () => {
  const all = [P.submittedMsg('team'), P.decisionMsg('sessions', 7, true), P.decisionMsg('retreats', 3, false), P.contactMsg(), P.fullMsg('session', 4, 'Retiro de Pascua'), P.digestMsg({ confirmed: 1, waiting: 2 })];
  for (const m of all) { assert.ok(m.url.startsWith('/panel'), m.url); assert.ok(m.title && m.body); }
  assert.equal(P.submittedMsg('sessions').body, 'Una fecha está en revisión.');
  assert.equal(P.submittedMsg('retreats').body, 'Un retiro está en revisión.');
  assert.equal(P.decisionMsg('pilgrimages', 2, true).body, 'Tu peregrinación fue aprobada.');
  assert.equal(P.decisionMsg('retreats', 3, false).url, '/panel/retiros/3');
  assert.equal(P.fullMsg('pilgrimage', 9, 'X').url, '/panel/inscripciones/pilgrimage/9');
  assert.equal(P.digestMsg({ confirmed: 1, waiting: 2 }).body, '1 confirmada y 2 en lista de espera.');
  assert.equal(P.digestMsg({ confirmed: 3 }).body, '3 confirmadas.');
});

test('deliver: 404/410 are reported for deletion, other errors never throw, a foreign URL becomes /panel', async () => {
  const subs = [1, 2, 3, 4, 5].map((id) => ({ id, endpoint: 'https://fcm.googleapis.com/fcm/send/' + id }));
  subs.push({ id: 6, endpoint: 'https://internal.example/x' });
  const bodies = [];
  const send = async (s, body) => {
    bodies.push(JSON.parse(body));
    if (s.id === 2) throw Object.assign(new Error('gone'), { statusCode: 410 });
    if (s.id === 3) throw Object.assign(new Error('nf'), { statusCode: 404 });
    if (s.id === 4) throw Object.assign(new Error('boom'), { statusCode: 500 });
    if (s.id === 5) throw new Error('timeout');
  };
  const logs = [];
  const r = await P.deliver(subs, { title: 't', body: 'b', url: 'https://evil.com/x' }, send, (m) => logs.push(m));
  assert.equal(r.sent, 1);
  assert.deepEqual(r.gone.sort(), [2, 3, 6]); // 410, 404 and the endpoint that is not a push service
  assert.equal(logs.length, 2);
  assert.ok(bodies.every((b) => b.url === '/panel'));
});

test('without VAPID keys nothing is sent and nothing fails; one key alone is a config error', async () => {
  Object.assign(process.env, ENV);
  delete process.env.VAPID_PUBLIC_KEY; delete process.env.VAPID_PRIVATE_KEY;
  const { parseConfig } = await import('../config.js');
  assert.equal(parseConfig(ENV).pushEnabled, false);
  assert.throws(() => parseConfig({ ...ENV, VAPID_PUBLIC_KEY: 'k' }), /VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY go together/);
  assert.equal(parseConfig({ ...ENV, VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b' }).pushEnabled, true);
  const svc = await import('../lib/pushsvc.js');
  assert.equal(await svc.pushToUsers([1, 2], { title: 't', body: 'b', url: '/panel' }), 0); // returns before touching the DB
  assert.deepEqual(await svc.pushFull('session', 1, 'X'), 0);
  assert.deepEqual(await svc.runDailyDigest(new Date('2026-06-01T20:00:00Z')), { sent: 0, reason: 'off' });
});

test('time zone: 8:00 in Mexico City is 14:00 UTC; the day is the Mexico City day', () => {
  assert.deepEqual(P.mxLocal(new Date('2026-06-01T13:59:00Z')), { day: '2026-06-01', hour: 7 });
  assert.deepEqual(P.mxLocal(new Date('2026-06-01T14:00:00Z')), { day: '2026-06-01', hour: 8 });
  assert.deepEqual(P.mxLocal(new Date('2026-06-02T05:30:00Z')), { day: '2026-06-01', hour: 23 }); // still the previous day there
  assert.equal(P.digestDue(new Date('2026-12-01T13:59:00Z')), false); // no DST in Mexico: same offset in winter
  assert.equal(P.digestDue(new Date('2026-12-01T14:00:00Z')), true);
});

function fakeDigest(counts, managers = { session: [10, 11], pilgrimage: [11, 12] }) {
  const days = new Map(), sent = [];
  return {
    days, sent,
    deps: {
      since: async () => new Date(Math.max(0, ...days.values()) || '2026-05-31T14:00:00Z'),
      claim: async (day, until) => (days.has(day) ? false : (days.set(day, +until), true)), // the primary key of push_digests
      counts: async () => counts,
      managers: async (k) => managers[k],
      send: async (ids, p) => sent.push([ids, p]),
    },
  };
}

test('daily summary: one per day at 8:00 Mexico time, even if the job runs again or on another instance', async () => {
  const f = fakeDigest([{ kind: 'session', status: 'confirmado', n: 2 }, { kind: 'pilgrimage', status: 'lista_espera', n: 1 }]);
  assert.equal((await P.runDigest(new Date('2026-06-01T13:00:00Z'), f.deps)).reason, 'early'); // 7:00 there
  assert.equal(f.sent.length, 0);
  assert.equal((await P.runDigest(new Date('2026-06-01T14:05:00Z'), f.deps)).sent, 3);
  const byUser = Object.fromEntries(f.sent.map(([[id], p]) => [id, p.body]));
  assert.equal(byUser[10], '2 confirmadas.'); // pastoral: sessions only
  assert.equal(byUser[12], '1 en lista de espera.'); // peregrinacion: pilgrimages only
  assert.equal(byUser[11], '2 confirmadas y 1 en lista de espera.'); // manages both
  for (const t of ['2026-06-01T15:05:00Z', '2026-06-01T14:05:00Z', '2026-06-02T04:00:00Z']) assert.equal((await P.runDigest(new Date(t), f.deps)).reason, 'already', t); // restart / second replica / 22:00 local
  assert.equal(f.sent.length, 3);
  assert.equal((await P.runDigest(new Date('2026-06-02T14:05:00Z'), f.deps)).sent, 3); // next day again
});

test('daily summary: nothing new means nothing sent, but the day is still taken', async () => {
  const f = fakeDigest([]);
  assert.deepEqual(await P.runDigest(new Date('2026-06-01T15:00:00Z'), f.deps), { sent: 0, reason: 'ok' });
  assert.equal(f.sent.length, 0);
  assert.equal(f.days.size, 1);
});

test('cupo full: only when this change reaches it, not on waitlist joins or while already full', () => {
  assert.equal(P.justFilled(25, 24, 25), true);
  assert.equal(P.justFilled(25, 25, 25), false); // someone joins the waitlist, or a cancel is refilled at once
  assert.equal(P.justFilled(25, 25, 24), false);
  assert.equal(P.justFilled(25, 24, 24), false);
  assert.equal(P.justFilled(25, 24, 25), true); // freed (24) and refilled: notifies again
  assert.equal(P.justFilled(null, 0, 99), false);
  assert.equal(P.justFilled(0, 0, 0), false);
});

test('only the panel gets the manifest and iOS tags; public pages are untouched', () => {
  assert.equal(isPanelPath('/panel'), true);
  assert.equal(isPanelPath('/panel/login'), true);
  for (const p of ['/', '/en', '/panelx', '/proyectos/x', '/en/panel']) assert.equal(isPanelPath(p), false, p);
  const html = '<html><head><title>x</title></head><body></body></html>';
  const out = injectPanel(html);
  assert.match(out, /<link rel="manifest" href="\/panel\/manifest\.webmanifest"/);
  assert.match(out, /apple-touch-icon/);
  assert.match(out, /apple-mobile-web-app-capable/);
  assert.ok(out.indexOf('manifest') < out.indexOf('</head>'));
  assert.doesNotMatch(readFileSync(new URL('index.html', root), 'utf8'), /manifest|apple-touch|apple-mobile/); // the source page stays plain
});

test('manifest: everything lives under /panel and the icon files exist', () => {
  const m = JSON.parse(readFileSync(new URL('public/panel/manifest.webmanifest', root), 'utf8'));
  assert.equal(m.name, 'MCJ Panel'); assert.equal(m.short_name, 'MCJ Panel'); assert.equal(m.lang, 'es-MX'); assert.equal(m.display, 'standalone');
  for (const u of [m.id, m.start_url, m.scope]) assert.match(u, /^\/panel\/?$/);
  assert.ok(m.icons.some((i) => i.sizes === '192x192') && m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any') && m.icons.some((i) => i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(existsSync(new URL(`public${i.src}`, root)), i.src);
  assert.ok(existsSync(new URL('public/panel/icons/apple-touch-icon.png', root)));
});

// Runs the real sw.js with a stub `self` and returns the listeners it registered.
function loadSW() {
  const on = {}, opened = [], shown = [];
  const self = {
    location: { origin: 'https://mcj.test' }, skipWaiting() {}, clients: { claim: async () => {}, matchAll: async () => [], openWindow: async (u) => opened.push(u) },
    registration: { showNotification: async (t, o) => shown.push([t, o]) }, addEventListener: (n, f) => { on[n] = f; },
  };
  vm.runInNewContext(readFileSync(new URL('public/panel/sw.js', root), 'utf8'), { self, URL, Response, fetch: async () => { throw new Error('offline'); } });
  return { on, opened, shown };
}

test('service worker: leaves /api and assets alone, shows an offline page for panel pages, caches nothing', async () => {
  const src = readFileSync(new URL('public/panel/sw.js', root), 'utf8');
  assert.doesNotMatch(src, /\bcaches\b|CacheStorage|\.put\(|\.addAll\(/);
  const { on } = loadSW();
  for (const mode of ['cors', 'same-origin', 'no-cors']) {
    let hijacked = false;
    on.fetch({ request: { mode, url: 'https://mcj.test/api/admin/registrations' }, respondWith: () => { hijacked = true; } });
    assert.equal(hijacked, false, mode);
  }
  let res;
  on.fetch({ request: { mode: 'navigate', url: 'https://mcj.test/panel/mas' }, respondWith: (p) => { res = p; } });
  const r = await res;
  assert.equal(r.status, 503);
  assert.match(await r.text(), /No hay conexión/);
});

test('service worker: push shows a notification; tapping opens only /panel URLs', async () => {
  const { on, opened, shown } = loadSW();
  let p;
  on.push({ data: { json: () => ({ title: 'Hola', body: 'Algo', url: '/panel/revision', tag: 'review' }) }, waitUntil: (x) => { p = x; } });
  await p;
  assert.equal(shown[0][0], 'Hola'); assert.equal(shown[0][1].data.url, '/panel/revision');
  on.push({ data: null, waitUntil: (x) => { p = x; } }); // no payload: still must show something
  await p;
  assert.equal(shown.length, 2);
  for (const [url, want] of [['/panel/inscripciones/session/4', '/panel/inscripciones/session/4'], ['https://evil.com/panel', '/panel'], ['/api/admin/users', '/panel'], ['/', '/panel']]) {
    on.push({ data: { json: () => ({ title: 't', url }) }, waitUntil: (x) => { p = x; } });
    await p;
    const n = shown.at(-1)[1];
    let click;
    on.notificationclick({ notification: { close() {}, data: n.data }, waitUntil: (x) => { click = x; } });
    await click;
    assert.equal(opened.at(-1), want, url);
  }
});

test('device detection: iPhone Safari vs in-app browsers vs Android', () => {
  const safari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
  const insta = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0';
  const webview = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
  const chromeIos = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1';
  const droid = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
  const droidWv = 'Mozilla/5.0 (Linux; Android 14; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36';
  assert.deepEqual(detectEnv(safari), { ios: true, android: false, inApp: false, standalone: false });
  assert.equal(detectEnv(chromeIos).inApp, false);
  assert.equal(detectEnv(insta).inApp, true);
  assert.equal(detectEnv(webview).inApp, true);
  assert.equal(detectEnv(droid).android, true);
  assert.equal(detectEnv(droid).inApp, false);
  assert.equal(detectEnv(droidWv).inApp, true);
  assert.equal(detectEnv(safari, { standalone: true }).standalone, true);
  assert.equal(detectEnv('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17 Safari/605.1.15', { platform: 'MacIntel', touch: 5 }).ios, true); // iPad
  assert.equal(detectEnv('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17 Safari/605.1.15', { platform: 'MacIntel', touch: 0 }).ios, false);
});

test('migration 009: unique device, cascade with the user, one summary per day', () => {
  const sql = readFileSync(new URL('server/migrations/009_push.sql', root), 'utf8');
  assert.match(sql, /UNIQUE KEY uq_push_endpoint \(endpoint_hash\)/);
  assert.match(sql, /REFERENCES users\(id\) ON DELETE CASCADE/);
  assert.match(sql, /day DATE NOT NULL PRIMARY KEY/);
});
