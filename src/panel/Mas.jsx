import { mainNav, moreNav } from './nav';
import { env, usePushKey } from './pwa';
import { useAuth } from './session';
import { ICONS, Icon, PLink, PageHead } from './ui';

export default function Mas() {
  const { can, logout } = useAuth();
  const push = usePushKey();
  const installed = env().standalone;
  return (
    <>
      <PageHead title="Más" sub="Todo lo demás que puedes hacer en el panel." />
      <ul className="more-grid">
        {moreNav(can, mainNav(can)).map((i) => (
          <li key={i.to}><PLink className="more-card" to={i.to}><Icon d={ICONS[i.ico]} /><strong>{i.label}</strong><span className="help">{i.desc}</span></PLink></li>
        ))}
        {!installed && <li><PLink className="more-card" to="/panel/instalar"><Icon d={ICONS.phone} /><strong>Instalar en mi teléfono</strong><span className="help">Ten el panel en tu pantalla de inicio.</span></PLink></li>}
        {push?.enabled && <li><PLink className="more-card" to="/panel/avisos"><Icon d={ICONS.bell} /><strong>Avisos</strong><span className="help">Notificaciones en este teléfono.</span></PLink></li>}
        <li><a className="more-card" href="/"><Icon d={ICONS.home} /><strong>Ver el sitio</strong><span className="help">Cómo lo ve el público.</span></a></li>
        <li><button type="button" className="more-card" onClick={logout}><Icon d={ICONS.out} /><strong>Cerrar sesión</strong><span className="help">Salir del panel en este equipo.</span></button></li>
      </ul>
    </>
  );
}
