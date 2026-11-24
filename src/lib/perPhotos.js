// Peregrinos photos: optimized copies in src/assets/peregrinos-web (sorted by file name: 1-…, 2-…). Card i uses photo i;
// a missing photo falls back to a tinted tile with the PER logo (see PerPillars).
export const PER_PHOTOS = Object.entries(
  import.meta.glob('../assets/peregrinos-web/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }),
).sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url);
