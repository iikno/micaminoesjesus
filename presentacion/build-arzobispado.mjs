// Genera los dos PDF del Arzobispado desde mcj-arzobispado.html (un solo contenido, dos formatos).
// Uso: node presentacion/build-arzobispado.mjs [phone|carta]   (sin argumento: ambos)
// Requiere Edge/Chrome (var CHROME para otra ruta). Las fuentes Space Grotesk y Manrope se incrustan desde
// FONTS_DIR (por defecto la carpeta de fuentes del usuario en Windows); si no están, se usa Google Fonts.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const chrome = process.env.CHROME || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const fontsDir = process.env.FONTS_DIR || path.join(process.env.LOCALAPPDATA || '', 'Microsoft/Windows/Fonts');
const FORMATS = {
  phone: { page: '@page{size:540px 960px;margin:0}', out: 'MCJ-Presentacion-Arzobispado.pdf' },
  carta: { page: '@page{size:8.5in 11in;margin:0}', out: 'MCJ-Presentacion-Arzobispado-Carta.pdf' },
};
const FONT_FILES = [['Space Grotesk', 500, 'SpaceGrotesk-Medium'], ['Space Grotesk', 700, 'SpaceGrotesk-Bold'],
  ['Manrope', 400, 'Manrope-Regular'], ['Manrope', 500, 'Manrope-Medium'], ['Manrope', 600, 'Manrope-SemiBold'], ['Manrope', 700, 'Manrope-Bold'], ['Manrope', 800, 'Manrope-ExtraBold']];
const localFonts = FONT_FILES.every(([, , f]) => fs.existsSync(path.join(fontsDir, f + '.ttf')));
const fontCss = localFonts
  ? FONT_FILES.map(([fam, w, f]) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('${pathToFileURL(path.join(fontsDir, f + '.ttf'))}')}`).join('')
  : '';

const src = fs.readFileSync(path.join(here, 'mcj-arzobispado.html'), 'utf8');
const wanted = process.argv[2] ? [process.argv[2]] : Object.keys(FORMATS);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcj-'));
for (const name of wanted) {
  const f = FORMATS[name];
  if (!f) throw new Error('formato: phone | carta');
  let html = src
    // presentacion/assets es un symlink de git (en Windows queda como archivo de texto): se apunta directo a src/assets.
    .replace(/(["'(])assets\//g, '$1../src/assets/')
    .replace('<body>', `<body class="${name}">`)
    .replace('</style>', `${f.page}${fontCss}</style>`)
    .replace('<head>', `<head><base href="${pathToFileURL(here)}/">`);
  if (localFonts) html = html.replace(/<link href="https:\/\/fonts\.googleapis[^>]*>/, '');
  const file = path.join(tmp, name + '.html');
  fs.writeFileSync(file, html);
  const out = path.join(here, f.out);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer', '--virtual-time-budget=20000', `--print-to-pdf=${out}`, pathToFileURL(file).href], { stdio: 'inherit' });
  console.log(name, '->', out, '| fuentes locales:', localFonts);
}
fs.rmSync(tmp, { recursive: true, force: true });
