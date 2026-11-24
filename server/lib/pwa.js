// The panel (and only the panel) is installable: its pages get the manifest and the iOS tags in <head>.
// Done on the server so iOS reads them at "Agregar a inicio" and the public pages stay exactly as they were.
export const isPanelPath = (pathname) => pathname === '/panel' || pathname.startsWith('/panel/');

// Request hostname (no port; Fastify already honors X-Forwarded-Host behind the proxy) is the panel's.
export const isPanelHost = (hostname, panelUrl) => String(hostname).toLowerCase() === new URL(panelUrl).hostname;

// Old /panel/... URLs (bookmarks, mails, pushes) -> the same path on the panel host, query kept (invitation/reset tokens).
// Built on the fixed panel origin, so '/panel//evil.com' stays a path of ours, never a host.
export function panelRedirect(url, panelUrl) {
  const i = url.indexOf('?');
  const pathname = i < 0 ? url : url.slice(0, i);
  if (!isPanelPath(pathname)) return null;
  return `${panelUrl}/${pathname.slice('/panel'.length).replace(/^[/\\]+/, '')}${i < 0 ? '' : url.slice(i)}`;
}

const TAGS = [
  '<link rel="manifest" href="/panel/manifest.webmanifest" />',
  '<link rel="apple-touch-icon" href="/panel/icons/apple-touch-icon.png" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-title" content="MCJ Panel" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="theme-color" content="#FAF6EF" />',
].join('\n    ');

export const injectPanel = (html) => html.replace('</head>', () => `    ${TAGS}\n  </head>`);
