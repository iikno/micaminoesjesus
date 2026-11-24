import xpLogo from '../assets/images/xp-lev.png';
import khLogo from '../assets/images/karposhub.png';
import ignisLogo from '../assets/images/proyecto-ignis.webp';
import logosLogo from '../assets/images/proyecto-ignis-et-logos.webp';
import peregrinosLogo from '../assets/logos/peregrinos.png';

// Structure only: names, links and logos. Taglines, descriptions, alt text and link labels live in the
// dictionaries (keys proy.<id>.tag|desc|alt|l<index>) so they exist in both languages.
// externo: proyecto con sitio propio (se lista como "Otros proyectos"); XP Lev y Peregrinos son los dos propios.
export const PROYECTOS = [
  { id: 'xp-lev', nombre: 'XP Lev', logo: xpLogo, links: [{ to: '/proyectos/xp-lev' }] },
  { id: 'peregrinos', nombre: 'Peregrinos', logo: peregrinosLogo, links: [{ to: '/proyectos/peregrinos' }] },
  {
    id: 'karpos', nombre: 'Karpos Hub', logo: khLogo, externo: true,
    links: [
      { href: 'https://karposhub.com' },
      { href: 'https://karposhub.com/como-funciona', sec: true },
      { href: 'https://karposhub.com/profesionales', sec: true },
      { href: 'https://karposhub.com/empresas', sec: true },
      { href: 'https://karposhub.com/nosotros', sec: true },
    ],
  },
  { id: 'ignis', nombre: 'Ignis', logo: ignisLogo, externo: true, links: [{ href: 'https://ignisv.com.mx' }] },
  {
    id: 'ignis-et-logos', nombre: 'Ignis et Logos', logo: logosLogo, externo: true,
    links: [{ href: 'https://instagram.com/ignis.et.logos' }, { href: 'https://www.tiktok.com/@ignis.et.logos', sec: true }],
  },
];
