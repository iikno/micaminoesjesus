// Genera MCJ-Presentacion-Equipo.pptx (vertical 9:16) con transiciones y animaciones nativas.
// Uso: NODE_PATH=<carpeta con pptxgenjs y jszip> node presentacion/build-pptx.cjs
// Unidades de diseño: puntos (1 pt = 1/72"). Lámina = 540 x 960 pt (7.5" x 13.333").
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');

const HERE = __dirname;
const ASSETS = path.join(HERE, '../src/assets');
const OUT = path.join(HERE, 'MCJ-Presentacion-Equipo.pptx');
const img = (p) => path.join(ASSETS, p);
const I = (pt) => pt / 72;

// ---------------- Paleta de marca ----------------
const HEX = {
  ink: '14293A', ink2: '0E1F2C', red: '8B1E2B', gold: 'C79A2B', cream: 'F3E4BB',
  bg: 'FAF6EF', bgAlt: 'F1ECE0', white: 'FFFFFF', gray: '6B6B6B', green: '3F7D4D',
  adviento: '4B3F72', cuaresma: '7A2E4D', pascua: '8A6403', pentecostes: 'C1272D', ordinario: '3F7D4D',
  inkSoft: '22394B', line: 'D9D2C3',
};
const FONT_H = 'Arial';
const FONT_B = 'Arial';

// ---------------- Plan del equipo (fechas y responsables confirmados) ----------------
const PLAN = {
  'Levántate y Sé Hombre': 'Feb 2027 · 2ª ed.',
  'Sansón': 'Abr–May 2027',
  'Fuiste Hecha Mujer': 'Piloto ene · Mar 2027',
  'Barrabás': 'Semana Santa 2027',
  'El Arca de Noé: Refugio Seguro': 'Fin dic · Angélica',
  'Esclava del Señor': 'Fin ene · Maribel',
};

