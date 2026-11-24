// Regenerates the panel's PWA icons from the color logo: `node server/cli/gen-panel-icons.js`.
// Cream square with the trimmed logo centered. Maskable: as large as fits the 80% safe circle (measured per pixel).
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const SVG = readFileSync(new URL('../../src/assets/logos/Recurso 13.svg', import.meta.url));
const OUT = new URL('../../public/panel/icons/', import.meta.url);
const CREAM = '#FAF6EF';
const SAFE = 0.8 / 2; // safe-circle radius as a fraction of the icon size

// Logo with its empty SVG margins trimmed off, rendered at the given width.
const logoAt = async (w) =>
  sharp(await sharp(SVG, { density: 600 }).trim().png().toBuffer()).resize({ width: w }).png().toBuffer();

// Farthest visible pixel from the logo's center, in px.
async function reach(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cx = info.width / 2, cy = info.height / 2;
  let max = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++)
    if (data[(y * info.width + x) * 4 + 3] > 8) max = Math.max(max, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
  return max;
}

async function icon(file, size, logoW) {
  const logo = await logoAt(logoW);
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: logo, gravity: 'center' }]).png({ compressionLevel: 9 }).toFile(new URL(file, OUT).pathname);
  const { width, height } = await sharp(logo).metadata();
  console.log(file, `logo ${width}x${height}px = ${((100 * width) / size).toFixed(1)}% of width, farthest pixel at ${((100 * (await reach(logo))) / (SAFE * size)).toFixed(1)}% of the safe radius`);
}

const WIDTH = 0.86;
await icon('icon-192.png', 192, Math.round(WIDTH * 192));
await icon('icon-512.png', 512, Math.round(WIDTH * 512));
await icon('apple-touch-icon.png', 180, Math.round(WIDTH * 180));

// Maskable: largest width whose farthest pixel stays inside the safe circle (1px margin).
let w = Math.round(0.8 * 512);
while (w > 100 && (await reach(await logoAt(w))) > SAFE * 512 - 1) w--;
await icon('maskable-512.png', 512, w);
