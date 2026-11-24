import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const tmp = mkdtempSync(join(tmpdir(), 'mcj-'));
mkdirSync(join(tmp, 'dist', 'panel'), { recursive: true });
writeFileSync(join(tmp, 'dist', 'index.html'), '<!doctype html><html lang="es"><head><title>x</title></head><body></body></html>');
writeFileSync(join(tmp, 'dist', 'panel', 'sw.js'), '// sw');
const ENV = { NODE_ENV: 'test', PUBLIC_URL: 'https://micaminoesjesus.org', DB_HOST: 'x', DB_USER: 'x', DB_PASS: 'x', DB_NAME: 'x', MAIL_DISABLED: '1', SESSION_SECRET: 'a'.repeat(32), DIST_DIR: join(tmp, 'dist'), UPLOADS_DIR: join(tmp, 'up') };
Object.assign(process.env, ENV);
const { parseConfig, config } = await import('../config.js');
const { buildApp } = await import('../app.js');
const { csrf } = await import('../lib/auth.js');
const { panelRedirect, isPanelHost } = await import('../lib/pwa.js');
const { linkFor } = await import('../lib/users.js');

test('panelUrl derives from PUBLIC_URL: www dropped, port kept, localhost -> panel.localhost', () => {
  const p = (PUBLIC_URL, NODE_ENV = 'development') => parseConfig({ ...ENV, NODE_ENV, PUBLIC_URL });
  assert.equal(p('https://micaminoesjesus.org').panelUrl, 'https://panel.micaminoesjesus.org');
  assert.equal(p('https://www.micaminoesjesus.org').panelUrl, 'https://panel.micaminoesjesus.org');
  assert.equal(p('http://localhost:3000').panelUrl, 'http://panel.localhost:3000');
  assert.equal(p('http://localhost:3000').allowedOrigins.includes('http://panel.localhost:5173'), true);
  const prod = parseConfig({ ...ENV, NODE_ENV: 'production', SMTP_HOST: 'h', MAIL_DISABLED: '', PUBLIC_URL: 'https://www.micaminoesjesus.org' });
  assert.deepEqual(prod.allowedOrigins.sort(), ['https://micaminoesjesus.org', 'https://panel.micaminoesjesus.org', 'https://www.micaminoesjesus.org']);
});

test('mail links point at the panel host without /panel', () => {
  assert.equal(linkFor('reset', 'T'), 'https://panel.micaminoesjesus.org/restablecer?token=T');
  assert.equal(linkFor('invite', 'T'), 'https://panel.micaminoesjesus.org/invitacion?token=T');
});

test('csrf: the panel origin and the public one pass, any other is refused', async () => {
  const run = async (origin) => {
    let code = 200;
    await csrf({ method: 'POST', headers: { 'x-requested-with': 'mcj', origin } }, { code: (c) => ({ send: () => { code = c; } }) });
    return code;
  };
  assert.equal(await run('https://panel.micaminoesjesus.org'), 200); // config.allowedOrigins, PUBLIC_URL above
  assert.equal(await run('https://micaminoesjesus.org'), 200);
  assert.equal(await run('https://evil.com'), 403);
  assert.equal(await run('https://panel.micaminoesjesus.org.evil.com'), 403);
});

test('panelRedirect keeps the path and query and can never leave the panel origin', () => {
  const to = (u) => panelRedirect(u, config.panelUrl);
  assert.equal(to('/panel'), 'https://panel.micaminoesjesus.org/');
  assert.equal(to('/panel/'), 'https://panel.micaminoesjesus.org/');
  assert.equal(to('/panel/retiros/3?x=1'), 'https://panel.micaminoesjesus.org/retiros/3?x=1');
  assert.equal(to('/panel/restablecer?token=a-b_c'), 'https://panel.micaminoesjesus.org/restablecer?token=a-b_c');
  assert.equal(to('/panelx'), null);
  assert.equal(to('/en/panel'), null);
  for (const evil of ['/panel//evil.com', '/panel///evil.com/x', '/panel/\\evil.com', '/panel//evil.com?a=//b', '/panel/%2F%2Fevil.com']) {
    assert.equal(new URL(to(evil)).origin, 'https://panel.micaminoesjesus.org', evil);
  }
  assert.equal(to('/panel//evil.com'), 'https://panel.micaminoesjesus.org/evil.com');
});

test('isPanelHost: exact, case-insensitive, no suffix tricks', () => {
  for (const [h, want] of [['panel.micaminoesjesus.org', true], ['PANEL.MicaminoEsJesus.org', true], ['micaminoesjesus.org', false], ['panel.micaminoesjesus.org.evil.com', false], ['xpanel.micaminoesjesus.org', false], ['', false]]) assert.equal(isPanelHost(h, config.panelUrl), want, h);
});

test('server by host: panel shell and robots on the panel host, redirect from /panel everywhere, public site untouched', async () => {
  const app = await buildApp();
  const get = (url, host) => app.inject({ method: 'GET', url, headers: { host } });
  const P = 'panel.micaminoesjesus.org', A = 'micaminoesjesus.org';

  for (const url of ['/', '/login', '/retiros/3', '/proyectos/x']) {
    const r = await get(url, P);
    assert.equal(r.statusCode, 200, url);
    assert.match(r.body, /manifest\.webmanifest/, url);
    assert.equal(r.headers['cache-control'], 'no-cache');
  }
  assert.doesNotMatch((await get('/', A)).body, /manifest\.webmanifest/);

  const robots = await get('/robots.txt', P);
  assert.equal(robots.body, 'User-agent: *\nDisallow: /\n');
  assert.doesNotMatch(robots.body, /Sitemap/);
  assert.equal((await get('/sitemap.xml', P)).statusCode, 404);
  assert.match((await get('/robots.txt', A)).body, /Sitemap: https:\/\/micaminoesjesus\.org\/sitemap\.xml/);

  for (const host of [A, P]) {
    const r = await get('/panel/restablecer?token=abc', host);
    assert.equal(r.statusCode, 302);
    assert.equal(r.headers.location, 'https://panel.micaminoesjesus.org/restablecer?token=abc');
    assert.equal(r.headers['cache-control'], 'no-store');
  }
  assert.equal((await get('/panel', A)).headers.location, 'https://panel.micaminoesjesus.org/');
  assert.equal((await get('/panel//evil.com', A)).headers.location, 'https://panel.micaminoesjesus.org/evil.com');

  const sw = await get('/panel/sw.js', A); // a real static file is served, not redirected
  assert.equal(sw.statusCode, 200);
  assert.equal(sw.headers['service-worker-allowed'], '/');
  await app.close();
});
