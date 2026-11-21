// Genera mcj-equipo.html a partir del catálogo real (src/data/retreats.js).
// Uso: node presentacion/build-equipo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../src/data/retreats.js'), 'utf8');
// Las imágenes no importan aquí: se sustituyen los imports por null.
const stubs = [...src.matchAll(/^import (\w+) from .*$/gm)].map((m) => `const ${m[1]} = null;`).join('\n');
const code = stubs + '\n' + src.replace(/^import .*$/gm, '');
const { retreats, DEREJ, CORTES_SIMJA } = await import('data:text/javascript,' + encodeURIComponent(code));

const READY = new Set(['publicado', 'disponible']);
const isReady = (r) => READY.has(r.estado);
const TIPO = { Retiro: 'Retiro', Taller: 'Taller', 'Adoración': 'Adoración', retiro: 'Retiro', taller: 'Taller', hora_santa: 'Hora Santa', estaciones: 'Estaciones' };
const tipoOf = (r) => TIPO[r.category] || TIPO[r.tipo] || '—';
const SEASON = { ordinario: 'Ordinario', adviento: 'Adviento', cuaresma: 'Cuaresma', pascua: 'Pascua', pentecostes: 'Pentecostés' };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const byDerej = {};
for (const r of retreats) (byDerej[r.derej] ??= []).push(r);
for (const k in byDerej) byDerej[k].sort((a, b) => (a.paso ?? 99) - (b.paso ?? 99));

const total = retreats.length;
const ready = retreats.filter(isReady);
const TOTAL_SLIDES = 18;
let n = 0;
const top = (dark) => {
  n++;
  return `<div class="top"><img src="assets/logos/${dark ? 'isotipo-bn' : 'isotipo'}.png" alt=""><span class="num">${String(n).padStart(2, '0')} / ${TOTAL_SLIDES}</span></div>`;
};
const foot = (r = 'Equipo MCJ') => `<div class="foot"><span>Mi Camino es Jesús</span><span>${r}</span></div>`;
const status = (r) => (isReady(r) ? '<span class="st ok">Lista</span>' : '<span class="st">En preparación</span>');
const season = (r) => `<i class="sd sd-${r.season}" title="${SEASON[r.season]}"></i>`;

// ---------- Fichas por Dérej (texto pastoral + estructura) ----------
const DJ = {
  guibor: {
    code: 'GBR', color: 'red', heb: 'Guibor = guerrero, valiente',
    route: 'Ruta Hombría Bíblica',
    esquema: 'Secuencial · 6 retiros en orden',
    why: 'Un itinerario para hombres que recorre, paso a paso, lo que significa ser hombre a la luz de Cristo: identidad, fortaleza, familia, amistad, paternidad y herencia. Cada retiro se apoya en un hombre de la Biblia.',
    tip: 'El orden importa: cada paso construye sobre el anterior. Quien vivió “Levántate” espera el paso 2.',
    detail: 'concept',
  },
  kavod: {
    code: 'KVD', color: 'gold', heb: 'Kavod = gloria, dignidad, peso',
    route: 'Ruta Mujer Nueva',
    esquema: 'Secuencial · 6 retiros en orden',
    why: 'Una secuencia de autodescubrimiento y sanación para mujeres: la dignidad original, la lealtad, la sed de amor verdadero, el servicio y la valentía. Cada retiro se apoya en una mujer de la Biblia.',
    tip: 'Aún no hay ningún paso listo: es el Dérej que más necesita manos para redactar.',
    detail: 'concept',
  },
  oz: {
    code: 'OZ', color: 'red', heb: 'Oz = fortaleza',
    route: 'Del llamado a la misión',
    esquema: '10 hitos · orden sugerido, no obligatorio',
    why: 'Pastoral juvenil (13–30 años) en tres movimientos: el llamado (1–3), el discipulado (4–8) y el envío (9–10). Cada parroquia puede tomarlos de forma modular según su ciclo anual.',
    tip: 'Ya hay 3 hitos listos y los tres son de Pascua: base natural para arrancar Oz.',
    detail: 'concept',
    phases: { 1: 'Llamado', 4: 'Discipulado', 9: 'Envío' },
  },
  simja: {
    code: 'SMJ', color: 'gold', heb: 'Simjá = alegría',
    route: 'Infancia misionera y catequesis',
    esquema: 'Estaciones · formato no lineal',
    why: 'Pedagogía bíblica, asombro y oración para niños de hasta 12 años, en dos cortes: Kínder (4–6) y Primaria (7–12). Cada actividad es un circuito de estaciones alrededor de un pasaje.',
    tip: 'Ideal para catequesis parroquial: módulos cortos que se insertan en lo que ya existe.',
    detail: 'concept',
    corte: true,
  },
  mesharet: {
    code: 'MSH', color: 'red', heb: 'Mesharét = el que sirve',
    route: 'Formación de servidores',
    esquema: 'Catálogo abierto · módulos independientes',
    why: 'Talleres para revitalizar el celo pastoral, la técnica evangelizadora y la comunión del equipo servidor. Un módulo por ministerio: predicación, intercesión, hospitalidad, monaguillos, catequesis y técnica.',
    tip: 'Es la clave para crecer: sin servidores formados, no hay forma de multiplicar los retiros.',
    detail: 'concept',
  },
  jaim: {
    code: 'JM', color: 'gold', heb: 'Jaím = vida',
    route: 'Para toda la comunidad',
    esquema: 'Catálogo abierto · por tiempo litúrgico',
    why: 'Retiros de impacto, talleres y Horas Santas temáticas para la comunidad parroquial en general, organizados según el calendario de la Iglesia.',
    tip: 'Aquí está lo que ya podemos ofrecer este Adviento: Emmanuel y Camino a Belén.',
    detail: 'compact',
  },
};
const ORDER = ['guibor', 'kavod', 'oz', 'simja', 'mesharet', 'jaim'];

