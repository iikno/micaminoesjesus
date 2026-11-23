// Per-route <title>/description, shared by the browser (document.title) and the server (SEO injection into index.html).
// Pure data: no assets, so Node can import it.
export const SITE_NAME = 'Mi Camino es Jesús';

// Route keys -> Spanish path (the English one is the same path under /en).
export const ROUTES = {
  home: '/', nosotros: '/nosotros', proyectos: '/proyectos', xplev: '/proyectos/xp-lev', peregrinos: '/proyectos/peregrinos',
  calendario: '/calendario', contacto: '/contacto', privacidad: '/aviso-de-privacidad',
};

export const PAGE_META = {
  es: {
    home: ['Escuela de Nueva Evangelización', 'Mi Camino es Jesús, escuela católica de Nueva Evangelización en Puebla, México. Encuentro con Jesús, formación y misión para jóvenes y adultos.'],
    nosotros: ['Nosotros', 'Quiénes somos: una escuela de Nueva Evangelización con raíz joven, misión, visión y los cuatro pilares de Mi Camino es Jesús.'],
    proyectos: ['Proyectos', 'XP Lev, Peregrinos, Karpos Hub, Ignis e Ignis et Logos: los proyectos con los que anunciamos a Jesús.'],
    xplev: ['XP Lev, catálogo de retiros', 'El catálogo de retiros, talleres y adoraciones de Mi Camino es Jesús, organizado por Dérej y por tiempo litúrgico.'],
    peregrinos: ['Peregrinos', 'Peregrinaciones por México y el mundo para acercar a las personas a Cristo y a la historia de la fe.'],
    calendario: ['Calendario', 'Las próximas fechas de retiros, talleres y peregrinaciones de Mi Camino es Jesús.'],
    contacto: ['Contacto', 'Escríbenos por WhatsApp o Instagram y da el primer paso con Mi Camino es Jesús.'],
    privacidad: ['Aviso de privacidad', 'Aviso de privacidad de Mi Camino es Jesús.'],
  },
  en: {
    home: ['School of New Evangelization', 'Mi Camino es Jesús is a Catholic school of New Evangelization in Puebla, Mexico: encounter with Jesus, formation and mission for young people and adults.'],
    nosotros: ['About us', 'Who we are: a school of New Evangelization with young roots, our mission, vision and the four pillars of Mi Camino es Jesús.'],
    proyectos: ['Projects', 'XP Lev, Peregrinos, Karpos Hub, Ignis and Ignis et Logos: the projects through which we proclaim Jesus.'],
    xplev: ['XP Lev, retreat catalog', 'The catalog of retreats, workshops and adoration hours of Mi Camino es Jesús, organized by Dérej and liturgical season.'],
    peregrinos: ['Peregrinos', 'Pilgrimages across Mexico and the world that bring people closer to Christ and the history of the faith.'],
    calendario: ['Calendar', 'Upcoming retreats, workshops and pilgrimages of Mi Camino es Jesús.'],
    contacto: ['Contact', 'Write to us on WhatsApp or Instagram and take the first step with Mi Camino es Jesús.'],
    privacidad: ['Privacy notice', 'Privacy notice of Mi Camino es Jesús (Spanish only for now).'],
  },
};

export const pageTitle = (title) => (title ? `${title} · ${SITE_NAME}` : SITE_NAME);
