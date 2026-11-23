import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Nosotros from './pages/Nosotros';
import Proyectos from './pages/Proyectos';
import XpLev from './pages/XpLev';
import Peregrinos from './pages/Peregrinos';
import ProyectoDetalle from './pages/ProyectoDetalle';
import Calendario from './pages/Calendario';
import Contacto from './pages/Contacto';
import AvisoPrivacidad from './pages/AvisoPrivacidad';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/proyectos/xp-lev" element={<XpLev />} />
        <Route path="/proyectos/peregrinos" element={<Peregrinos />} />
        <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/aviso-de-privacidad" element={<AvisoPrivacidad />} />
      </Route>
    </Routes>
  );
}
