// Service worker of the panel (scope /panel). It stores NOTHING: no /api answers, no personal data, no HTML
// (so a deploy is never masked by an old page). It only (1) shows push notifications, (2) opens the right screen
// on tap and (3) shows a kind "sin conexión" page when a panel page cannot be fetched.
const OFFLINE = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión · MCJ Panel</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#FAF6EF;color:#14293A;font:18px/1.5 system-ui,sans-serif;text-align:center}
main{max-width:26rem}h1{font-size:1.5rem}button{min-height:56px;padding:0 28px;border:0;border-radius:8px;background:#14293A;color:#FAF6EF;font:inherit;font-weight:700}</style></head>
<body><main><h1>No hay conexión</h1><p>No pudimos abrir el panel. Revisa tu internet y vuelve a intentarlo. Tu trabajo guardado sigue a salvo.</p>
<button onclick="location.reload()">Reintentar</button></main></body></html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Pages only. Everything else (assets, /api) goes straight to the network untouched.
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })));
});

// Only paths under /panel on this origin are ever opened.
const safeUrl = (raw) => {
  try {
    const u = new URL(raw, self.location.origin);
    return u.origin === self.location.origin && (u.pathname === '/panel' || u.pathname.startsWith('/panel/')) ? u.pathname + u.search : '/panel';
  } catch { return '/panel'; }
};

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
  const url = safeUrl(e.notification.data?.url);
  e.waitUntil((async () => {
    for (const c of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
      if (new URL(c.url).pathname.startsWith('/panel')) {
        try { await c.focus(); await c.navigate(url); return; } catch { /* fall through to a new window */ }
      }
    }
    await self.clients.openWindow(url);
  })());
});
