// Genera MCJ-Presentacion-Equipo.pptx (horizontal 16:9) con transiciones y animaciones nativas.
// Uso: NODE_PATH=<carpeta con pptxgenjs y jszip> node presentacion/build-pptx.cjs
// Unidades de diseño: puntos (1 pt = 1/72"). Lámina = 960 x 540 pt (13.333" x 7.5").
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
  pres.layout = 'LAYOUT_WIDE'; // 13.333" x 7.5" (16:9)
  pres.title = 'Mi Camino es Jesús · Equipo';
  pres.author = 'Mi Camino es Jesús';
  pres.theme = { headFontFace: FONT_H, bodyFontFace: FONT_B };

  const footer = (dark) => [
    { text: { text: 'MI CAMINO ES JESÚS', options: { x: I(48), y: I(510), w: I(300), h: I(14), fontSize: 8, bold: true, charSpacing: 2, color: dark ? '8FA0AE' : HEX.gray, fontFace: FONT_B, margin: 0 } } },
    { text: { text: 'EQUIPO MCJ', options: { x: I(612), y: I(510), w: I(300), h: I(14), fontSize: 8, bold: true, charSpacing: 2, color: dark ? '8FA0AE' : HEX.gray, align: 'right', fontFace: FONT_B, margin: 0 } } },
  ];
  const titlePh = (dark) => ({
    placeholder: {
      options: { name: 'title', type: 'title', x: I(48), y: I(100), w: I(864), h: I(46), fontFace: FONT_H, fontSize: 30, bold: true, color: dark ? HEX.bg : HEX.ink, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 0.92 },
      text: '',
    },
  });
  const eyebrowPh = (dark) => ({
    placeholder: {
      options: { name: 'eyebrow', type: 'body', x: I(84), y: I(80), w: I(780), h: I(14), fontFace: FONT_H, fontSize: 10, bold: true, charSpacing: 3, color: dark ? HEX.gold : HEX.red, align: 'left', margin: 0, valign: 'middle' },
      text: '',
    },
  });
  const layoutBase = (name, bg, dark, withTitle = true) => {
    const objects = [
      { image: { path: img(dark ? 'logos/isotipo-bn.png' : 'logos/isotipo.png'), x: I(48), y: I(24), w: I(42), h: I(42) } },
      ...footer(dark),
    ];
    if (withTitle) objects.push({ rect: { x: I(48), y: I(86), w: I(26), h: I(2), fill: { color: HEX.gold }, line: { color: HEX.gold, width: 0 } } }, eyebrowPh(dark), titlePh(dark));
    pres.defineSlideMaster({
      title: name,
      background: { color: bg },
      objects,
      slideNumber: { x: I(852), y: I(36), w: I(60), h: I(18), fontFace: FONT_H, fontSize: 11, bold: true, color: HEX.gold, align: 'right', margin: 0 },
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
  const L = 48, R = 912, W = R - L; // márgenes horizontales
  const label = (s, t, x, y, w, g, dark) => txt(s, t, x, y, w, 14, { size: 9.5, bold: true, cs: 2.5, color: dark ? HEX.gold : HEX.red, g, fx: 'fade' });

  // 01 PORTADA
  {
    const s = slide('MCJ_PORTADA', 'Bienvenida', 'fadeSlow', 'Bienvenida. Esta presentación es para todo el equipo: lo que somos, lo que tenemos, a qué nos vamos a dedicar y cómo.');
    pic(s, 'images/hero.webp', 440, 0, 520, 540, { g: 1, fx: 'fade' });
    box(s, 440, 0, 520, 540, HEX.ink, { round: false, transparency: 55, g: 1, fx: 'fade' });
    box(s, 440, 0, 70, 540, HEX.ink, { round: false, transparency: 15, g: 1, fx: 'fade' });
    pic(s, 'logos/isotipo-bn.png', L, 56, 100, 92, { contain: true, g: 2, fx: 'zoom' });
    txt(s, 'PARA EL EQUIPO DE', L, 178, 380, 18, { size: 12, bold: true, cs: 3, color: HEX.cream, g: 3, fx: 'fade' });
    txt(s, [{ text: 'MI CAMINO', options: { color: HEX.bg, breakLine: true } }, { text: 'ES ', options: { color: HEX.bg } }, { text: 'JESÚS', options: { color: HEX.gold } }], L, 202, 400, 110, { size: 48, bold: true, lh: 0.95, g: 3, fx: 'float' });
    box(s, L, 326, 250, 30, HEX.red, { r: 0.1, g: 4, fx: 'wipe' });
    txt(s, 'HACIA DÓNDE CAMINAMOS JUNTOS', L, 326, 250, 30, { size: 10, bold: true, cs: 2, color: HEX.white, align: 'center', valign: 'middle', g: 4, fx: 'wipe' });
    txt(s, 'Lo que somos, lo que ya tenemos, a qué nos vamos a dedicar y cómo lo vamos a hacer.', L, 374, 360, 50, { size: 14, color: 'C9D1D8', lh: 1.4, g: 5, fx: 'fade' });
    txt(s, 'EQUIPO MCJ · NOVIEMBRE 2026', L, 506, 380, 14, { size: 8, bold: true, cs: 2, color: '8FA0AE' });
  }

  // 02 CARTA
  {
    const s = slide('MCJ_CREMA', 'Bienvenida', 'fade', 'Leer la carta en voz alta. Es el tono de toda la presentación: gratitud primero.');
    head(s, 'Antes de empezar', ['GRACIAS POR ', { em: 'DECIR QUE SÍ' }]);
    box(s, L, 166, 540, 300, HEX.white, { shadow: true, g: 1, fx: 'float' });
    txt(s, [
      { text: 'Este proyecto no existe por un logo ni por un catálogo. Existe porque cada uno de ustedes decidió regalar su tiempo, su talento y su fe para que otros se encuentren con Jesús.', options: { breakLine: true, paraSpaceAfter: 10 } },
      { text: 'Empezamos en nuestra parroquia. En agosto dimos el primer paso fuera, con ' }, { text: 'Levántate y Sé Hombre', options: { bold: true, color: HEX.red } }, { text: '. Ahora toca crecer, y nadie recorre este camino solo.', options: { breakLine: true, paraSpaceAfter: 10 } },
      { text: 'Esta presentación es para que todos veamos el mismo mapa: qué tenemos, qué falta y dónde cabe cada quien.' },
    ], L + 26, 188, 488, 210, { size: 14.5, lh: 1.4, g: 1, fx: 'float' });
    pic(s, 'logos/isotipo.png', L + 26, 418, 38, 38, { contain: true, g: 2, fx: 'fade' });
    txt(s, [{ text: 'Equipo fundador', options: { bold: true, breakLine: true } }, { text: 'Pbro. Cristopher Cortés · Jehosua Castañeda', options: { color: HEX.gray, fontSize: 11.5 } }], L + 74, 418, 440, 40, { size: 13, g: 2, fx: 'fade' });
    pic(s, 'images/nosotros.webp', 620, 166, 292, 230, { g: 3, fx: 'fade' });
    box(s, 620, 414, 292, 52, HEX.ink, { g: 4, fx: 'zoom' });
    txt(s, [{ text: '“SÉ FUERTE Y VALIENTE”', options: { bold: true, color: HEX.cream, breakLine: true } }, { text: 'JOSUÉ 1:9', options: { fontSize: 9, color: HEX.gold, charSpacing: 2 } }], 620, 414, 292, 52, { size: 13, align: 'center', valign: 'middle', g: 4, fx: 'zoom' });
  }

  // 03 IDENTIDAD
  {
    const s = slide('MCJ_CLARO', 'Bienvenida', 'fade');
    head(s, 'Nuestra identidad', ['LO QUE ', { em: 'SOMOS' }, ', EN CORTO']);
    [['MISIÓN', 'Formar discípulos misioneros, jóvenes y adultos, que vivan, anuncien y sirvan el Evangelio con alegría, siendo un punto de quiebre para el mundo actual.', HEX.gold],
      ['VISIÓN', 'Ser una escuela de referencia en la Nueva Evangelización, donde cada persona, sin importar su edad, encuentre un camino claro de encuentro, formación y misión con Jesucristo.', HEX.red]].forEach(([l, t, c], i) => {
      const y = 166 + i * 156;
      box(s, L, y, 430, 144, HEX.white, { shadow: true, g: 1 + i });
      box(s, L + 20, y + 22, 10, 10, c, { r: 0.5, g: 1 + i });
      txt(s, l, L + 40, y + 19, 300, 16, { size: 10, bold: true, cs: 3, color: HEX.red, g: 1 + i });
      txt(s, t, L + 20, y + 46, 390, 90, { size: 14, lh: 1.35, g: 1 + i });
    });
    label(s, 'LOS 4 PILARES DE TODA EXPERIENCIA', 510, 166, 400, 3);
    [['ENCUENTRO', 'con Cristo vivo', HEX.cream, HEX.ink], ['FORMACIÓN', 'estudio, oración, sacramentos', HEX.red, HEX.white], ['COMUNIDAD', 'nadie camina solo', HEX.ink, HEX.white], ['MISIÓN', 'anunciar lo vivido', HEX.gold, HEX.ink2]].forEach(([t, d, bg, fg], i) => {
      const x = 510 + (i % 2) * 206, y = 190 + Math.floor(i / 2) * 142;
      box(s, x, y, 196, 130, bg, { g: 4 + i, fx: 'zoom' });
      txt(s, `0${i + 1}`, x + 18, y + 16, 60, 28, { size: 24, bold: true, color: fg, g: 4 + i, fx: 'zoom' });
      txt(s, t, x + 18, y + 64, 170, 20, { size: 15, bold: true, color: fg, g: 4 + i, fx: 'zoom' });
      txt(s, d, x + 18, y + 88, 170, 34, { size: 11.5, color: fg, g: 4 + i, fx: 'zoom' });
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
      const x = L + (i % 2) * 220, y = 166 + Math.floor(i / 2) * 156;
      box(s, x, y, 210, 144, bg, { g: 1 + i, fx: 'zoom' });
      txt(s, n, x + 20, y + 18, 180, 56, { size: 44, bold: true, color: nc, g: 1 + i, fx: 'zoom' });
      txt(s, l, x + 20, y + 86, 172, 44, { size: 12, bold: true, color: lc, g: 1 + i, fx: 'zoom' });
    });
    label(s, 'LO QUE YA ESTÁ LISTO', 520, 166, 380, 5);
    ready.forEach((r, i) => {
      const y = 190 + i * 40.5, g = 6 + i;
      box(s, 520, y, 392, 35, HEX.white, { r: 0.2, g });
      box(s, 534, y + 12, 11, 11, HEX.green, { r: 0.5, g });
      txt(s, r.title, 556, y, 210, 35, { size: 12, bold: true, valign: 'middle', g });
      txt(s, `${DEREJ[r.derej].name} · ${tipoOf(r)}`, 760, y, 140, 35, { size: 10, color: HEX.gray, align: 'right', valign: 'middle', g });
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
      const x = L + (i % 3) * 292, y = 166 + Math.floor(i / 3) * 160, g = 1 + i;
      box(s, x, y, 280, 148, HEX.inkSoft, { line: '2E475B', g });
      txt(s, `0${i + 1}`, x + 20, y + 16, 60, 30, { size: 24, bold: true, color: HEX.gold, g });
      txt(s, t, x + 20, y + 54, 244, 20, { size: 13, bold: true, color: HEX.bg, g });
      txt(s, d, x + 20, y + 78, 244, 64, { size: 11.5, color: 'C9D1D8', lh: 1.3, g });
    });
  }

  // 06 HOJA DE RUTA
  {
    const s = slide('MCJ_CLARO', 'Plan de trabajo', 'push', 'Ojo: marzo concentra Fuiste Hecha Mujer y Barrabás (Semana Santa, 21–27 de marzo de 2027). Conviene definir equipos distintos para cada uno.');
    head(s, 'Hoja de ruta', ['DE DICIEMBRE ', { em: 'A MAYO' }]);
    const RT = [
      ['FIN DIC 2026', 'Entrega: El Arca de Noé', 'Dérej Simjá · Angélica', HEX.gold],
      ['ENE 2027', 'Piloto: Fuiste Hecha Mujer', 'Dérej Kavod · solo mujeres del equipo', HEX.red],
      ['FIN ENE 2027', 'Entrega: Esclava del Señor', 'Dérej Mesharét · Maribel', HEX.gold],
      ['FEB 2027', 'Levántate y Sé Hombre · 2ª edición', 'Dérej Guibor · paso 1', HEX.red],
      ['MAR 2027', 'Fuiste Hecha Mujer', 'Dérej Kavod · paso 1', HEX.red],
      ['SEMANA SANTA', 'Barrabás · retiro para la comunidad', 'Dérej Jaím · 21 al 27 de marzo', HEX.cuaresma],
      ['ABR–MAY 2027', 'Sansón', 'Dérej Guibor · paso 2', HEX.red],
    ];
    const cw = (W - 6 * 10) / 7;
    box(s, L + cw / 2, 211, W - cw, 2, HEX.line, { round: false, g: 1, fx: 'wipe' });
    RT.forEach(([d, t, m, c], i) => {
      const x = L + i * (cw + 10), g = 2 + i;
      txt(s, d, x, 172, cw, 16, { size: 9.5, bold: true, cs: 1, color: HEX.gold, align: 'center', g });
      box(s, x + cw / 2 - 9, 203, 18, 18, c, { r: 0.5, line: HEX.bg, lineW: 2.5, g, fx: 'zoom' });
      box(s, x, 238, cw, 196, HEX.white, { shadow: true, g });
      txt(s, t, x + 12, 252, cw - 24, 80, { size: 13, bold: true, lh: 1.2, g });
      txt(s, m, x + 12, 356, cw - 24, 66, { size: 10.5, color: HEX.gray, lh: 1.25, g });
    });
    box(s, L, 452, W, 40, HEX.cream, { g: 9, fx: 'fade' });
    txt(s, [{ text: 'OJO CON MARZO  ', options: { bold: true, color: HEX.red, charSpacing: 1.5 } }, { text: 'Fuiste Hecha Mujer y Barrabás caen el mismo mes: conviene definir equipos de servicio distintos.' }], L + 16, 452, W - 32, 40, { size: 11.5, valign: 'middle', g: 9, fx: 'fade' });
  }

  // 07 CÓMO LO HACEMOS
  {
    const s = slide('MCJ_CREMA', 'Plan de trabajo', 'fade');
    head(s, 'Cómo lo vamos a hacer', ['CADA EXPERIENCIA SE ', { em: 'CONSTRUYE IGUAL' }]);
    txt(s, '1 · CADA TEMA SIGUE LA MISMA ESTRUCTURA', L, 164, 500, 16, { size: 10.5, bold: true, cs: 1.5, g: 1, fx: 'fade' });
    ['Evocación bíblica', 'Actividad introductoria', 'Contenido', 'Símbolos', 'Reflexión'].forEach((t, i) => {
      const bw = (W - 4 * 10) / 5, x = L + i * (bw + 10), g = 2 + i, alt = i % 2;
      box(s, x, 188, bw, 66, alt ? HEX.red : HEX.white, { g, fx: 'zoom' });
      txt(s, String(i + 1), x + 16, 188, 34, 66, { size: 26, bold: true, color: alt ? HEX.cream : HEX.red, valign: 'middle', g, fx: 'zoom' });
      txt(s, t, x + 52, 188, bw - 60, 66, { size: 12, bold: true, color: alt ? HEX.white : HEX.ink, valign: 'middle', g, fx: 'zoom' });
    });
    txt(s, '2 · CADA FORMATO TIENE SU FICHA TÉCNICA', L, 280, 420, 16, { size: 10.5, bold: true, cs: 1.5, g: 7, fx: 'fade' });
    const rows = [['', 'DURACIÓN', 'PERSONAS'], ['Retiro', '2 a 3 días', '25 a 80'], ['Taller', '4 a 6 horas', '15 a 40'], ['Hora Santa', '1 a 3 horas', '30 a 120']];
    rows.forEach((r, i) => {
      const y = 304 + i * 36;
      box(s, L, y, 420, 34, i === 0 ? HEX.ink : HEX.white, { r: i === 0 ? 0.25 : 0.12, g: 8 });
      r.forEach((c, j) => txt(s, c, [L + 14, L + 160, L + 300][j], y, [140, 130, 110][j], 34, { size: i === 0 ? 9.5 : 13, bold: i === 0 || j === 0, cs: i === 0 ? 1.5 : undefined, color: i === 0 ? HEX.cream : HEX.ink, valign: 'middle', g: 8 }));
    });
    txt(s, 'Espacio: capilla con Sagrario y salón con sillas móviles.', L, 454, 420, 16, { size: 10.5, color: HEX.gray, g: 8 });
    txt(s, '3 · DE LA IDEA AL CATÁLOGO', 500, 280, 412, 16, { size: 10.5, bold: true, cs: 1.5, g: 9, fx: 'fade' });
    ['Redactar', 'Revisión espiritual', 'Piloto', 'Lista'].forEach((t, i) => {
      const x = 500 + i * 106, g = 10 + i;
      box(s, x, 304, 92, 52, i === 3 ? HEX.green : HEX.cream, { g, fx: 'wipe' });
      txt(s, t, x + 4, 304, 84, 52, { size: 11.5, bold: true, color: i === 3 ? HEX.white : HEX.ink, align: 'center', valign: 'middle', g, fx: 'wipe' });
      if (i < 3) txt(s, '→', x + 92, 316, 14, 28, { size: 13, bold: true, color: HEX.gold, align: 'center', g, fx: 'wipe' });
    });
    box(s, 500, 374, 412, 98, HEX.white, { shadow: true, g: 14 });
    txt(s, 'EJEMPLO EN MARCHA', 518, 386, 380, 14, { size: 9.5, bold: true, cs: 2, color: HEX.red, g: 14 });
    txt(s, 'Fuiste Hecha Mujer tendrá su piloto en enero, solo con las mujeres del equipo, antes de abrirse en marzo. Así probamos dinámicas, tiempos y logística.', 518, 404, 380, 62, { size: 12, lh: 1.3, g: 14 });
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
    head(s, 'Método XP Lev · Dérej significa “camino” en hebreo', ['LOS 6 ', { em: 'DÉREJ' }, ' DE UN VISTAZO'], true);
    ORDER.forEach((k, i) => {
      const items = byDerej[k] || []; const r = items.filter(isReady).length;
      const x = L + (i % 3) * 292, y = 166 + Math.floor(i / 3) * 128, g = 1 + i;
      box(s, x, y, 280, 116, HEX.inkSoft, { line: '2E475B', g });
      box(s, x + 16, y + 16, 46, 46, i % 2 ? HEX.gold : HEX.red, { r: 0.2, g });
      txt(s, DJ[k].code, x + 16, y + 16, 46, 46, { size: 11.5, bold: true, color: i % 2 ? HEX.ink : HEX.bg, align: 'center', valign: 'middle', g });
      txt(s, DEREJ[k].name.toUpperCase(), x + 74, y + 16, 140, 20, { size: 13.5, bold: true, color: HEX.bg, g });
      txt(s, DEREJ[k].audience, x + 74, y + 38, 140, 26, { size: 10, color: 'AEBBC6', g });
      txt(s, `${r}/${items.length}`, x + 210, y + 14, 56, 26, { size: 18, bold: true, color: HEX.gold, align: 'right', g });
      txt(s, 'LISTAS', x + 210, y + 40, 56, 12, { size: 7.5, bold: true, cs: 1.5, color: '8FA0AE', align: 'right', g });
      txt(s, DJ[k].esq, x + 16, y + 76, 248, 14, { size: 9.5, color: 'AEBBC6', g });
      box(s, x + 16, y + 96, 248, 5, '34495A', { r: 0.5, g });
      box(s, x + 16, y + 96, Math.max(248 * r / items.length, 6), 5, HEX.gold, { r: 0.5, g, fx: 'wipe' });
    });
    box(s, L, 432, W, 46, HEX.red, { g: 8, fx: 'zoom' });
    txt(s, [{ text: '+ PEREGRINOS', options: { bold: true, color: HEX.cream } }, { text: '   la nueva dimensión de peregrinaciones por México y el mundo, a cargo de Silvia Ponce', options: { color: HEX.white } }], L + 18, 432, W - 36, 46, { size: 12.5, valign: 'middle', g: 8, fx: 'zoom' });
  }

  // 09–14 UNA LÁMINA POR DÉREJ
  ORDER.forEach((k, idx) => {
    const d = DJ[k], info = DEREJ[k], items = byDerej[k] || [];
    const s = slide('MCJ_DEREJ', 'Los 6 Dérej', 'push', `${info.name}: ${d.why} ${d.tip}`);
    const nReady = items.filter(isReady).length;
    const PW = 300; // panel izquierdo
    const accent = d.color === HEX.ink ? HEX.gold : HEX.cream;
    box(s, L, 88, PW, 404, d.color, { g: 1, fx: 'zoom' });
    txt(s, `DÉREJ ${idx + 1} DE 6`, L + 20, 104, 180, 14, { size: 9, bold: true, cs: 2, color: accent, g: 1, fx: 'zoom' });
    txt(s, info.audience.toUpperCase(), L + 20, 120, 180, 14, { size: 9, bold: true, cs: 1.5, color: HEX.white, g: 1, fx: 'zoom' });
    box(s, L + PW - 86, 102, 68, 60, HEX.white, { transparency: 85, r: 0.18, g: 1, fx: 'zoom' });
    txt(s, [{ text: String(nReady), options: { fontSize: 24, bold: true } }, { text: `/${items.length}`, options: { fontSize: 12 } }], L + PW - 86, 104, 68, 32, { color: HEX.white, align: 'center', g: 1, fx: 'zoom' });
    txt(s, 'LISTAS', L + PW - 86, 140, 68, 12, { size: 7.5, bold: true, cs: 2, color: HEX.white, align: 'center', g: 1, fx: 'zoom' });
    txt(s, info.name.toUpperCase(), L + 20, 170, PW - 40, 32, { size: 26, bold: true, color: HEX.white, g: 1, fx: 'zoom' });
    txt(s, [{ text: info.subtitle, options: { breakLine: true } }, { text: d.heb, options: { italic: true, color: accent } }], L + 20, 204, PW - 40, 34, { size: 11, color: 'E6E0D6', g: 1, fx: 'zoom' });
    txt(s, [{ text: d.route.toUpperCase(), options: { bold: true, color: accent, charSpacing: 1, breakLine: true } }, { text: d.esq, options: { color: HEX.white } }], L + 20, 250, PW - 40, 32, { size: 9.5, g: 2, fx: 'fade' });
    txt(s, d.why, L + 20, 290, PW - 40, 110, { size: 11, color: 'E6E0D6', lh: 1.3, g: 2, fx: 'fade' });
    box(s, L + 14, 404, PW - 28, 76, HEX.white, { transparency: 88, r: 0.12, g: 2, fx: 'fade' });
    txt(s, 'DATO CLAVE', L + 26, 412, PW - 52, 12, { size: 8, bold: true, cs: 2, color: accent, g: 2, fx: 'fade' });
    txt(s, d.tip, L + 26, 426, PW - 52, 50, { size: 10, color: HEX.white, lh: 1.2, g: 2, fx: 'fade' });

    // lista de experiencias (derecha)
    const X0 = L + PW + 20, RW = R - X0;
    const two = items.length > 6;
    const colW = two ? (RW - 12) / 2 : RW;
    const half = Math.ceil(items.length / 2);
    const cols = two ? [items.slice(0, half), items.slice(half)] : [items];
    let g = 3;
    cols.forEach((col, ci) => {
      let y = 88; const x = X0 + ci * (colW + 12);
      col.forEach((r) => {
        if (d.phases?.[r.paso]) { txt(s, d.phases[r.paso], x + 4, y, 200, 13, { size: 8.5, bold: true, cs: 2.5, color: HEX.red, g, fx: 'fade' }); y += 15; }
        const [name, suffix] = r.title.split(' · ');
        const plan = PLAN[r.title]; const ok = isReady(r);
        const lab = plan || (ok ? 'Lista' : 'En preparación');
        const cwid = Math.round(lab.length * 5.1 + 16);
        const concept = two ? '' : r.conceptoCentral;
        const cl = concept ? Math.ceil(concept.length / 88) : 0;
        const h = two ? (suffix ? 56 : 46) : 46 + cl * 13;
        box(s, x, y, colW, h, HEX.white, { line: ok ? HEX.green : undefined, lineW: 1.25, r: 0.14, g });
        const hasNum = r.paso != null; const tx = x + (hasNum ? 34 : 14);
        if (hasNum) txt(s, String(r.paso), x + 6, y, 24, h, { size: 15, bold: true, color: HEX.red, align: 'center', valign: 'middle', g });
        const tw = x + colW - 12 - tx;
        txt(s, name, tx, y + 7, tw - (two ? 0 : cwid + 8), 16, { size: 12, bold: true, g });
        let yy = y + 25;
        if (two && suffix) { txt(s, suffix, tx, yy, tw, 13, { size: 9.5, italic: true, color: HEX.red, g }); yy += 14; }
        const corte = d.corte && r.corte ? ` · ${CORTES_SIMJA[r.corte].name}` : '';
        box(s, tx, yy + 4, 6, 6, HEX[r.season] || HEX.green, { r: 0.5, g });
        txt(s, `${tipoOf(r)} · ${SEASON[r.season]}${corte}`, tx + 10, yy, tw - cwid - 14, 13, { size: 9.5, color: HEX.gray, g });
        // chip de estado/plan: en una columna va junto al título; en dos, en la línea de datos
        const cy = two ? yy - 2 : y + 7;
        box(s, x + colW - 12 - cwid, cy, cwid, 17, plan ? HEX.gold : ok ? HEX.green : HEX.white, { line: plan || ok ? undefined : 'C9C2B4', r: 0.5, g });
        txt(s, lab.toUpperCase(), x + colW - 12 - cwid, cy, cwid, 17, { size: 7, bold: true, color: plan || ok ? HEX.white : HEX.gray, align: 'center', valign: 'middle', g });
        if (concept) txt(s, concept, tx, y + 40, tw, cl * 13 + 2, { size: 10, color: '3B4B58', lh: 1.15, g });
        y += h + 6; g++;
      });
    });
  });

  // ======================= SECCIÓN: PEREGRINOS =======================
  pres.addSection({ title: 'Peregrinos' });

  // 15 PEREGRINOS
  {
    const s = slide('MCJ_OSCURO', 'Peregrinos', 'fadeSlow', 'Peregrinos: nueva dimensión de MCJ, a cargo de Silvia Ponce, agente de viajes certificada y ex agente de la Pastoral Vocacional de Piedras Negras, Coahuila.');
    head(s, 'Nueva dimensión', ['PEREGRINOS: ', { em: 'CAMINAR PARA ENCONTRARLO' }], true);
    const pts = [[64, 196], [160, 172], [256, 196], [352, 172], [436, 192]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      s.addShape(pres.ShapeType.line, { x: I(x1), y: I(Math.min(y1, y2)), w: I(x2 - x1), h: I(Math.abs(y2 - y1)), flipV: y2 < y1, line: { color: HEX.gold, width: 1.5, dashType: 'dash' }, ...nm(1 + i, 'wipe') });
    }
    ['MÉXICO', '', 'EL MUNDO', '', 'LA FE'].forEach((l, i) => {
      const [x, y] = pts[i];
      box(s, x - 8, y - 8, 16, 16, i % 2 ? HEX.gold : HEX.red, { r: 0.5, line: HEX.ink, lineW: 2, g: 1 + i, fx: 'zoom' });
      if (l) txt(s, l, x - 50, y + 12, 100, 13, { size: 8.5, bold: true, cs: 2, color: HEX.cream, align: 'center', g: 1 + i, fx: 'zoom' });
    });
    txt(s, 'Peregrinaciones a lo largo de México y del mundo para acercar a las personas a Cristo y a la historia de la fe: los lugares donde la fe se vivió, se defendió y se sigue viviendo.', L, 234, 400, 70, { size: 13, color: 'DCE3E8', lh: 1.4, g: 6, fx: 'fade' });
    box(s, L, 318, 400, 172, HEX.bg, { g: 7, fx: 'zoom' });
    s.addShape(pres.ShapeType.ellipse, { x: I(L + 18), y: I(336), w: I(66), h: I(66), fill: { color: HEX.red }, line: { color: HEX.red, width: 0 }, ...nm(7, 'zoom') });
    txt(s, 'SP', L + 18, 336, 66, 66, { size: 22, bold: true, color: HEX.cream, align: 'center', valign: 'middle', g: 7, fx: 'zoom' });
    txt(s, 'A CARGO DE', L + 100, 338, 280, 12, { size: 8.5, bold: true, cs: 2, color: HEX.red, g: 7, fx: 'zoom' });
    txt(s, 'Silvia Ponce', L + 100, 352, 280, 24, { size: 19, bold: true, g: 7, fx: 'zoom' });
    txt(s, 'Agente de viajes certificada', L + 100, 380, 280, 16, { size: 11.5, bold: true, color: HEX.gold, g: 7, fx: 'zoom' });
    txt(s, 'Ex agente de la Pastoral Vocacional de Piedras Negras, Coahuila. Une la experiencia pastoral con la logística profesional de viajes.', L + 18, 418, 364, 60, { size: 11, color: '3B4B58', lh: 1.3, g: 8, fx: 'fade' });
    [['QUÉ ES', 'Una dimensión dedicada solo a peregrinar: viajes con sentido, preparados y acompañados.'], ['PARA QUIÉN', 'Para fieles y para quienes aún no conocen a Cristo: el camino también evangeliza.'], ['CÓMO SE INTEGRA', 'Cada peregrinación es un retiro en movimiento: encuentro, formación, comunidad y misión.']].forEach(([t, dd], i) => {
      const y = 166 + i * 110, g = 9 + i;
      box(s, 476, y, 436, 98, HEX.inkSoft, { line: '2E475B', g });
      txt(s, `0${i + 1}`, 496, y + 16, 50, 30, { size: 24, bold: true, color: HEX.gold, g });
      txt(s, t, 556, y + 18, 336, 14, { size: 10, bold: true, cs: 2, color: HEX.gold, g });
      txt(s, dd, 556, y + 38, 336, 52, { size: 12.5, color: HEX.bg, lh: 1.3, g });
    });
  }

  // ======================= SECCIÓN: CALENDARIO Y ALIADOS =======================
  pres.addSection({ title: 'Calendario y aliados' });

  // 16 CALENDARIO
  {
    const s = slide('MCJ_CREMA', 'Calendario y aliados', 'fade');
    head(s, 'Calendario litúrgico', ['QUÉ VIVIR EN ', { em: 'CADA TIEMPO' }]);
    const cw = (W - 3 * 12) / 4;
    ['adviento', 'cuaresma', 'pascua', 'pentecostes'].forEach((sk, i) => {
      const it = retreats.filter((r) => r.season === sk);
      const x = L + i * (cw + 12), g = 1 + i;
      box(s, x, 166, cw, 270, HEX.white, { g });
      box(s, x, 166, cw, 38, HEX[sk], { r: 0.2, g });
      txt(s, SEASON[sk].toUpperCase(), x + 14, 166, cw - 60, 38, { size: 11.5, bold: true, cs: 2, color: HEX.white, valign: 'middle', g });
      txt(s, String(it.length), x + cw - 50, 166, 36, 38, { size: 12, bold: true, color: HEX.white, align: 'right', valign: 'middle', g });
      it.forEach((r, j) => {
        const ok = isReady(r), plan = !!PLAN[r.title];
        const y = 216 + j * 34;
        box(s, x + 12, y, cw - 24, 28, ok ? HEX.green : plan ? HEX.gold : HEX.bgAlt, { r: 0.5, g });
        txt(s, r.title.split(' · ')[0].split(':')[0], x + 22, y, cw - 44, 28, { size: 10.5, bold: true, color: ok || plan ? HEX.white : HEX.ink, valign: 'middle', g });
      });
    });
    const nOrd = retreats.filter((r) => r.season === 'ordinario').length;
    txt(s, [{ text: 'Verde', options: { bold: true, color: HEX.green } }, { text: ' = lista   ·   ' }, { text: 'Dorado', options: { bold: true, color: HEX.gold } }, { text: ` = con fecha   ·   Las otras ${nOrd} experiencias pueden vivirse en cualquier momento del Tiempo Ordinario.` }], L, 452, W, 30, { size: 11, color: HEX.gray, valign: 'middle', g: 6, fx: 'fade' });
  }

  // 17 ALIADOS + ARZOBISPADO
  {
    const s = slide('MCJ_CLARO', 'Calendario y aliados', 'fade');
    head(s, 'Más allá de la escuela', ['NO CAMINAMOS ', { em: 'SOLOS' }]);
    txt(s, 'LO QUE PEDIREMOS A LA ARQUIDIÓCESIS', L, 164, 420, 16, { size: 10.5, bold: true, cs: 1.5, g: 1, fx: 'fade' });
    [['Reconocimiento formal', 'como escuela de Nueva Evangelización'], ['Difusión en parroquias', 'recomendación a párrocos y decanatos'], ['Vinculación pastoral', 'con Pastoral Juvenil, Familiar y Catequesis'], ['Espacios y sedes', 'casas de retiro y templos']].forEach(([t, d], i) => {
      const x = L + (i % 2) * 216, y = 188 + Math.floor(i / 2) * 104, g = 2 + i;
      box(s, x, y, 206, 94, HEX.bgAlt, { g, fx: 'zoom' });
      txt(s, `0${i + 1}`, x + 16, y + 12, 40, 20, { size: 15, bold: true, color: HEX.red, g, fx: 'zoom' });
      txt(s, t.toUpperCase(), x + 16, y + 38, 180, 16, { size: 11, bold: true, g, fx: 'zoom' });
      txt(s, d, x + 16, y + 56, 180, 32, { size: 10.5, color: HEX.gray, g, fx: 'zoom' });
    });
    box(s, L, 404, 422, 86, HEX.ink, { g: 6, fx: 'float' });
    txt(s, 'Y PEREGRINOS', L + 18, 416, 380, 14, { size: 9.5, bold: true, cs: 2, color: HEX.gold, g: 6, fx: 'float' });
    txt(s, 'Las peregrinaciones abren una puerta natural para vincularnos con santuarios, parroquias y diócesis de México y del mundo.', L + 18, 434, 386, 48, { size: 12, color: HEX.bg, lh: 1.3, g: 6, fx: 'float' });
    txt(s, 'PROYECTOS ALIADOS', 500, 164, 412, 16, { size: 10.5, bold: true, cs: 1.5, g: 7, fx: 'fade' });
    [['images/karposhub.png', 'KARPOS HUB', 'Red profesional católica: profesionales y empresas que viven su fe en el trabajo.'], ['images/proyecto-ignis.webp', 'IGNIS', 'Ropa urbana católica: fe y estilo urbano para expresarla todos los días.'], ['images/proyecto-ignis-et-logos.webp', 'IGNIS ET LOGOS', 'Evangelización en redes: reels y videos con el Evangelio.']].forEach(([p, t, d], i) => {
      const y = 188 + i * 102, g = 8 + i;
      box(s, 500, y, 412, 92, HEX.white, { shadow: true, g });
      pic(s, p, 514, y + 12, 68, 68, { contain: true, g });
      txt(s, t, 598, y + 16, 300, 18, { size: 13, bold: true, g });
      txt(s, d, 598, y + 38, 300, 46, { size: 11, color: HEX.gray, lh: 1.25, g });
    });
  }

  // ======================= SECCIÓN: EQUIPO =======================
  pres.addSection({ title: 'Equipo y cierre' });

  // 18 EQUIPO
  {
    const s = slide('MCJ_CREMA', 'Equipo y cierre', 'fade');
    head(s, 'Nuestro equipo', ['QUIÉNES ', { em: 'HOY' }, ' LO HACEN POSIBLE']);
    const T = [
      ['images/p-cristopher.jpeg', 'Pbro. Cristopher Cortés Pliego', 'Fundador · Asesor espiritual', ''],
      ['images/jehosua.jpg', 'Jehosua A. Castañeda Ortiz', 'Fundador · Eq. pastoral', ''],
      ['images/maribel.jpeg', 'Maribel Pinto Corona', 'Equipo pastoral', 'Esclava del Señor · fin de enero'],
      ['images/angy.jpeg', 'Angélica M. Romero Hernández', 'Equipo pastoral', 'El Arca de Noé · fin de diciembre'],
      [null, 'Silvia Ponce', 'Responsable de Peregrinos', 'Agente de viajes certificada'],
    ];
    const cw = (W - 4 * 12) / 5;
    T.forEach(([p, n, r, extra], i) => {
      const x = L + i * (cw + 12), g = 1 + i;
      box(s, x, 166, cw, 290, HEX.white, { shadow: true, g });
      if (p) pic(s, p, x + (cw - 120) / 2, 184, 120, 120, { round: true, g });
      else { s.addShape(pres.ShapeType.ellipse, { x: I(x + (cw - 120) / 2), y: I(184), w: I(120), h: I(120), fill: { color: HEX.red }, line: { color: HEX.red, width: 0 }, ...nm(g) }); txt(s, 'SP', x + (cw - 120) / 2, 184, 120, 120, { size: 32, bold: true, color: HEX.cream, align: 'center', valign: 'middle', g }); }
      txt(s, n, x + 10, 318, cw - 20, 40, { size: 12.5, bold: true, align: 'center', lh: 1.15, g });
      txt(s, r.toUpperCase(), x + 10, 362, cw - 20, 26, { size: 8.5, bold: true, cs: 1, color: HEX.red, align: 'center', g });
      if (extra) txt(s, extra, x + 10, 400, cw - 20, 40, { size: 10.5, color: HEX.gray, align: 'center', g });
    });
    txt(s, '…y el siguiente lugar en esta lámina puede ser el tuyo.', L, 468, W, 20, { size: 12.5, italic: true, color: HEX.gray, align: 'center', g: 6, fx: 'fade' });
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
      const y = 166 + i * 82, g = 1 + i;
      box(s, L, y, 500, 1, '3A5063', { round: false, g, fx: 'fade' });
      txt(s, `0${i + 1}`, L, y + 14, 50, 30, { size: 24, bold: true, color: HEX.gold, g });
      txt(s, t, L + 56, y + 14, 444, 18, { size: 13.5, bold: true, color: HEX.bg, g });
      txt(s, d, L + 56, y + 36, 444, 40, { size: 12, color: 'C9D1D8', lh: 1.3, g });
    });
    pic(s, 'images/nosotros.webp', 580, 166, 332, 326, { g: 5, fx: 'fade' });
    box(s, 596, 450, 250, 26, HEX.red, { r: 0.15, g: 6, fx: 'wipe' });
    txt(s, 'NADIE RECORRE ESTE CAMINO SOLO', 596, 450, 250, 26, { size: 9.5, bold: true, cs: 1.5, color: HEX.white, align: 'center', valign: 'middle', g: 6, fx: 'wipe' });
  }

  // 20 CIERRE
  {
    const s = slide('MCJ_PORTADA', 'Equipo y cierre', 'fadeSlow', 'Cierre. Josué 1:9.');
    box(s, 380, 50, 200, 150, HEX.bg, { r: 0.12, g: 1, fx: 'zoom' });
    pic(s, 'logos/logotipo.png', 396, 62, 168, 126, { contain: true, g: 1, fx: 'zoom' });
    txt(s, [{ text: '“SÉ FUERTE Y ', options: { color: HEX.bg } }, { text: 'VALIENTE', options: { color: HEX.gold } }, { text: '”', options: { color: HEX.bg } }], L, 226, W, 50, { size: 38, bold: true, align: 'center', g: 2, fx: 'float' });
    txt(s, 'JOSUÉ 1:9', L, 280, W, 16, { size: 11, bold: true, cs: 3, color: HEX.cream, align: 'center', g: 2, fx: 'float' });
    txt(s, 'No tengas miedo ni te acobardes, porque el Señor tu Dios estará contigo dondequiera que vayas.', 230, 318, 500, 50, { size: 15, italic: true, color: HEX.cream, align: 'center', lh: 1.4, g: 3, fx: 'fade' });
    txt(s, 'Gracias por caminar con nosotros. Lo mejor de MCJ todavía no ha pasado.', 230, 388, 500, 22, { size: 13, color: 'C9D1D8', align: 'center', g: 4, fx: 'fade' });
    txt(s, '#micaminoesjesus #equipomcj #xplev #peregrinos', L, 426, W, 18, { size: 10.5, bold: true, color: HEX.gold, align: 'center', g: 5, fx: 'fade' });
    txt(s, '© 2026 MI CAMINO ES JESÚS', L, 506, W, 14, { size: 8, bold: true, cs: 2, color: '8FA0AE', align: 'center' });
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