function derejSlide(key, idx) {
  const d = DJ[key], info = DEREJ[key], items = byDerej[key] || [];
  const nReady = items.filter(isReady).length;
  const rows = items.map((r, i) => {
    const phase = d.phases?.[r.paso] ? `<div class="phase">${d.phases[r.paso]}</div>` : '';
    const num = r.paso ? `<b class="pn">${r.paso}</b>` : '';
    const corte = d.corte && r.corte ? ` · ${CORTES_SIMJA[r.corte].name}` : '';
    const sub = d.detail === 'concept'
      ? `<span class="cc">${esc(r.conceptoCentral)}</span>`
      : '';
    return `${phase}<div class="it ${isReady(r) ? 'is-ok' : ''} ${d.detail} ${r.paso ? '' : 'nonum'}">${num}<div class="tx"><div class="tt">${esc(r.title)}</div><div class="mt">${season(r)}${tipoOf(r)} · ${SEASON[r.season]}${corte}</div>${sub}</div>${status(r)}</div>`;
  }).join('');
  return `
<section class="s dj-slide">
  ${top(false)}
  <div class="dj-head ${d.color}">
    <div><div class="dj-k">Dérej ${idx + 1} de 6 · ${esc(info.audience)}</div><h2>${esc(info.name).toUpperCase()}</h2><div class="dj-sub">${esc(info.subtitle)} · <i>${esc(d.heb)}</i></div></div>
    <div class="dj-count"><b>${nReady}<small>/${items.length}</small></b><span>listas</span></div>
  </div>
  <div class="dj-meta"><span>${esc(d.route)}</span><span>${esc(d.esquema)}</span></div>
  <p class="dj-why">${esc(d.why)}</p>
  <div class="items ${items.length > 8 ? 'dense' : ''}">${rows}</div>
  <div class="tip"><b>Dato clave</b>${esc(d.tip)}</div>
  ${foot('XP Lev · ' + info.name)}
</section>`;
}

// ---------- Calendario litúrgico ----------
const STRONG = ['adviento', 'cuaresma', 'pascua', 'pentecostes'];
const calRows = STRONG.map((s) => {
  const it = retreats.filter((r) => r.season === s);
  return `<div class="cal cal-${s}"><div class="cal-h"><b>${SEASON[s]}</b><span>${it.length}</span></div><div class="chips">${it.map((r) => `<span class="${isReady(r) ? 'ok' : ''}">${isReady(r) ? '✓ ' : ''}${esc(r.title.split(' · ')[0])}</span>`).join('')}</div></div>`;
}).join('');
const nOrd = retreats.filter((r) => r.season === 'ordinario').length;

// ---------- Mapa de Dérej ----------
const mapRows = ORDER.map((k) => {
  const items = byDerej[k] || [];
  const r = items.filter(isReady).length;
  const pct = Math.round((r / items.length) * 100);
  return `<div class="mp"><div class="ic ${DJ[k].color === 'red' ? 'r' : 'g'}">${DJ[k].code}</div><div class="mp-t"><b>${DEREJ[k].name}</b><span>${DEREJ[k].audience} · ${DJ[k].esquema.split(' · ')[0]}</span><div class="bar"><i style="width:${Math.max(pct, 2)}%"></i></div></div><div class="mp-n"><b>${r}/${items.length}</b><span>listas</span></div></div>`;
}).join('');

