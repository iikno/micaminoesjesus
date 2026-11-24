import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Every page is its own chunk, so the first visit only downloads the page it lands on.
const Home = lazy(() => import('./pages/Home'));
const Nosotros = lazy(() => import('./pages/Nosotros'));
const Proyectos = lazy(() => import('./pages/Proyectos'));
const XpLev = lazy(() => import('./pages/XpLev'));
const Peregrinos = lazy(() => import('./pages/Peregrinos'));
const PeregrinacionDetalle = lazy(() => import('./pages/PeregrinacionDetalle'));
const ProyectoDetalle = lazy(() => import('./pages/ProyectoDetalle'));
const Calendario = lazy(() => import('./pages/Calendario'));
const SesionDetalle = lazy(() => import('./pages/SesionDetalle'));
const Inscripcion = lazy(() => import('./pages/Inscripcion'));
const Contacto = lazy(() => import('./pages/Contacto'));
const AvisoPrivacidad = lazy(() => import('./pages/AvisoPrivacidad'));

// The admin panel is its own chunk: visitors of the public site never download it.
const PanelApp = lazy(() => import('./panel/PanelApp'));

// The same public routes live at / (Spanish) and /en (English); the language is read from the URL.
const publicRoutes = (
  <>
    <Route index element={<Home />} />
    <Route path="nosotros" element={<Nosotros />} />
    <Route path="proyectos" element={<Proyectos />} />
    <Route path="proyectos/xp-lev" element={<XpLev />} />
    <Route path="proyectos/peregrinos" element={<Peregrinos />} />
    <Route path="proyectos/peregrinos/:slug" element={<PeregrinacionDetalle />} />
    <Route path="proyectos/:id" element={<ProyectoDetalle />} />
    <Route path="calendario" element={<Calendario />} />
    <Route path="calendario/:id" element={<SesionDetalle />} />
    <Route path="inscripcion/:token" element={<Inscripcion />} />
    <Route path="contacto" element={<Contacto />} />
    <Route path="aviso-de-privacidad" element={<AvisoPrivacidad />} />
  </>
);

// The panel lives on its own subdomain (panel.<domain>) at clean URLs; the public site never ships its routes there or vice versa.
const onPanelHost = location.hostname.startsWith('panel.');

export default function App() {
  if (onPanelHost) return <Routes><Route path="/*" element={<Suspense fallback={<p style={{ padding: 24 }}>Cargando…</p>}><PanelApp /></Suspense>} /></Routes>;
  return (
    <Routes>
      <Route path="/" element={<Layout />}>{publicRoutes}</Route>
      <Route path="/en" element={<Layout />}>{publicRoutes}</Route>
    </Routes>
  );
}