(async () => {
  // ---------------- Datos del catálogo ----------------
  const src = fs.readFileSync(path.join(HERE, '../src/data/retreats.js'), 'utf8');
  const stubs = [...src.matchAll(/^import (\w+) from .*$/gm)].map((m) => `const ${m[1]} = null;`).join('\n');
  const code = stubs + '\n' + src.replace(/^import .*$/gm, '');
  const { retreats, DEREJ, CORTES_SIMJA } = await import('data:text/javascript,' + encodeURIComponent(code));

  const READY = new Set(['publicado', 'disponible']);
  const isReady = (r) => READY.has(r.estado);
  const TIPO = { Retiro: 'Retiro', Taller: 'Taller', 'Adoración': 'Adoración', retiro: 'Retiro', taller: 'Taller', hora_santa: 'Hora Santa', estaciones: 'Estaciones' };
  const tipoOf = (r) => TIPO[r.category] || TIPO[r.tipo] || '—';
  const SEASON = { ordinario: 'Ordinario', adviento: 'Adviento', cuaresma: 'Cuaresma', pascua: 'Pascua', pentecostes: 'Pentecostés' };
  const byDerej = {};
  for (const r of retreats) (byDerej[r.derej] ??= []).push(r);
  for (const k in byDerej) byDerej[k].sort((a, b) => (a.paso ?? 99) - (b.paso ?? 99));
  const total = retreats.length;
  const ready = retreats.filter(isReady);

  // ---------------- Presentación ----------------
  const pres = new PptxGenJS();
  pres.defineLayout({ name: 'MCJ_VERTICAL', width: 7.5, height: 13.333 });
  pres.layout = 'MCJ_VERTICAL';
  pres.title = 'Mi Camino es Jesús · Equipo';
  pres.author = 'Mi Camino es Jesús';
  pres.theme = { headFontFace: FONT_H, bodyFontFace: FONT_B };

  const footer = (dark) => [
    { text: { text: 'MI CAMINO ES JESÚS', options: { x: I(40), y: I(922), w: I(240), h: I(16), fontSize: 8, bold: true, charSpacing: 2, color: dark ? '8FA0AE' : HEX.gray, fontFace: FONT_B, margin: 0 } } },
    { text: { text: 'EQUIPO MCJ', options: { x: I(300), y: I(922), w: I(200), h: I(16), fontSize: 8, bold: true, charSpacing: 2, color: dark ? '8FA0AE' : HEX.gray, align: 'right', fontFace: FONT_B, margin: 0 } } },
  ];
  const titlePh = (dark) => ({
    placeholder: {
      options: { name: 'title', type: 'title', x: I(40), y: I(116), w: I(460), h: I(86), fontFace: FONT_H, fontSize: 32, bold: true, color: dark ? HEX.bg : HEX.ink, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 0.92 },
      text: '',
    },
  });
  const eyebrowPh = (dark) => ({
    placeholder: {
      options: { name: 'eyebrow', type: 'body', x: I(76), y: I(94), w: I(424), h: I(16), fontFace: FONT_H, fontSize: 10, bold: true, charSpacing: 3, color: dark ? HEX.gold : HEX.red, align: 'left', margin: 0, valign: 'middle' },
      text: '',
    },
  });
  const layoutBase = (name, bg, dark, withTitle = true) => {
    const objects = [
      { image: { path: img(dark ? 'logos/isotipo-bn.png' : 'logos/isotipo.png'), x: I(40), y: I(30), w: I(46), h: I(46) } },
      ...footer(dark),
    ];
    if (withTitle) objects.push({ rect: { x: I(40), y: I(101), w: I(26), h: I(2), fill: { color: HEX.gold }, line: { color: HEX.gold, width: 0 } } }, eyebrowPh(dark), titlePh(dark));
    pres.defineSlideMaster({
      title: name,
      background: { color: bg },
      objects,
      slideNumber: { x: I(440), y: I(42), w: I(60), h: I(20), fontFace: FONT_H, fontSize: 11, bold: true, color: HEX.gold, align: 'right', margin: 0 },
    });
  };
  layoutBase('MCJ_CLARO', HEX.bg, false);
  layoutBase('MCJ_CREMA', HEX.bgAlt, false);
  layoutBase('MCJ_OSCURO', HEX.ink, true);
  layoutBase('MCJ_DEREJ', HEX.bg, false, false);
  pres.defineSlideMaster({ title: 'MCJ_PORTADA', background: { color: HEX.ink }, objects: [] });

  // ---------------- Animación: etiquetas en objectName ----------------
  // Cada forma animada lleva objectName "anim|<grupo>|<efecto>|<id>". Los grupos entran en orden
  // (uno tras otro, automáticos); las formas del mismo grupo entran juntas.
  let uid = 0;
  const A = (group, effect = 'float') => (group == null ? undefined : `anim|${group}|${effect}|${++uid}`);
  const nm = (group, effect) => { const n = A(group, effect); return n ? { objectName: n } : { objectName: `s${++uid}` }; };

  // ---------------- Helpers de dibujo ----------------
  const box = (s, x, y, w, h, fill, o = {}) => s.addShape(o.round === false ? pres.ShapeType.rect : pres.ShapeType.roundRect, {
    x: I(x), y: I(y), w: I(w), h: I(h), fill: { color: fill, transparency: o.transparency || 0 },
    line: o.line ? { color: o.line, width: o.lineW || 0.75 } : { color: fill, width: 0, transparency: 100 },
    rectRadius: o.r ?? 0.14, shadow: o.shadow ? { type: 'outer', color: '14293A', opacity: 0.12, blur: 8, offset: 3, angle: 90 } : undefined,
    ...nm(o.g, o.fx),
  });
  const txt = (s, text, x, y, w, h, o = {}) => s.addText(text, {
    x: I(x), y: I(y), w: I(w), h: I(h), fontFace: o.font || FONT_B, fontSize: o.size || 12, bold: !!o.bold, italic: !!o.italic,
    color: o.color || HEX.ink, align: o.align || 'left', valign: o.valign || 'top', margin: o.margin ?? 0,
    charSpacing: o.cs, lineSpacingMultiple: o.lh || 1.15, isTextBox: true, fit: 'none', ...nm(o.g, o.fx),
  });
  const pic = (s, p, x, y, w, h, o = {}) => s.addImage({
    path: img(p), x: I(x), y: I(y), w: I(w), h: I(h),
    sizing: o.contain ? { type: 'contain', w: I(w), h: I(h) } : { type: 'cover', w: I(w), h: I(h) }, rounding: !!o.round,
    transparency: o.transparency, ...nm(o.g, o.fx),
  });
  const titleRuns = (parts, dark) => parts.map((p, i) => (typeof p === 'string'
    ? { text: p, options: {} }
    : { text: p.em, options: { color: dark ? HEX.gold : HEX.red } }));
  const head = (s, eyebrow, parts, dark) => {
    s.addText(eyebrow.toUpperCase(), { placeholder: 'eyebrow' });
    s.addText(titleRuns(parts, dark), { placeholder: 'title' });
  };
  const notes = [];
  const slide = (master, section, transition, note) => {
    const s = pres.addSlide({ masterName: master, sectionTitle: section });
    notes.push(transition);
    if (note) s.addNotes(note);
    return s;
  };

  // ======================= SECCIÓN: BIENVENIDA =======================
  pres.addSection({ title: 'Bienvenida' });

  // 01 PORTADA
  {
    const s = slide('MCJ_PORTADA', 'Bienvenida', 'fadeSlow', 'Bienvenida. Esta presentación es para todo el equipo: lo que somos, lo que tenemos, a qué nos vamos a dedicar y cómo.');
    pic(s, 'images/hero.webp', 0, 0, 540, 520, { g: 1, fx: 'fade' });
    box(s, 0, 0, 540, 520, HEX.ink, { round: false, transparency: 45, g: 1, fx: 'fade' });
    box(s, 0, 470, 540, 490, HEX.ink, { round: false });
    pic(s, 'logos/isotipo-bn.png', 40, 330, 110, 100, { contain: true, g: 2, fx: 'zoom' });
    txt(s, 'PARA EL EQUIPO DE', 40, 452, 460, 18, { size: 12, bold: true, cs: 3, color: HEX.cream, g: 3, fx: 'fade' });
    txt(s, [{ text: 'MI CAMINO', options: { color: HEX.bg, breakLine: true } }, { text: 'ES ', options: { color: HEX.bg } }, { text: 'JESÚS', options: { color: HEX.gold } }], 40, 476, 460, 120, { size: 50, bold: true, font: FONT_H, lh: 0.95, g: 3, fx: 'float' });
    box(s, 40, 616, 250, 30, HEX.red, { r: 0.1, g: 4, fx: 'wipe' });
    txt(s, 'HACIA DÓNDE CAMINAMOS JUNTOS', 40, 616, 250, 30, { size: 10, bold: true, cs: 2, color: HEX.white, align: 'center', valign: 'middle', g: 4, fx: 'wipe' });
    txt(s, 'Lo que somos, lo que ya tenemos, a qué nos vamos a dedicar y cómo lo vamos a hacer.', 40, 668, 420, 50, { size: 15, color: 'C9D1D8', lh: 1.4, g: 5, fx: 'fade' });
    txt(s, 'EQUIPO MCJ', 40, 922, 200, 16, { size: 8, bold: true, cs: 2, color: '8FA0AE' });
    txt(s, 'NOVIEMBRE 2026', 300, 922, 200, 16, { size: 8, bold: true, cs: 2, color: '8FA0AE', align: 'right' });
  }

  // 02 CARTA
  {
    const s = slide('MCJ_CREMA', 'Bienvenida', 'fade', 'Leer la carta en voz alta. Es el tono de toda la presentación: gratitud primero.');
    head(s, 'Antes de empezar', ['GRACIAS POR ', { em: 'DECIR QUE SÍ' }]);
    box(s, 40, 210, 460, 330, HEX.white, { shadow: true, g: 1, fx: 'float' });
    txt(s, [
      { text: 'Este proyecto no existe por un logo ni por un catálogo. Existe porque cada uno de ustedes decidió regalar su tiempo, su talento y su fe para que otros se encuentren con Jesús.', options: { breakLine: true, paraSpaceAfter: 10 } },
      { text: 'Empezamos en nuestra parroquia. En agosto dimos el primer paso fuera, con ' }, { text: 'Levántate y Sé Hombre', options: { bold: true, color: HEX.red } }, { text: '. Ahora toca crecer, y nadie recorre este camino solo.', options: { breakLine: true, paraSpaceAfter: 10 } },
      { text: 'Esta presentación es para que todos veamos el mismo mapa: qué tenemos, qué falta y dónde cabe cada quien.' },
    ], 64, 234, 412, 290, { size: 15, lh: 1.4, g: 1, fx: 'float' });
    pic(s, 'logos/isotipo.png', 40, 566, 44, 44, { contain: true, g: 2, fx: 'fade' });
    txt(s, [{ text: 'Equipo fundador', options: { bold: true, breakLine: true } }, { text: 'Pbro. Cristopher Cortés · Jehosua Castañeda', options: { color: HEX.gray, fontSize: 12 } }], 96, 568, 400, 44, { size: 14, g: 2, fx: 'fade' });
    box(s, 40, 840, 280, 36, HEX.bgAlt, { line: HEX.gold, lineW: 1.25, r: 0.5, g: 3, fx: 'zoom' });
    txt(s, '“SÉ FUERTE Y VALIENTE” · JOSUÉ 1:6', 40, 840, 280, 36, { size: 10.5, bold: true, cs: 1.5, color: HEX.red, align: 'center', valign: 'middle', g: 3, fx: 'zoom' });
  }

  // 03 IDENTIDAD
  {
    const s = slide('MCJ_CLARO', 'Bienvenida', 'fade');
    head(s, 'Nuestra identidad', ['LO QUE ', { em: 'SOMOS' }, ', EN CORTO']);
    const cards = [
      ['MISIÓN', 'Formar discípulos misioneros, jóvenes y adultos, que vivan, anuncien y sirvan el Evangelio con alegría, siendo un punto de quiebre para el mundo actual.', HEX.gold],
      ['VISIÓN', 'Ser una escuela de referencia en la Nueva Evangelización, donde cada persona, sin importar su edad, encuentre un camino claro de encuentro, formación y misión con Jesucristo.', HEX.red],
    ];
    cards.forEach(([l, t, c], i) => {
      const y = 214 + i * 140;
      box(s, 40, y, 460, 126, HEX.white, { shadow: true, g: 1 + i });
      box(s, 60, y + 20, 10, 10, c, { r: 0.5, g: 1 + i });
      txt(s, l, 80, y + 17, 300, 16, { size: 10, bold: true, cs: 3, color: HEX.red, g: 1 + i });
      txt(s, t, 60, y + 42, 420, 76, { size: 14, lh: 1.35, g: 1 + i });
    });
    txt(s, 'LOS 4 PILARES DE TODA EXPERIENCIA', 40, 506, 460, 16, { size: 10, bold: true, cs: 3, color: HEX.red, g: 3, fx: 'fade' });
    const P = [['ENCUENTRO', 'con Cristo vivo', HEX.cream, HEX.ink], ['FORMACIÓN', 'estudio, oración, sacramentos', HEX.red, HEX.white], ['COMUNIDAD', 'nadie camina solo', HEX.ink, HEX.white], ['MISIÓN', 'anunciar lo vivido', HEX.gold, HEX.ink2]];
    P.forEach(([t, d, bg, fg], i) => {
      const x = 40 + (i % 2) * 236, y = 534 + Math.floor(i / 2) * 120;
      box(s, x, y, 224, 108, bg, { g: 4 + i, fx: 'zoom' });
      txt(s, `0${i + 1}`, x + 18, y + 14, 60, 26, { size: 22, bold: true, color: fg, g: 4 + i, fx: 'zoom' });
      txt(s, t, x + 18, y + 50, 190, 20, { size: 15, bold: true, color: fg, g: 4 + i, fx: 'zoom' });
      txt(s, d, x + 18, y + 72, 190, 30, { size: 11.5, color: fg, g: 4 + i, fx: 'zoom' });
    });
  }

  // ======================= SECCIÓN: DÓNDE ESTAMOS =======================
  pres.addSection({ title: 'Dónde estamos' });

  // 04 DÓNDE ESTAMOS
  {
    const s = slide('MCJ_CREMA', 'Dónde estamos', 'fade', `El catálogo XP Lev tiene ${total} experiencias diseñadas; ${ready.length} ya están listas para vivirse.`);
    head(s, 'Dónde estamos hoy', ['TENEMOS EL MAPA, ', { em: 'FALTA RECORRERLO' }]);
    const st = [[String(total), 'Experiencias diseñadas en el catálogo XP Lev', HEX.ink, HEX.gold, HEX.white], [String(ready.length), 'Listas para vivirse hoy', HEX.green, HEX.white, HEX.white], [String(total - ready.length), 'En preparación: falta redactar su material', HEX.white, HEX.red, HEX.ink], ['6 + 1', 'Dérej por público + la dimensión Peregrinos', HEX.white, HEX.red, HEX.ink]];
    st.forEach(([n, l, bg, nc, lc], i) => {
      const x = 40 + (i % 2) * 236, y = 214 + Math.floor(i / 2) * 124;
      box(s, x, y, 224, 112, bg, { g: 1 + i, fx: 'zoom' });
      txt(s, n, x + 18, y + 12, 200, 50, { size: 40, bold: true, color: nc, g: 1 + i, fx: 'zoom' });
      txt(s, l, x + 18, y + 66, 190, 40, { size: 11.5, bold: true, color: lc, g: 1 + i, fx: 'zoom' });
    });
    txt(s, 'LO QUE YA ESTÁ LISTO', 40, 478, 460, 16, { size: 10, bold: true, cs: 3, color: HEX.red, g: 5, fx: 'fade' });
    ready.forEach((r, i) => {
      const x = 40 + (i % 2) * 236, y = 504 + Math.floor(i / 2) * 64;
      box(s, x, y, 224, 54, HEX.white, { g: 6 + Math.floor(i / 2) });
      box(s, x + 12, y + 21, 12, 12, HEX.green, { r: 0.5, g: 6 + Math.floor(i / 2) });
      txt(s, r.title, x + 32, y + 8, 186, 20, { size: 12, bold: true, g: 6 + Math.floor(i / 2) });
      txt(s, `${DEREJ[r.derej].name} · ${tipoOf(r)}`, x + 32, y + 30, 186, 16, { size: 10, color: HEX.gray, g: 6 + Math.floor(i / 2) });
    });
  }

  // ======================= SECCIÓN: PLAN =======================
  pres.addSection({ title: 'Plan de trabajo' });

  // 05 FOCOS
  {
    const s = slide('MCJ_OSCURO', 'Plan de trabajo', 'push', 'Seis focos. Los fechados ya están acordados; el resto es para aterrizar juntos.');
    head(s, 'A qué nos vamos a dedicar', ['SEIS ', { em: 'FOCOS' }, ' PARA LOS PRÓXIMOS MESES'], true);
    const F = [
      ['ARRANCAR DÉREJ KAVOD', 'Fuiste Hecha Mujer: piloto en enero, exclusivo para las mujeres del equipo, y retiro abierto en marzo.'],
      ['DAR CONTINUIDAD A GUIBOR', 'Segunda edición de Levántate y Sé Hombre en febrero; Sansón (paso 2) en abril o mayo.'],
      ['SEMANA SANTA CON LA COMUNIDAD', 'Barrabás será el retiro de Semana Santa para la comunidad (Dérej Jaím).'],
      ['NUEVOS MATERIALES', 'El Arca de Noé (Angélica) a finales de diciembre y Esclava del Señor (Maribel) a finales de enero.'],
      ['LANZAR PEREGRINOS', 'Nueva dimensión de peregrinaciones por México y el mundo, a cargo de Silvia Ponce.'],
      ['CAMINAR CON LA ARQUIDIÓCESIS', 'Presentar MCJ a Mons. Patrón Wong y buscar su respaldo.'],
    ];
    F.forEach(([t, d], i) => {
      const y = 218 + i * 112;
      box(s, 40, y, 460, 1, '3A5063', { round: false, g: 1 + i, fx: 'fade' });
      txt(s, `0${i + 1}`, 40, y + 14, 50, 30, { size: 24, bold: true, color: HEX.gold, g: 1 + i });
      txt(s, t, 96, y + 14, 404, 20, { size: 14, bold: true, color: HEX.bg, g: 1 + i });
      txt(s, d, 96, y + 38, 404, 60, { size: 12.5, color: 'C9D1D8', lh: 1.3, g: 1 + i });
    });
  }

  // 06 HOJA DE RUTA
  {
    const s = slide('MCJ_CLARO', 'Plan de trabajo', 'push', 'Ojo: marzo concentra Fuiste Hecha Mujer y Barrabás (Semana Santa, 21–27 de marzo de 2027). Conviene definir equipos distintos para cada uno.');
    head(s, 'Hoja de ruta', ['DE DICIEMBRE ', { em: 'A MAYO' }]);
    const R = [
      ['FIN DIC 2026', 'Entrega: El Arca de Noé', 'Dérej Simjá · Angélica', HEX.gold],
      ['ENE 2027', 'Piloto: Fuiste Hecha Mujer', 'Dérej Kavod · solo mujeres del equipo', HEX.red],
      ['FIN ENE 2027', 'Entrega: Esclava del Señor', 'Dérej Mesharét · Maribel', HEX.gold],
      ['FEB 2027', 'Levántate y Sé Hombre · 2ª edición', 'Dérej Guibor · paso 1', HEX.red],
      ['MAR 2027', 'Fuiste Hecha Mujer', 'Dérej Kavod · paso 1', HEX.red],
      ['SEMANA SANTA', 'Barrabás · retiro para la comunidad', 'Dérej Jaím · 21 al 27 de marzo', HEX.cuaresma],
      ['ABR–MAY 2027', 'Sansón', 'Dérej Guibor · paso 2', HEX.red],
    ];
    box(s, 141, 228, 2, 620, HEX.line, { round: false, g: 1, fx: 'wipe' });
    R.forEach(([d, t, m, c], i) => {
      const y = 214 + i * 90;
      txt(s, d, 40, y + 8, 90, 34, { size: 10, bold: true, cs: 1, color: HEX.gold, align: 'right', g: 2 + i });
      box(s, 134, y + 10, 16, 16, c, { r: 0.5, line: HEX.bg, lineW: 2.5, g: 2 + i, fx: 'zoom' });
      box(s, 164, y, 336, 76, HEX.white, { shadow: true, g: 2 + i });
      txt(s, t, 180, y + 12, 310, 22, { size: 13.5, bold: true, g: 2 + i });
      txt(s, m, 180, y + 40, 310, 20, { size: 11, color: HEX.gray, g: 2 + i });
    });
  }

  // 07 CÓMO LO HACEMOS
  {
    const s = slide('MCJ_CREMA', 'Plan de trabajo', 'fade');
    head(s, 'Cómo lo vamos a hacer', ['CADA EXPERIENCIA SE ', { em: 'CONSTRUYE IGUAL' }]);
    txt(s, '1 · CADA TEMA SIGUE LA MISMA ESTRUCTURA', 40, 214, 460, 16, { size: 10.5, bold: true, cs: 1.5, g: 1, fx: 'fade' });
    ['Evocación bíblica', 'Actividad introductoria', 'Contenido', 'Símbolos', 'Reflexión'].forEach((t, i) => {
      const x = 40 + i * 93;
      box(s, x, 240, 87, 92, i % 2 ? HEX.red : HEX.white, { g: 2 + i, fx: 'zoom' });
      txt(s, String(i + 1), x, 250, 87, 28, { size: 22, bold: true, color: i % 2 ? HEX.cream : HEX.red, align: 'center', g: 2 + i, fx: 'zoom' });
      txt(s, t, x + 6, 282, 75, 44, { size: 10.5, bold: true, color: i % 2 ? HEX.white : HEX.ink, align: 'center', g: 2 + i, fx: 'zoom' });
    });
    txt(s, '2 · CADA FORMATO TIENE SU FICHA TÉCNICA', 40, 360, 460, 16, { size: 10.5, bold: true, cs: 1.5, g: 7, fx: 'fade' });
    const rows = [['', 'DURACIÓN', 'PERSONAS'], ['Retiro', '2 a 3 días', '25 a 80'], ['Taller', '4 a 6 horas', '15 a 40'], ['Hora Santa', '1 a 3 horas', '30 a 120']];
    rows.forEach((r, i) => {
      const y = 386 + i * 34;
      box(s, 40, y, 460, 33, i === 0 ? HEX.ink : HEX.white, { r: i === 0 ? 0.25 : 0.12, g: 8 });
      r.forEach((c, j) => txt(s, c, [52, 200, 360][j], y, [140, 150, 130][j], 33, { size: i === 0 ? 9.5 : 13, bold: i === 0 || j === 0, cs: i === 0 ? 1.5 : undefined, color: i === 0 ? HEX.cream : HEX.ink, valign: 'middle', g: 8 }));
    });
    txt(s, 'Espacio: capilla con Sagrario y salón con sillas móviles para las dinámicas.', 40, 530, 460, 18, { size: 11, color: HEX.gray, g: 8 });
    txt(s, '3 · DE LA IDEA AL CATÁLOGO', 40, 576, 460, 16, { size: 10.5, bold: true, cs: 1.5, g: 9, fx: 'fade' });
    ['Redactar', 'Revisión espiritual', 'Piloto', 'Lista'].forEach((t, i) => {
      const x = 40 + i * 118;
      box(s, x, 602, 106, 60, i === 3 ? HEX.green : HEX.cream, { g: 10 + i, fx: 'wipe' });
      txt(s, t, x + 4, 602, 98, 60, { size: 12, bold: true, color: i === 3 ? HEX.white : HEX.ink, align: 'center', valign: 'middle', g: 10 + i, fx: 'wipe' });
      if (i < 3) txt(s, '→', x + 106, 618, 12, 28, { size: 14, bold: true, color: HEX.gold, align: 'center', g: 10 + i, fx: 'wipe' });
    });
    box(s, 40, 690, 460, 112, HEX.white, { shadow: true, g: 14 });
    txt(s, 'EJEMPLO EN MARCHA', 60, 706, 420, 14, { size: 9.5, bold: true, cs: 2, color: HEX.red, g: 14 });
    txt(s, 'Fuiste Hecha Mujer tendrá su piloto en enero, solo con las mujeres del equipo, antes de abrirse al público en marzo. Así probamos dinámicas, tiempos y logística antes de recibir a nadie.', 60, 726, 420, 70, { size: 12.5, lh: 1.35, g: 14 });
  }

  // ======================= SECCIÓN: XP LEV =======================
  pres.addSection({ title: 'Los 6 Dérej' });

  const DJ = {
    guibor: { code: 'GBR', color: HEX.red, heb: 'Guibor = guerrero, valiente', route: 'Ruta Hombría Bíblica', esq: 'Secuencial · 6 retiros en orden', why: 'Itinerario para hombres que recorre, paso a paso, lo que significa ser hombre a la luz de Cristo: identidad, fortaleza, familia, amistad, paternidad y herencia. Cada retiro se apoya en un hombre de la Biblia.', tip: 'Segunda edición de Levántate en febrero, para que más hombres entren al camino antes de Sansón (paso 2) en abril–mayo.' },
    kavod: { code: 'KVD', color: HEX.ink, heb: 'Kavod = gloria, dignidad', route: 'Ruta Mujer Nueva', esq: 'Secuencial · 6 retiros en orden', why: 'Secuencia de autodescubrimiento y sanación para mujeres: dignidad original, lealtad, sed de amor verdadero, servicio y valentía. Cada retiro se apoya en una mujer de la Biblia.', tip: 'Arranca con Fuiste Hecha Mujer: piloto en enero exclusivo para las mujeres del equipo y retiro abierto en marzo.' },
    oz: { code: 'OZ', color: HEX.red, heb: 'Oz = fortaleza', route: 'Del llamado a la misión', esq: '10 hitos · orden sugerido', why: 'Pastoral juvenil (13–30 años) en tres movimientos: el llamado (1–3), el discipulado (4–8) y el envío (9–10). Cada parroquia puede tomarlos de forma modular.', tip: 'Ya hay 3 hitos listos (Pedro, Juan y Emaús), los tres de Pascua: base natural para arrancar Oz.', phases: { 1: 'LLAMADO', 4: 'DISCIPULADO', 9: 'ENVÍO' } },
    simja: { code: 'SMJ', color: HEX.ink, heb: 'Simjá = alegría', route: 'Infancia misionera y catequesis', esq: 'Estaciones · no lineal', why: 'Pedagogía bíblica, asombro y oración para niños de hasta 12 años, en dos cortes: Kínder (4–6) y Primaria (7–12). Cada actividad es un circuito de estaciones.', tip: 'Angélica presenta El Arca de Noé a finales de diciembre: será la primera experiencia lista para niños.', corte: true },
    mesharet: { code: 'MSH', color: HEX.red, heb: 'Mesharét = el que sirve', route: 'Formación de servidores', esq: 'Catálogo abierto · módulos', why: 'Talleres para revitalizar el celo pastoral, la técnica evangelizadora y la comunión del equipo servidor. Un módulo por ministerio.', tip: 'Maribel presenta Esclava del Señor a finales de enero. Sin servidores formados no hay forma de multiplicar los retiros.' },
    jaim: { code: 'JM', color: HEX.ink, heb: 'Jaím = vida', route: 'Para toda la comunidad', esq: 'Catálogo abierto · litúrgico', why: 'Retiros de impacto, talleres y Horas Santas temáticas para la comunidad parroquial en general, según el calendario de la Iglesia.', tip: 'Barrabás es el retiro de Semana Santa para la comunidad. Emmanuel y Camino a Belén ya están listos para Adviento.' },
  };
  const ORDER = ['guibor', 'kavod', 'oz', 'simja', 'mesharet', 'jaim'];

  // 08 MAPA
  {
    const s = slide('MCJ_OSCURO', 'Los 6 Dérej', 'fade', 'Dérej significa camino en hebreo. La barra muestra cuánto material ya está listo en cada uno.');
    head(s, 'Método XP Lev', ['LOS 6 ', { em: 'DÉREJ' }, ' DE UN VISTAZO'], true);
    txt(s, [{ text: 'Dérej', options: { bold: true, color: HEX.cream } }, { text: ' significa “camino” en hebreo. Cada uno es una ruta para una etapa concreta de la vida. La barra muestra cuánto tenemos listo.' }], 40, 210, 460, 50, { size: 12.5, color: 'C9D1D8', lh: 1.35, g: 1, fx: 'fade' });
    ORDER.forEach((k, i) => {
      const items = byDerej[k] || []; const r = items.filter(isReady).length;
      const y = 276 + i * 92, g = 2 + i;
      box(s, 40, y, 460, 80, HEX.inkSoft, { line: '2E475B', g });
      box(s, 54, y + 14, 52, 52, i % 2 ? HEX.gold : HEX.red, { r: 0.2, g });
      txt(s, DJ[k].code, 54, y + 14, 52, 52, { size: 12, bold: true, color: i % 2 ? HEX.ink : HEX.bg, align: 'center', valign: 'middle', g });
      txt(s, DEREJ[k].name.toUpperCase(), 120, y + 14, 290, 20, { size: 14, bold: true, color: HEX.bg, g });
      txt(s, `${DEREJ[k].audience} · ${DJ[k].esq.split(' · ')[0]}`, 120, y + 36, 290, 16, { size: 10.5, color: 'AEBBC6', g });
      box(s, 120, y + 60, 290, 5, '34495A', { r: 0.5, g });
      box(s, 120, y + 60, Math.max(290 * r / items.length, 6), 5, HEX.gold, { r: 0.5, g: g, fx: 'wipe' });
      txt(s, `${r}/${items.length}`, 420, y + 16, 66, 26, { size: 18, bold: true, color: HEX.gold, align: 'right', g });
      txt(s, 'LISTAS', 420, y + 44, 66, 14, { size: 8, bold: true, cs: 1.5, color: '8FA0AE', align: 'right', g });
    });
    box(s, 40, 836, 460, 44, HEX.red, { g: 8, fx: 'zoom' });
    txt(s, [{ text: '+ PEREGRINOS', options: { bold: true, color: HEX.cream } }, { text: '   la nueva dimensión de peregrinaciones', options: { color: HEX.white } }], 56, 836, 430, 44, { size: 12.5, valign: 'middle', g: 8, fx: 'zoom' });
  }

  // 09–14 UNA LÁMINA POR DÉREJ
  ORDER.forEach((k, idx) => {
    const d = DJ[k], info = DEREJ[k], items = byDerej[k] || [];
    const s = slide('MCJ_DEREJ', 'Los 6 Dérej', 'push', `${info.name}: ${d.why} ${d.tip}`);
    const nReady = items.filter(isReady).length;
    box(s, 40, 92, 460, 96, d.color, { g: 1, fx: 'zoom' });
    txt(s, `DÉREJ ${idx + 1} DE 6 · ${info.audience.toUpperCase()}`, 58, 106, 330, 14, { size: 9, bold: true, cs: 2, color: d.color === HEX.ink ? HEX.gold : HEX.cream, g: 1, fx: 'zoom' });
    txt(s, info.name.toUpperCase(), 58, 124, 330, 34, { size: 27, bold: true, color: HEX.white, g: 1, fx: 'zoom' });
    txt(s, [{ text: info.subtitle + ' · ' }, { text: d.heb, options: { italic: true, color: d.color === HEX.ink ? HEX.gold : HEX.cream } }], 58, 160, 330, 18, { size: 11, color: 'E6E0D6', g: 1, fx: 'zoom' });
    box(s, 402, 108, 82, 64, HEX.white, { transparency: 85, r: 0.18, g: 1, fx: 'zoom' });
    txt(s, [{ text: String(nReady), options: { fontSize: 26, bold: true } }, { text: `/${items.length}`, options: { fontSize: 13 } }], 402, 112, 82, 34, { color: HEX.white, align: 'center', g: 1, fx: 'zoom' });
    txt(s, 'LISTAS', 402, 148, 82, 14, { size: 8, bold: true, cs: 2, color: HEX.white, align: 'center', g: 1, fx: 'zoom' });
    // chips
    const chipW1 = Math.round(d.route.length * 6.2 + 22), chipW2 = Math.round(d.esq.length * 5.6 + 22);
    box(s, 40, 198, chipW1, 22, HEX.cream, { r: 0.5, g: 2, fx: 'fade' });
    txt(s, d.route, 40, 198, chipW1, 22, { size: 9.5, bold: true, align: 'center', valign: 'middle', g: 2, fx: 'fade' });
    box(s, 48 + chipW1, 198, chipW2, 22, HEX.bg, { line: 'BFC6CC', r: 0.5, g: 2, fx: 'fade' });
    txt(s, d.esq, 48 + chipW1, 198, chipW2, 22, { size: 9.5, bold: true, align: 'center', valign: 'middle', g: 2, fx: 'fade' });
    txt(s, d.why, 40, 230, 460, 54, { size: 11.5, color: HEX.gray, lh: 1.3, g: 2, fx: 'fade' });

    const dense = items.length > 8;
    let y = 294; let g = 3;
    items.forEach((r) => {
      if (d.phases?.[r.paso]) { txt(s, d.phases[r.paso], 44, y, 200, 14, { size: 9, bold: true, cs: 2.5, color: HEX.red, g, fx: 'fade' }); y += 16; }
      const plan = PLAN[r.title];
      const concept = dense ? '' : r.conceptoCentral;
      const cLines = concept ? Math.ceil(concept.length / 60) : 0;
      const h = dense ? 36 : 40 + cLines * 13;
      const ok = isReady(r);
      box(s, 40, y, 460, h, HEX.white, { line: ok ? HEX.green : undefined, lineW: 1.25, r: dense ? 0.22 : 0.16, g });
      const hasNum = r.paso != null;
      const tx = hasNum ? 74 : 54;
      if (hasNum) txt(s, String(r.paso), 44, y, 26, h, { size: 15, bold: true, color: HEX.red, align: 'center', valign: 'middle', g });
      // estado / plan
      const label = plan || (ok ? 'Lista' : 'En preparación');
      const cw = Math.round(label.length * 5.3 + 18);
      const chipFill = plan ? HEX.gold : ok ? HEX.green : HEX.white;
      box(s, 490 - cw, y + (h - 20) / 2, cw, 20, chipFill, { line: plan || ok ? undefined : 'C9C2B4', r: 0.5, g });
      txt(s, label.toUpperCase(), 490 - cw, y + (h - 20) / 2, cw, 20, { size: 7.5, bold: true, cs: 0.5, color: plan || ok ? HEX.white : HEX.gray, align: 'center', valign: 'middle', g });
      const tw = 490 - cw - 10 - tx;
      txt(s, r.title, tx, y + 5, tw, 16, { size: 12, bold: true, g });
      const corte = d.corte && r.corte ? ` · ${CORTES_SIMJA[r.corte].name}` : '';
      box(s, tx, y + 24.5, 6, 6, HEX[r.season] || HEX.green, { r: 0.5, g });
      txt(s, `${tipoOf(r)} · ${SEASON[r.season]}${corte}`, tx + 10, y + 21, tw - 10, 13, { size: 9.5, color: HEX.gray, g });
      if (concept) txt(s, concept, tx, y + 36, tw, cLines * 13 + 2, { size: 10, color: '3B4B58', lh: 1.15, g });
      y += h + 5; g++;
    });
    box(s, 40, 822, 460, 82, HEX.cream, { g, fx: 'float' });
    txt(s, 'DATO CLAVE', 56, 834, 300, 14, { size: 8.5, bold: true, cs: 2, color: HEX.red, g, fx: 'float' });
    txt(s, d.tip, 56, 850, 430, 48, { size: 11.5, lh: 1.25, g, fx: 'float' });
  });

  // ======================= SECCIÓN: PEREGRINOS =======================
  pres.addSection({ title: 'Peregrinos' });

  // 15 PEREGRINOS
  {
    const s = slide('MCJ_OSCURO', 'Peregrinos', 'fadeSlow', 'Peregrinos: nueva dimensión de MCJ, a cargo de Silvia Ponce, agente de viajes certificada y ex agente de la Pastoral Vocacional de Piedras Negras, Coahuila.');
    head(s, 'Nueva dimensión', ['PEREGRINOS: ', { em: 'CAMINAR PARA ENCONTRARLO' }], true);
    // ruta punteada con hitos
    const pts = [[64, 300], [170, 262], [276, 300], [382, 262], [476, 292]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      s.addShape(pres.ShapeType.line, { x: I(x1), y: I(Math.min(y1, y2)), w: I(x2 - x1), h: I(Math.abs(y2 - y1)), flipV: y2 < y1, line: { color: HEX.gold, width: 1.5, dashType: 'dash' }, ...nm(1 + i, 'wipe') });
    }
    ['MÉXICO', '', 'EL MUNDO', '', 'LA FE'].forEach((l, i) => {
      const [x, y] = pts[i];
      box(s, x - 8, y - 8, 16, 16, i % 2 ? HEX.gold : HEX.red, { r: 0.5, line: HEX.ink, lineW: 2, g: 1 + i, fx: 'zoom' });
      if (l) txt(s, l, x - 50, y + 14, 100, 14, { size: 8.5, bold: true, cs: 2, color: HEX.cream, align: 'center', g: 1 + i, fx: 'zoom' });
    });
    txt(s, 'Peregrinaciones a lo largo de México y del mundo para acercar a las personas a Cristo y a la historia de la fe: los lugares donde la fe se vivió, se defendió y se sigue viviendo.', 40, 352, 460, 66, { size: 14, color: 'DCE3E8', lh: 1.4, g: 6, fx: 'fade' });
    const C = [['QUÉ ES', 'Una dimensión dedicada solo a peregrinar: viajes con sentido, preparados y acompañados.'], ['PARA QUIÉN', 'Para fieles y para quienes aún no conocen a Cristo: el camino también evangeliza.'], ['CÓMO SE INTEGRA', 'Cada peregrinación es un retiro en movimiento: encuentro, formación, comunidad y misión.']];
    C.forEach(([t, dd], i) => {
      const y = 436 + i * 82;
      box(s, 40, y, 460, 72, HEX.inkSoft, { line: '2E475B', g: 7 + i });
      txt(s, t, 58, y + 12, 420, 14, { size: 9.5, bold: true, cs: 2, color: HEX.gold, g: 7 + i });
      txt(s, dd, 58, y + 30, 424, 38, { size: 12, color: HEX.bg, lh: 1.25, g: 7 + i });
    });
    box(s, 40, 694, 460, 176, HEX.bg, { g: 10, fx: 'zoom' });
    box(s, 60, 716, 76, 76, HEX.red, { r: 0.5, g: 10, fx: 'zoom' });
    txt(s, 'SP', 60, 716, 76, 76, { size: 24, bold: true, color: HEX.cream, align: 'center', valign: 'middle', g: 10, fx: 'zoom' });
    txt(s, 'A CARGO DE', 152, 718, 320, 14, { size: 9, bold: true, cs: 2, color: HEX.red, g: 10, fx: 'zoom' });
    txt(s, 'Silvia Ponce', 152, 734, 320, 26, { size: 20, bold: true, g: 10, fx: 'zoom' });
    txt(s, 'Agente de viajes certificada', 152, 764, 320, 18, { size: 12, bold: true, color: HEX.gold, g: 10, fx: 'zoom' });
    txt(s, 'Ex agente de la Pastoral Vocacional de Piedras Negras, Coahuila. Une la experiencia pastoral con la logística profesional de viajes para que cada peregrinación sea segura y llena de sentido.', 60, 806, 420, 58, { size: 11.5, color: '3B4B58', lh: 1.3, g: 11, fx: 'fade' });
  }

  // ======================= SECCIÓN: CALENDARIO Y ALIADOS =======================
  pres.addSection({ title: 'Calendario y aliados' });

  // 16 CALENDARIO
  {
    const s = slide('MCJ_CREMA', 'Calendario y aliados', 'fade');
    head(s, 'Calendario litúrgico', ['QUÉ VIVIR EN ', { em: 'CADA TIEMPO' }]);
    txt(s, 'Los tiempos fuertes marcan nuestro año. Verde = lista; dorado = con fecha.', 40, 210, 460, 18, { size: 12, color: HEX.gray, g: 1, fx: 'fade' });
    let y = 240;
    ['adviento', 'cuaresma', 'pascua', 'pentecostes'].forEach((sk, i) => {
      const it = retreats.filter((r) => r.season === sk);
      // pre-layout chips
      const chips = []; let cx = 56, cy = 0;
      it.forEach((r) => {
        const t = r.title.split(' · ')[0].split(':')[0];
        const w = Math.round(t.length * 6.3 + 22);
        if (cx + w > 484) { cx = 56; cy += 30; }
        chips.push({ t, w, x: cx, y: cy, ok: isReady(r), plan: !!PLAN[r.title] }); cx += w + 6;
      });
      const bodyH = cy + 24 + 22;
      box(s, 40, y, 460, 34 + bodyH, HEX.white, { g: 2 + i });
      box(s, 40, y, 460, 32, HEX[sk], { r: 0.2, g: 2 + i });
      txt(s, SEASON[sk].toUpperCase(), 56, y, 300, 32, { size: 11.5, bold: true, cs: 2, color: HEX.white, valign: 'middle', g: 2 + i });
      txt(s, String(it.length), 400, y, 84, 32, { size: 11.5, bold: true, color: HEX.white, align: 'right', valign: 'middle', g: 2 + i });
      chips.forEach((c) => {
        const fill = c.ok ? HEX.green : c.plan ? HEX.gold : HEX.bgAlt;
        box(s, c.x, y + 44 + c.y, c.w, 24, fill, { r: 0.5, g: 2 + i });
        txt(s, c.t, c.x, y + 44 + c.y, c.w, 24, { size: 10.5, bold: true, color: c.ok || c.plan ? HEX.white : HEX.ink, align: 'center', valign: 'middle', g: 2 + i });
      });
      y += 34 + bodyH + 12;
    });
    const nOrd = retreats.filter((r) => r.season === 'ordinario').length;
    txt(s, `Las otras ${nOrd} experiencias pueden vivirse en cualquier momento del Tiempo Ordinario.`, 40, y + 4, 460, 32, { size: 11.5, color: HEX.gray, g: 6, fx: 'fade' });
  }

  // 17 ALIADOS + ARZOBISPADO
  {
    const s = slide('MCJ_CLARO', 'Calendario y aliados', 'fade');
    head(s, 'Más allá de la escuela', ['NO CAMINAMOS ', { em: 'SOLOS' }]);
    txt(s, 'LO QUE PEDIREMOS A LA ARQUIDIÓCESIS', 40, 214, 460, 16, { size: 10.5, bold: true, cs: 1.5, g: 1, fx: 'fade' });
    [['Reconocimiento formal', 'como escuela de Nueva Evangelización'], ['Difusión en parroquias', 'recomendación a párrocos y decanatos'], ['Vinculación pastoral', 'con Pastoral Juvenil, Familiar y Catequesis'], ['Espacios y sedes', 'casas de retiro y templos']].forEach(([t, d], i) => {
      const x = 40 + (i % 2) * 236, y = 240 + Math.floor(i / 2) * 100;
      box(s, x, y, 224, 88, HEX.bgAlt, { g: 2 + i, fx: 'zoom' });
      txt(s, `0${i + 1}`, x + 16, y + 12, 40, 20, { size: 15, bold: true, color: HEX.red, g: 2 + i, fx: 'zoom' });
      txt(s, t.toUpperCase(), x + 16, y + 36, 196, 16, { size: 11.5, bold: true, g: 2 + i, fx: 'zoom' });
      txt(s, d, x + 16, y + 54, 196, 30, { size: 10.5, color: HEX.gray, g: 2 + i, fx: 'zoom' });
    });
    txt(s, 'PROYECTOS ALIADOS', 40, 460, 460, 16, { size: 10.5, bold: true, cs: 1.5, g: 6, fx: 'fade' });
    [['images/karposhub.png', 'KARPOS HUB', 'Red profesional católica'], ['images/proyecto-ignis.webp', 'IGNIS', 'Ropa urbana católica'], ['images/proyecto-ignis-et-logos.webp', 'IGNIS ET LOGOS', 'Evangelización en redes']].forEach(([p, t, d], i) => {
      const x = 40 + i * 157;
      box(s, x, 486, 146, 168, HEX.white, { shadow: true, g: 7 + i });
      pic(s, p, x + 37, 502, 72, 72, { contain: true, g: 7 + i });
      txt(s, t, x + 6, 586, 134, 18, { size: 12, bold: true, align: 'center', g: 7 + i });
      txt(s, d, x + 6, 608, 134, 32, { size: 10, color: HEX.gray, align: 'center', g: 7 + i });
    });
    box(s, 40, 686, 460, 120, HEX.ink, { g: 10, fx: 'float' });
    txt(s, 'Y PEREGRINOS', 60, 704, 420, 16, { size: 10, bold: true, cs: 2, color: HEX.gold, g: 10, fx: 'float' });
    txt(s, 'Las peregrinaciones abren una puerta natural para vincularnos con santuarios, parroquias y diócesis de México y del mundo.', 60, 726, 420, 66, { size: 13, color: HEX.bg, lh: 1.35, g: 10, fx: 'float' });
  }

  // ======================= SECCIÓN: EQUIPO =======================
  pres.addSection({ title: 'Equipo y cierre' });

  // 18 EQUIPO
  {
    const s = slide('MCJ_CREMA', 'Equipo y cierre', 'fade');
    head(s, 'Nuestro equipo', ['QUIÉNES ', { em: 'HOY' }, ' LO HACEN POSIBLE']);
    const T = [
      ['images/p-cristopher.jpeg', 'Pbro. Lic. Theol. Cristopher Cortés Pliego', 'Fundador · Asesor espiritual', ''],
      ['images/jehosua.jpg', 'Jehosua A. Castañeda Ortiz', 'Fundador · Equipo pastoral', ''],
      ['images/maribel.jpeg', 'Maribel Pinto Corona', 'Equipo pastoral', 'Esclava del Señor · fin de enero'],
      ['images/angy.jpeg', 'Angélica M. Romero Hernández', 'Equipo pastoral', 'El Arca de Noé · fin de diciembre'],
      [null, 'Silvia Ponce', 'Responsable de Peregrinos', 'Agente de viajes certificada'],
    ];
    T.forEach(([p, n, r, extra], i) => {
      const y = 214 + i * 112;
      box(s, 40, y, 460, 100, HEX.white, { shadow: true, g: 1 + i });
      if (p) pic(s, p, 56, y + 12, 76, 76, { round: true, g: 1 + i });
      else { box(s, 56, y + 12, 76, 76, HEX.red, { r: 0.5, g: 1 + i }); txt(s, 'SP', 56, y + 12, 76, 76, { size: 22, bold: true, color: HEX.cream, align: 'center', valign: 'middle', g: 1 + i }); }
      txt(s, n, 150, y + 18, 336, 20, { size: 14, bold: true, g: 1 + i });
      txt(s, r.toUpperCase(), 150, y + 44, 336, 14, { size: 9, bold: true, cs: 1.5, color: HEX.red, g: 1 + i });
      if (extra) txt(s, extra, 150, y + 64, 336, 16, { size: 11, color: HEX.gray, g: 1 + i });
    });
    txt(s, '…y el siguiente lugar en esta lámina puede ser el tuyo.', 40, 784, 460, 20, { size: 12.5, italic: true, color: HEX.gray, align: 'center', g: 6, fx: 'fade' });
  }

  // 19 LO QUE NECESITAMOS DE TI
  {
    const s = slide('MCJ_OSCURO', 'Equipo y cierre', 'push');
    head(s, 'Próximos pasos', ['LO QUE ', { em: 'NECESITAMOS' }, ' DE TI'], true);
    const N = [
      ['ADOPTA UN DÉREJ', 'Un responsable por camino que cuide su avance y su calidad, como ya lo hacen Angélica y Maribel.'],
      ['AYUDA A REDACTAR', `Hay ${total - ready.length} experiencias esperando su material. Tu talento cabe en alguna.`],
      ['SIRVE EN LOS PRÓXIMOS RETIROS', 'Levántate (feb), Fuiste Hecha Mujer (mar) y Barrabás (Semana Santa) necesitan manos.'],
      ['ORA, INVITA Y COMPARTE', 'Invita a alguien, comparte @micaminoesjesus y suma ideas para Peregrinos.'],
    ];
    N.forEach(([t, d], i) => {
      const y = 214 + i * 104;
      box(s, 40, y, 460, 1, '3A5063', { round: false, g: 1 + i, fx: 'fade' });
      txt(s, `0${i + 1}`, 40, y + 16, 50, 30, { size: 24, bold: true, color: HEX.gold, g: 1 + i });
      txt(s, t, 96, y + 16, 404, 20, { size: 14, bold: true, color: HEX.bg, g: 1 + i });
      txt(s, d, 96, y + 40, 404, 50, { size: 12.5, color: 'C9D1D8', lh: 1.3, g: 1 + i });
    });
    pic(s, 'images/nosotros.webp', 40, 650, 460, 230, { g: 5, fx: 'fade' });
    box(s, 56, 838, 250, 26, HEX.red, { r: 0.15, g: 6, fx: 'wipe' });
    txt(s, 'NADIE RECORRE ESTE CAMINO SOLO', 56, 838, 250, 26, { size: 9.5, bold: true, cs: 1.5, color: HEX.white, align: 'center', valign: 'middle', g: 6, fx: 'wipe' });
  }

  // 20 CIERRE
  {
    const s = slide('MCJ_PORTADA', 'Equipo y cierre', 'fadeSlow', 'Cierre. Josué 1:9.');
    box(s, 140, 170, 260, 200, HEX.bg, { r: 0.12, g: 1, fx: 'zoom' });
    pic(s, 'logos/logotipo.png', 160, 186, 220, 168, { contain: true, g: 1, fx: 'zoom' });
    txt(s, [{ text: '“SÉ FUERTE', options: { color: HEX.bg, breakLine: true } }, { text: 'Y ', options: { color: HEX.bg } }, { text: 'VALIENTE', options: { color: HEX.gold } }, { text: '”', options: { color: HEX.bg } }], 40, 410, 460, 90, { size: 36, bold: true, align: 'center', lh: 1.0, g: 2, fx: 'float' });
    txt(s, 'JOSUÉ 1:9', 40, 506, 460, 18, { size: 11, bold: true, cs: 3, color: HEX.cream, align: 'center', g: 2, fx: 'float' });
    txt(s, 'No tengas miedo ni te acobardes, porque el Señor tu Dios estará contigo dondequiera que vayas.', 70, 550, 400, 60, { size: 15, italic: true, color: HEX.cream, align: 'center', lh: 1.4, g: 3, fx: 'fade' });
    txt(s, 'Gracias por caminar con nosotros. Lo mejor de MCJ todavía no ha pasado.', 90, 630, 360, 44, { size: 13, color: 'C9D1D8', align: 'center', lh: 1.4, g: 4, fx: 'fade' });
    txt(s, '#micaminoesjesus #equipomcj #xplev #peregrinos', 40, 700, 460, 18, { size: 10.5, bold: true, color: HEX.gold, align: 'center', g: 5, fx: 'fade' });
    txt(s, '© 2026 MI CAMINO ES JESÚS', 40, 922, 460, 16, { size: 8, bold: true, cs: 2, color: '8FA0AE', align: 'center' });
  }

  await pres.writeFile({ fileName: OUT });

  // ---------------- Post-proceso: transiciones + animaciones ----------------
  const zip = await JSZip.loadAsync(fs.readFileSync(OUT));
  const TRANS = {
    fade: '<p:transition spd="med"><p:fade/></p:transition>',
    fadeSlow: '<p:transition spd="slow"><p:fade/></p:transition>',
    push: '<p:transition spd="med"><p:push dir="u"/></p:transition>',
  };
  const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);
  let animated = 0;
  for (let si = 0; si < slideFiles.length; si++) {
    const f = slideFiles[si];
    let xml = await zip.file(f).async('string');
    // id de forma por objectName
    const shapes = [];
    const re = /<p:cNvPr id="(\d+)" name="(anim\|[^"]+)"/g; let m;
    while ((m = re.exec(xml))) { const [, id, name] = m; const [, grp, fx] = name.split('|'); shapes.push({ id, grp: +grp, fx, isSp: true }); }
    // ¿es <p:sp> (lleva bldP) o pic/graphicFrame?
    for (const sh of shapes) {
      const pos = xml.indexOf(`<p:cNvPr id="${sh.id}" `);
      const before = xml.lastIndexOf('<p:', pos - 1);
      const tag = xml.slice(before, before + 20);
      sh.isSp = /^<p:nvSpPr/.test(tag);
    }
    const groups = [...new Set(shapes.map((s) => s.grp))].sort((a, b) => a - b);
    let timing = '';
    if (groups.length) {
      let ctn = 3; const D = 420, STEP = 260;
      const effect = (sh, nodeType, delay) => {
        const tgt = `<p:tgtEl><p:spTgt spid="${sh.id}"/></p:tgtEl>`;
        const set = `<p:set><p:cBhvr><p:cTn id="${++ctn}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`;
        const fade = (dur) => `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${++ctn}" dur="${dur}"/>${tgt}</p:cBhvr></p:animEffect>`;
        const anim = (attr, from, to, dur) => `<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${++ctn}" dur="${dur}" decel="100000" fill="hold"/>${tgt}<p:attrNameLst><p:attrName>${attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="${from}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${to}"/></p:val></p:tav></p:tavLst></p:anim>`;
        let preset, sub, body;
        const id0 = ++ctn;
        if (sh.fx === 'zoom') { preset = 53; sub = 16; body = set + anim('ppt_w', '0', '#ppt_w', D) + anim('ppt_h', '0', '#ppt_h', D) + fade(D); }
        else if (sh.fx === 'wipe') { preset = 22; sub = 8; body = set + `<p:animEffect transition="in" filter="wipe(left)"><p:cBhvr><p:cTn id="${++ctn}" dur="${D + 80}"/>${tgt}</p:cBhvr></p:animEffect>`; }
        else if (sh.fx === 'fade') { preset = 10; sub = 0; body = set + fade(D); }
        else { preset = 42; sub = 0; body = set + fade(D) + anim('ppt_x', '#ppt_x', '#ppt_x', D) + anim('ppt_y', '#ppt_y+.04', '#ppt_y', D); }
        return `<p:par><p:cTn id="${id0}" presetID="${preset}" presetClass="entr" presetSubtype="${sub}" fill="hold" grpId="0" nodeType="${nodeType}"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst>${body}</p:childTnLst></p:cTn></p:par>`;
      };
      let inner = '';
      groups.forEach((g, gi) => {
        const members = shapes.filter((s) => s.grp === g);
        const parId = ++ctn;
        const effs = members.map((sh, mi) => effect(sh, mi === 0 ? 'afterEffect' : 'withEffect', 0)).join('');
        inner += `<p:par><p:cTn id="${parId}" fill="hold"><p:stCondLst><p:cond delay="${gi === 0 ? 0 : gi * STEP}"/></p:stCondLst><p:childTnLst>${effs}</p:childTnLst></p:cTn></p:par>`;
      });
      const bld = shapes.filter((s) => s.isSp).map((s) => `<p:bldP spid="${s.id}" grpId="0" animBg="1"/>`).join('');
      timing = `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>${inner}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>${bld ? `<p:bldLst>${bld}</p:bldLst>` : ''}</p:timing>`;
      animated += shapes.length;
    }
    const tr = TRANS[notes[si]] || TRANS.fade;
    xml = xml.replace(/<p:timing>[\s\S]*?<\/p:timing>/, '').replace(/<p:transition[\s\S]*?<\/p:transition>/, '');
    xml = xml.replace('</p:sld>', `${tr}${timing}</p:sld>`);
    zip.file(f, xml);
  }
  // Reempaquetar solo archivos (sin entradas de carpeta, que fallan en servicios en la nube).
  const clean = new JSZip();
  for (const k of Object.keys(zip.files)) if (!zip.files[k].dir) clean.file(k, await zip.file(k).async('nodebuffer'), { createFolders: false });
  fs.writeFileSync(OUT, await clean.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log(`OK ${OUT} · ${slideFiles.length} láminas · ${animated} formas animadas`);
})().catch((e) => { console.error(e); process.exit(1); });
