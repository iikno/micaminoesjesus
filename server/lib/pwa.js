// The panel (and only the panel) is installable: its pages get the manifest and the iOS tags in <head>.
// Done on the server so iOS reads them at "Agregar a inicio" and the public pages stay exactly as they were.
export const isPanelPath = (pathname) => pathname === '/panel' || pathname.startsWith('/panel/');

const TAGS = [
  '<link rel="manifest" href="/panel/manifest.webmanifest" />',
  '<link rel="apple-touch-icon" href="/panel/icons/apple-touch-icon.png" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-title" content="MCJ Panel" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="theme-color" content="#14293A" />',
].join('\n    ');

export const injectPanel = (html) => html.replace('</head>', () => `    ${TAGS}\n  </head>`);
