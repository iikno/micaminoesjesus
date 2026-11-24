import { useEffect, useState } from 'react';
import { errText } from './api';
import { disablePush, enablePush, env, pushSupported, thisDevice, usePushKey } from './pwa';
import { ICONS, Icon, PLink, PageHead, Skeleton, useToast } from './ui';

const Note = ({ title, children, error }) => <div className={`state${error ? ' state-error' : ''}`}><p className="state-title">{title}</p>{children}</div>;

// Per-device switch. The permission prompt appears only after tapping the button.
export default function Avisos() {
  const toast = useToast();
  const k = usePushKey();
  const e = env();
  const [on, setOn] = useState(null); // null = checking
  const [perm, setPerm] = useState(() => (pushSupported() ? Notification.permission : 'unsupported'));
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (pushSupported()) thisDevice().then((s) => setOn(!!s && Notification.permission === 'granted'), () => setOn(false)); }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) { await disablePush(); setOn(false); toast('Avisos apagados en este teléfono.'); } else {
        const r = await enablePush();
        setPerm(Notification.permission);
        if (r === 'on') { setOn(true); toast('Avisos encendidos en este teléfono.'); } else if (r === 'dismissed') toast('No diste permiso. Puedes intentarlo cuando quieras.', 'error');
      }
    } catch (err) { toast(err?.status ? errText(err) : 'No se pudieron activar los avisos. Inténtalo de nuevo.', 'error'); } finally { setBusy(false); }
  };

  let body;
  if (!k) body = <Skeleton rows={2} />;
  else if (!k.enabled) body = <Note title="Los avisos aún no están disponibles.">Cuando el equipo técnico los active, podrás encenderlos aquí.</Note>;
  else if (e.ios && !e.standalone) body = (
    <Note title="En iPhone, primero instala el panel.">
      <p>Los avisos solo llegan si el panel está en tu pantalla de inicio (iOS 16.4 o más nuevo).</p>
      <PLink className="p-btn p-btn-primary" to="/instalar">Ver cómo instalarlo</PLink>
    </Note>
  );
  else if (!pushSupported()) body = <Note title="Este teléfono o navegador no puede recibir avisos.">{e.ios ? <p>Necesitas iOS 16.4 o más nuevo.</p> : <p>Prueba con Chrome, o instala el panel desde «Instalar en mi teléfono».</p>}</Note>;
  else if (perm === 'denied') body = (
    <Note title="Los avisos están bloqueados en este teléfono." error>
      <p>Tú o el navegador los bloquearon antes. Para encenderlos, permite las notificaciones de este sitio en los ajustes del navegador (en iPhone: Ajustes, Notificaciones, MCJ Panel) y vuelve aquí.</p>
    </Note>
  );
  else body = (
    <section className="card" aria-labelledby="h-av">
      <h2 id="h-av">Avisos en este teléfono</h2>
      {on === null ? <Skeleton rows={1} /> : (
        <>
          <p role="status" className="av-state"><Icon d={on ? ICONS.live : ICONS.alert} /><strong>{on ? 'Encendidos' : 'Apagados'}</strong></p>
          <button type="button" className={`p-btn p-btn-big${on ? '' : ' p-btn-primary'}`} onClick={toggle} disabled={busy} aria-busy={busy}>
            <Icon d={ICONS.bell} />{busy ? 'Un momento…' : on ? 'Apagar avisos en este teléfono' : 'Encender avisos en este teléfono'}
          </button>
          <p className="help">Es por teléfono: en otro equipo o navegador tendrás que encenderlos aparte. Te avisamos de lo que te toca según tu rol: algo por aprobar, respuesta a lo que enviaste, mensajes nuevos, inscripciones nuevas (un resumen a las 8:00) y cupos llenos.</p>
        </>
      )}
    </section>
  );
  return (
    <>
      <PageHead title="Avisos" sub="Una notificación en tu teléfono cuando algo necesite tu atención." />
      {body}
    </>
  );
}
