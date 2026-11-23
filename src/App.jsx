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
    <Route path="contacto" element={<Contacto />} />
    <Route path="aviso-de-privacidad" element={<AvisoPrivacidad />} />
  </>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>{publicRoutes}</Route>
      <Route path="/en" element={<Layout />}>{publicRoutes}</Route>
      <Route path="/panel/*" element={<Suspense fallback={<p style={{ padding: 24 }}>Cargando…</p>}><PanelApp /></Suspense>} />
    </Routes>
  );
}
