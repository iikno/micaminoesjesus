// The five main destinations (bottom bar on phones, side menu on desktop), filtered by what the role may see.
// `can` is useAuth().can. `prefixes` are the URLs that light up the destination; "Más" catches everything else.
export function mainNav(can) {
  const items = [{ to: '/', label: 'Inicio', ico: 'home', prefixes: [] }];
  if (can('retreats', 'read')) items.push({ to: '/retiros', label: 'Retiros', ico: 'retreats', prefixes: ['/retiros', '/fechas'] });
  else if (can('pilgrimages', 'read')) items.push({ to: '/peregrinaciones', label: 'Peregri\u00ADnaciones', ico: 'pilgrimages', prefixes: ['/peregrinaciones'] }); // soft hyphen: lets the 5-column phone bar wrap
  else if (can('sessions', 'read')) items.push({ to: '/fechas', label: 'Fechas', ico: 'retreats', prefixes: ['/fechas'] });
  if (can('registrations', 'read')) items.push({ to: '/inscripciones', label: 'Inscritos', ico: 'regs', prefixes: ['/inscripciones'] });
  // Every role has something waiting for it (reviews, messages or its own returned drafts).
  items.push({ to: '/pendientes', label: 'Pendientes', ico: 'bell', prefixes: ['/pendientes', '/revision', '/contacto'] });
  items.push({ to: '/mas', label: 'Más', ico: 'more', prefixes: null });
  return items;
}

// `to` of the destination that owns this URL; anything unclaimed (versículos, fotos, usuarios...) belongs to Más.
export function activeTo(items, pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return '/'; // Inicio has no prefixes: '/' must never prefix-match the rest
  const hit = items.find((i) => i.prefixes?.some((x) => p === x || p.startsWith(`${x}/`)));
  return (hit ?? items.find((i) => i.prefixes === null)).to;
}

// Cards on the "Más" page: what the role can open that is not already in the main bar.
export function moreNav(can, main) {
  const shown = new Set(main.map((i) => i.to));
  return [
    ['/peregrinaciones', 'Peregrinaciones', 'pilgrimages', 'Viajes de fe: fechas, cupo e itinerario.', can('pilgrimages', 'read')],
    ['/imagenes', 'Fotos', 'media', 'La biblioteca de fotos del sitio.', can('media', 'read')],
    ['/versiculos', 'Versículos', 'verses', 'Las citas de la Biblia que se muestran.', can('verses', 'read')],
    ['/equipo', 'Equipo', 'team', 'Las personas que sirven en el camino.', can('team', 'read')],
    ['/glosario', 'Glosario', 'glossary', 'Palabras y su significado.', can('glossary', 'read')],
    ['/usuarios', 'Usuarios', 'users', 'Quién puede entrar al panel.', can('users', 'read')],
    ['/historial', 'Historial', 'audit', 'Quién cambió qué y cuándo.', can('audit', 'read')],
    ['/contrasena', 'Cambiar contraseña', 'key', 'Pon una contraseña nueva.', true],
  ].filter(([to, , , , ok]) => ok && !shown.has(to)).map(([to, label, ico, desc]) => ({ to, label, ico, desc }));
}