const readyList = ready.map((r) => `<li><b>${esc(r.title)}</b><span>${DEREJ[r.derej]?.name ?? ''} · ${tipoOf(r)}</span></li>`).join('');

const css = fs.readFileSync(path.join(here, 'equipo.css'), 'utf8');

const slides = [];
n = 0;

// 01 PORTADA
n++;
slides.push(`
<section class="s cover">
  <div class="photo" style="background-image:url(assets/images/hero.webp)"></div>
  <div class="body">
    <img class="iso" src="assets/logos/isotipo-bn.png" alt="MCJ">
    <div class="pre">Para el equipo de</div>
    <h1>MI CAMINO<br>ES <span>JESÚS</span></h1>
    <div class="tag">Hacia dónde caminamos juntos</div>
    <p class="cover-p">Lo que somos, lo que ya tenemos, a qué nos vamos a dedicar y cómo lo vamos a hacer.</p>
  </div>
  <div class="foot"><span>Equipo MCJ</span><span>Noviembre 2026</span></div>
</section>`);

// 02 CARTA
slides.push(`
<section class="s cream">
  ${top(false)}
  <div class="eyebrow">Antes de empezar</div>
  <h2>GRACIAS POR <em>DECIR QUE SÍ</em></h2>
  <div class="letter">
    <p>Este proyecto no existe por un logo ni por un catálogo. Existe porque cada uno de ustedes decidió regalar su tiempo, su talento y su fe para que otros se encuentren con Jesús.</p>
    <p>Empezamos en nuestra parroquia. En agosto dimos el primer paso fuera, con <b>Levántate y Sé Hombre</b>. Ahora toca crecer, y nadie recorre este camino solo.</p>
    <p>Esta presentación es para que todos veamos el mismo mapa: qué tenemos, qué falta y dónde cabe cada quien.</p>
  </div>
  <div class="sign"><img src="assets/logos/isotipo.png" alt=""><div><b>Equipo fundador</b><span>Pbro. Cristopher Cortés · Jehosua Castañeda</span></div></div>
  <div class="verse-mini">“Sé fuerte y valiente” · Josué 1:6</div>
  ${foot()}
</section>`);

// 03 IDENTIDAD
slides.push(`
<section class="s">
  ${top(false)}
  <div class="eyebrow">Nuestra identidad</div>
  <h2>LO QUE <em>SOMOS</em>, EN CORTO</h2>
  <div class="card"><div class="lbl">Misión</div><p>Formar discípulos misioneros, jóvenes y adultos, que vivan, anuncien y sirvan el Evangelio con alegría, siendo un punto de quiebre para el mundo actual.</p></div>
  <div class="card r" style="margin-top:12px"><div class="lbl">Visión</div><p>Ser una escuela de referencia en la Nueva Evangelización, donde cada persona, sin importar su edad, encuentre un camino claro de encuentro, formación y misión con Jesucristo.</p></div>
  <div class="eyebrow" style="margin-top:24px">Los 4 pilares de toda experiencia</div>
  <div class="flow">
    <div class="f1"><b>Encuentro</b><span>con Cristo vivo</span></div><i>→</i>
    <div class="f2"><b>Formación</b><span>estudio, oración, sacramentos</span></div><i>→</i>
    <div class="f3"><b>Comunidad</b><span>nadie camina solo</span></div><i>→</i>
    <div class="f4"><b>Misión</b><span>anunciar lo vivido</span></div>
  </div>
  ${foot()}
</section>`);

// 04 DÓNDE ESTAMOS
slides.push(`
<section class="s cream">
  ${top(false)}
  <div class="eyebrow">Dónde estamos hoy</div>
  <h2>TENEMOS EL MAPA, <em>FALTA RECORRERLO</em></h2>
  <div class="stats">
    <div class="stat dk"><b>${total}</b><span>Experiencias diseñadas en el catálogo XP Lev</span></div>
    <div class="stat ok"><b>${ready.length}</b><span>Listas para vivirse hoy</span></div>
    <div class="stat"><b>${total - ready.length}</b><span>En preparación: falta redactar su material</span></div>
    <div class="stat"><b>6</b><span>Dérej (caminos), uno por público</span></div>
  </div>
  <div class="eyebrow" style="margin-top:4px">Lo que ya está listo</div>
  <ul class="ready">${readyList}</ul>
  ${foot()}
</section>`);

