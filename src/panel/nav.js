// The five main destinations (bottom bar on phones, side menu on desktop), filtered by what the role may see.
// `can` is useAuth().can. `prefixes` are the URLs that light up the destination; "Más" catches everything else.
export function mainNav(can) {
  const items = [{ to: '/panel', label: 'Inicio', ico: 'home', prefixes: [] }];
  if (can('retreats', 'read')) items.push({ to: '/panel/retiros', label: 'Retiros', ico: 'retreats', prefixes: ['/panel/retiros', '/panel/fechas'] });
  else if (can('pilgrimages', 'read')) items.push({ to: '/panel/peregrinaciones', label: 'Peregri\u00ADnaciones', ico: 'pilgrimages', prefixes: ['/panel/peregrinaciones'] }); // soft hyphen: lets the 5-column phone bar wrap
  else if (can('sessions', 'read')) items.push({ to: '/panel/fechas', label: 'Fechas', ico: 'retreats', prefixes: ['/panel/fechas'] });
  if (can('registrations', 'read')) items.push({ to: '/panel/inscripciones', label: 'Inscritos', ico: 'regs', prefixes: ['/panel/inscripciones'] });
  // Every role has something waiting for it (reviews, messages or its own returned drafts).
  items.push({ to: '/panel/pendientes', label: 'Pendientes', ico: 'bell', prefixes: ['/panel/pendientes', '/panel/revision', '/panel/contacto'] });
  items.push({ to: '/panel/mas', label: 'Más', ico: 'more', prefixes: null });
  return items;
}

// `to` of the destination that owns this URL; anything unclaimed (versículos, fotos, usuarios...) belongs to Más.
export function activeTo(items, pathname) {
  const p = pathname.replace(/\/+$/, '') || '/panel';
  if (p === '/panel') return '/panel';
  const hit = items.find((i) => i.prefixes?.some((x) => p === x || p.startsWith(`${x}/`)));
  return (hit ?? items.find((i) => i.prefixes === null)).to;
}

// Cards on the "Más" page: what the role can open that is not already in the main bar.
export function moreNav(can, main) {
  const shown = new Set(main.map((i) => i.to));
  return [
    ['/panel/peregrinaciones', 'Peregrinaciones', 'pilgrimages', 'Viajes de fe: fechas, cupo e itinerario.', can('pilgrimages', 'read')],
    ['/panel/imagenes', 'Fotos', 'media', 'La biblioteca de fotos del sitio.', can('media', 'read')],
    ['/panel/versiculos', 'Versículos', 'verses', 'Las citas de la Biblia que se muestran.', can('verses', 'read')],
    ['/panel/equipo', 'Equipo', 'team', 'Las personas que sirven en el camino.', can('team', 'read')],
    ['/panel/glosario', 'Glosario', 'glossary', 'Palabras y su significado.', can('glossary', 'read')],
    ['/panel/usuarios', 'Usuarios', 'users', 'Quién puede entrar al panel.', can('users', 'read')],
    ['/panel/historial', 'Historial', 'audit', 'Quién cambió qué y cuándo.', can('audit', 'read')],
    ['/panel/contrasena', 'Cambiar contraseña', 'key', 'Pon una contraseña nueva.', true],
  ].filter(([to, , , , ok]) => ok && !shown.has(to)).map(([to, label, ico, desc]) => ({ to, label, ico, desc }));
}
