import xpLogo from '../assets/images/xp-lev.png';
import khLogo from '../assets/images/karposhub.png';
import ignisLogo from '../assets/images/proyecto-ignis.webp';
import logosLogo from '../assets/images/proyecto-ignis-et-logos.webp';
import peregrinosLogo from '../assets/logos/peregrinos.png';

// externo: proyecto con sitio propio (se lista en Home como "Más proyectos").
export const PROYECTOS = [
  {
    id: 'xp-lev', nombre: 'XP Lev', tag: 'Evangelización por públicos', logo: xpLogo, alt: 'Logo XP Lev',
    desc: 'Retiros, talleres y adoraciones pensados para distintos públicos (hombres, mujeres, jóvenes, niños, servidores y comunidad), cada uno un camino (Dérej) de encuentro con Cristo.',
    links: [{ label: 'Ver todos los caminos', to: '/proyectos/xp-lev' }],
  },
  {
    id: 'peregrinos', nombre: 'Peregrinos', tag: 'Peregrinaciones · La dimensión +1', logo: peregrinosLogo, alt: 'Logo Peregrinos',
    desc: 'Peregrinaciones a lo largo de México y del mundo para acercar a las personas a Cristo y a la historia de la fe.',
    links: [{ label: 'Conoce Peregrinos', to: '/proyectos/peregrinos' }],
  },
  {
    id: 'karpos', nombre: 'Karpos Hub', tag: 'Red profesional · Comunidad católica', logo: khLogo, alt: 'Logo Karpos Hub', externo: true,
    desc: '"Tu vocación, tu red profesional católica": un espacio para que profesionales y empresas conecten, hagan networking y vivan su fe también en el ámbito laboral.',
    links: [
      { label: 'Visitar karposhub.com', href: 'https://karposhub.com' },
      { label: 'Cómo funciona', href: 'https://karposhub.com/como-funciona', sec: true },
      { label: 'Profesionales', href: 'https://karposhub.com/profesionales', sec: true },
      { label: 'Empresas', href: 'https://karposhub.com/empresas', sec: true },
      { label: 'Nosotros', href: 'https://karposhub.com/nosotros', sec: true },
    ],
  },
  {
    id: 'ignis', nombre: 'Ignis', tag: 'Tienda · Ropa urbana católica', logo: ignisLogo, alt: 'Logo Ignis', externo: true,
    desc: 'Streetwear con identidad católica: piezas que unen fe y estilo urbano para expresar tu fe todos los días.',
    links: [{ label: 'Visitar ignisv.com.mx', href: 'https://ignisv.com.mx' }],
  },
  {
    id: 'ignis-et-logos', nombre: 'Ignis et Logos', tag: 'Redes sociales · Evangelización en medios', logo: logosLogo, alt: 'Logo Ignis et Logos', externo: true,
    desc: 'Contenido para anunciar a Jesús en redes: reels y videos que llevan el Evangelio al lenguaje digital.',
    links: [
      { label: 'Instagram @ignis.et.logos', href: 'https://instagram.com/ignis.et.logos' },
      { label: 'TikTok @ignis.et.logos', href: 'https://www.tiktok.com/@ignis.et.logos', sec: true },
    ],
  },
];
