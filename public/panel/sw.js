// Service worker of the panel (scope / on the panel host; workers installed before the move on the apex keep scope /panel). It stores NOTHING: no /api answers, no personal data, no HTML
// (so a deploy is never masked by an old page). It only (1) shows push notifications, (2) opens the right screen
// on tap and (3) shows a kind "sin conexión" page when a panel page cannot be fetched.
const OFFLINE = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión · MCJ Panel</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#FAF6EF;color:#14293A;font:18px/1.5 system-ui,sans-serif;text-align:center}
main{max-width:26rem}h1{font-size:1.5rem}button{min-height:56px;padding:0 28px;border:0;border-radius:14px;background:#8B1E2B;color:#fff;font:inherit;font-weight:800}button:focus-visible{outline:3px solid #14293A;outline-offset:3px}</style></head>
<body><main><h1>No hay conexión</h1><p>No pudimos abrir el panel. Revisa tu internet y vuelve a intentarlo. Tu trabajo guardado sigue a salvo.</p>
<button onclick="location.reload()">Reintentar</button></main></body></html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Pages only. Everything else (assets, /api) goes straight to the network untouched.
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })));
});

// On the panel host the app lives at / (clean URLs); a worker still installed on the apex only owns /panel.
const clean = self.location.hostname.startsWith('panel.');
const isPanelPath = (p) => p === '/panel' || p.startsWith('/panel/');

// Payload URLs are always clamped to /panel/... (the server keeps that form, see lib/push.js); `target` turns one into the real URL.
const safeUrl = (raw) => {
  try {
    const u = new URL(raw, self.location.origin);
    return u.origin === self.location.origin && isPanelPath(u.pathname) ? u.pathname + u.search : '/panel';
  } catch { return '/panel'; }
};
const target = (url) => (clean ? `/${url.slice('/panel'.length).replace(/^\//, '')}` : url);

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { /* not JSON: show the generic text */ }
  // A push must always show something (browsers penalize silent pushes).
  e.waitUntil(self.registration.showNotification(String(d.title || 'MCJ Panel').slice(0, 80), {
    body: String(d.body || 'Hay novedades en el panel.').slice(0, 200), icon: '/panel/icons/icon-192.png', tag: d.tag ? String(d.tag) : undefined, data: { url: safeUrl(d.url) },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = target(safeUrl(e.notification.data?.url));
  e.waitUntil((async () => {
    // matchAll only returns this origin's windows: on the panel host any of them is the panel; on the apex only /panel ones.
    for (const c of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
      if (clean || isPanelPath(new URL(c.url).pathname)) {
        let focused = false;
        // Old apex worker: /panel redirects to the panel host, so navigate() may reject although the window did go there. Do not open a second one.
        try { await c.focus(); focused = true; await c.navigate(url); return; } catch { if (focused && !clean) return; }
      }
    }
    await self.clients.openWindow(url);
  })());
});
