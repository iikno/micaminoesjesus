// Fallback for the verse (the live one comes from the API); the reference is also the lookup key.
export const VERSO = {
  texto: 'Sé fuerte y valiente. No tengas miedo ni te acobardes, porque el Señor tu Dios estará contigo dondequiera que vayas.',
  cita: 'Josué 1:9',
};

export const INSTAGRAM_URL = 'https://instagram.com/micaminoesjesus';

// Header (dropdown) and footer (flat) share this list. `sub` = items under the Proyectos menu; `hint` = i18n key of the small caption.
export const NAV = [
  { to: '/', key: 'nav.home', end: true },
  {
    to: '/proyectos', key: 'nav.proyectos',
    sub: [
      { to: '/proyectos/xp-lev', key: 'nav.xplev', hint: 'proy.xp-lev.tag' },
      { to: '/proyectos/peregrinos', key: 'nav.peregrinos', hint: 'proy.peregrinos.tag' },
      { to: '/proyectos#otros', key: 'nav.otros', otros: true },
    ],
  },
  { to: '/calendario', key: 'nav.calendario' },
  { to: '/nosotros', key: 'nav.nosotros' },
];
export const CONTACTO = { to: '/contacto', key: 'nav.contacto' };