// 05 PRIORIDADES
slides.push(`
<section class="s dark">
  ${top(true)}
  <div class="eyebrow">A qué nos vamos a dedicar</div>
  <h2>CINCO <em>FOCOS</em> PARA LOS PRÓXIMOS MESES</h2>
  <p class="muted" style="font-size:13.5px;margin-bottom:6px">Propuesta para platicar y aterrizar juntos.</p>
  <div class="asks">
    <div class="ask"><div class="k">01</div><div><b>Vivir el Adviento</b><span>Empieza el 29 de noviembre. <b class="hl">Emmanuel</b> y <b class="hl">Camino a Belén</b> ya están listos: es nuestra próxima oportunidad.</span></div></div>
    <div class="ask"><div class="k">02</div><div><b>Dar continuidad a Guibor</b><span>Los hombres de “Levántate y Sé Hombre” esperan el paso 2: <b class="hl">Sansón</b>.</span></div></div>
    <div class="ask"><div class="k">03</div><div><b>Arrancar Dérej Oz</b><span>Pedro, Juan y Emaús están listos y son de Pascua: base para lanzar la pastoral juvenil.</span></div></div>
    <div class="ask"><div class="k">04</div><div><b>Formar servidores</b><span>Mesharét es lo que nos permite multiplicarnos: más servidores, más retiros.</span></div></div>
    <div class="ask"><div class="k">05</div><div><b>Caminar con la Arquidiócesis</b><span>Presentar MCJ a Mons. Patrón Wong y buscar su respaldo.</span></div></div>
  </div>
  ${foot()}
</section>`);

// 06 CÓMO LO HACEMOS
slides.push(`
<section class="s">
  ${top(false)}
  <div class="eyebrow">Cómo lo vamos a hacer</div>
  <h2>CADA EXPERIENCIA SE CONSTRUYE <em>IGUAL</em></h2>
  <div class="sub-h">1 · Cada tema sigue la misma estructura</div>
  <div class="steps">
    <div><b>1</b><span>Evocación bíblica</span></div>
    <div><b>2</b><span>Actividad introductoria</span></div>
    <div><b>3</b><span>Contenido</span></div>
    <div><b>4</b><span>Símbolos</span></div>
    <div><b>5</b><span>Reflexión</span></div>
  </div>
  <div class="sub-h">2 · Cada formato tiene su ficha técnica</div>
  <table class="ficha">
    <tr><th></th><th>Duración</th><th>Personas</th></tr>
    <tr><td><b>Retiro</b></td><td>2 a 3 días</td><td>25 a 80</td></tr>
    <tr><td><b>Taller</b></td><td>4 a 6 horas</td><td>15 a 40</td></tr>
    <tr><td><b>Hora Santa</b></td><td>1 a 3 horas</td><td>30 a 120</td></tr>
  </table>
  <p class="note">Espacio: capilla con Sagrario y salón con sillas móviles para dinámicas.</p>
  <div class="sub-h">3 · De la idea al catálogo</div>
  <div class="pipe"><span>Redactar</span><i>→</i><span>Revisión espiritual</span><i>→</i><span>Piloto en parroquia</span><i>→</i><span class="ok">Lista</span></div>
  ${foot()}
</section>`);

// 07 MAPA DÉREJ
slides.push(`
<section class="s dark">
  ${top(true)}
  <div class="eyebrow">Método XP Lev</div>
  <h2>LOS 6 <em>DÉREJ</em> DE UN VISTAZO</h2>
  <p class="muted" style="font-size:14px;margin-bottom:16px"><b style="color:var(--cream)">Dérej</b> significa “camino” en hebreo. Cada uno es una ruta pensada para una etapa concreta de la vida. La barra muestra cuánto tenemos ya listo.</p>
  <div class="map">${mapRows}</div>
  ${foot('XP Lev')}
</section>`);

// 08–13 DÉREJ
ORDER.forEach((k, i) => slides.push(derejSlide(k, i)));

// 14 CALENDARIO
slides.push(`
<section class="s cream">
  ${top(false)}
  <div class="eyebrow">Calendario litúrgico</div>
  <h2>QUÉ VIVIR EN <em>CADA TIEMPO</em></h2>
  <p class="muted" style="font-size:14px;margin-bottom:14px">Los tiempos fuertes marcan nuestro año. <b>✓</b> = lista para vivirse.</p>
  <div class="cals">${calRows}</div>
  <p class="note" style="margin-top:12px">Las otras ${nOrd} experiencias se pueden vivir en cualquier momento del Tiempo Ordinario.</p>
  ${foot()}
</section>`);

