// Images are either an uploaded media URL ('/uploads/...') or, until an editor replaces them, a bundled file name
// from the original static site ('retiro-golgota.webp'). The glob only maps names to hashed asset URLs; it adds no image data to the JS.
const bundled = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/images/**/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }))
    .map(([path, url]) => [path.split('/').pop(), url]),
);

export const imgUrl = (v) => (!v ? null : v.startsWith('/') || v.startsWith('http') ? v : bundled[v] ?? null);