// 15 ALIADOS + ARZOBISPADO
slides.push(`
<section class="s">
  ${top(false)}
  <div class="eyebrow">Más allá de la escuela</div>
  <h2>NO CAMINAMOS <em>SOLOS</em></h2>
  <div class="sub-h">Lo que pediremos a la Arquidiócesis</div>
  <div class="mini-asks">
    <div><b>Reconocimiento formal</b><span>como escuela de Nueva Evangelización</span></div>
    <div><b>Difusión en parroquias</b><span>recomendación a párrocos y decanatos</span></div>
    <div><b>Vinculación pastoral</b><span>con Pastoral Juvenil, Familiar y Catequesis</span></div>
    <div><b>Espacios y sedes</b><span>casas de retiro y templos</span></div>
  </div>
  <div class="sub-h">Proyectos aliados</div>
  <div class="allies">
    <div><img src="assets/images/karposhub.png" alt=""><b>Karpos Hub</b><span>Red profesional católica</span></div>
    <div><img src="assets/images/proyecto-ignis.webp" alt=""><b>Ignis</b><span>Ropa urbana católica</span></div>
    <div><img src="assets/images/proyecto-ignis-et-logos.webp" alt=""><b>Ignis et Logos</b><span>Evangelización en redes</span></div>
  </div>
  ${foot()}
</section>`);

// 16 EQUIPO
slides.push(`
<section class="s cream">
  ${top(false)}
  <div class="eyebrow">Nuestro equipo</div>
  <h2>QUIÉNES <em>HOY</em> LO HACEN POSIBLE</h2>
  <div class="team">
    <div class="tm"><img src="assets/images/p-cristopher.jpeg" alt=""><b>Pbro. Cristopher Cortés Pliego</b><span>Fundador · Asesor espiritual</span></div>
    <div class="tm"><img src="assets/images/jehosua.jpg" alt=""><b>Jehosua A. Castañeda Ortiz</b><span>Fundador · Eq. pastoral</span></div>
    <div class="tm"><img src="assets/images/maribel.jpeg" alt=""><b>Maribel Pinto Corona</b><span>Equipo pastoral</span></div>
    <div class="tm"><img src="assets/images/angy.jpeg" alt=""><b>Angélica M. Romero Hernández</b><span>Equipo pastoral</span></div>
  </div>
  <p class="note" style="margin-top:14px;text-align:center">…y el siguiente lugar en esta lámina puede ser el tuyo.</p>
  ${foot()}
</section>`);

// 17 LO QUE NECESITAMOS DE TI
slides.push(`
<section class="s dark">
  ${top(true)}
  <div class="eyebrow">Próximos pasos</div>
  <h2>LO QUE <em>NECESITAMOS</em> DE TI</h2>
  <div class="asks">
    <div class="ask"><div class="k">01</div><div><b>Adopta un Dérej</b><span>Un responsable por camino que cuide su avance y su calidad.</span></div></div>
    <div class="ask"><div class="k">02</div><div><b>Ayuda a redactar</b><span>Hay ${total - ready.length} experiencias esperando su material. Tu talento cabe en alguna.</span></div></div>
    <div class="ask"><div class="k">03</div><div><b>Sirve en Adviento</b><span>Emmanuel y Camino a Belén necesitan manos: logística, música, intercesión, hospitalidad.</span></div></div>
    <div class="ask"><div class="k">04</div><div><b>Ora y comparte</b><span>Invita a alguien y comparte @micaminoesjesus. Cada persona cuenta.</span></div></div>
  </div>
  <div class="band"></div>
  ${foot()}
</section>`);

// 18 CIERRE
slides.push(`
<section class="s close">
  <img class="logo" src="assets/logos/logotipo.png" alt="Mi Camino es Jesús">
  <div class="verse">“SÉ FUERTE<br>Y <span>VALIENTE</span>”</div>
  <div class="ref">Josué 1:6</div>
  <p class="thanks-big">No tengas miedo ni te acobardes, porque el Señor tu Dios estará contigo dondequiera que vayas.</p>
  <p class="thanks">Gracias por caminar con nosotros. Lo mejor de MCJ todavía no ha pasado.</p>
  <div class="hash">#micaminoesjesus #equipomcj #xplev</div>
  <div class="foot"><span>${TOTAL_SLIDES} / ${TOTAL_SLIDES}</span><span>© 2026 Mi Camino es Jesús</span></div>
</section>`);

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>MCJ · Equipo</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style></head><body>${slides.join('\n')}</body></html>`;
fs.writeFileSync(path.join(here, 'mcj-equipo.html'), html);
console.log('slides', slides.length, '| total', total, '| listas', ready.length);
