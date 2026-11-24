import { useState } from 'react';
import { env, useInstallPrompt } from './pwa';
import { ICONS, Icon, PLink, PageHead, useToast } from './ui';

const KEY = 'mcj_install_hidden';
const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

// Drawings for the iPhone steps. Decorative: every step also says it in words.
const Share = ({ size = 28 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4M6 11H5v10h14V11h-1" /></svg>;
const Draw = ({ children }) => <svg className="ios-draw" viewBox="0 0 280 84" aria-hidden="true" focusable="false">{children}</svg>;
const SHARE_BAR = (
  <Draw>
    <rect x="6" y="14" width="268" height="56" rx="14" fill="var(--color-surface)" stroke="var(--p-line)" />
    <g stroke="var(--p-muted)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M40 33l-10 9 10 9" /><path d="M78 33l10 9-10 9" /><rect x="196" y="36" width="20" height="14" rx="3" /><path d="M200 36v-4h12v4M244 34h16M244 42h16M244 50h16" /></g>
    <circle cx="140" cy="42" r="26" fill="none" stroke="var(--color-red)" strokeWidth="3" />
    <g stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M140 48V30M134 36l6-6 6 6M132 40h-3v14h22V40h-3" /></g>
  </Draw>
);
const ADD_ROW = (
  <Draw>
    <rect x="6" y="14" width="268" height="56" rx="14" fill="var(--color-surface)" stroke="var(--color-red)" strokeWidth="3" />
    <text x="26" y="49" fontFamily="system-ui, sans-serif" fontSize="19" fontWeight="700" fill="currentColor">Agregar a inicio</text>
    <g stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round"><rect x="234" y="28" width="28" height="28" rx="6" /><path d="M248 35v14M241 42h14" /></g>
  </Draw>
);
const ADD_BTN = (
  <Draw>
    <rect x="6" y="14" width="268" height="56" rx="14" fill="var(--color-bg-alt)" />
    <text x="24" y="49" fontFamily="system-ui, sans-serif" fontSize="17" fill="var(--p-muted)">Cancelar</text>
    <rect x="178" y="22" width="92" height="40" rx="20" fill="var(--color-surface)" stroke="var(--color-red)" strokeWidth="3" />
    <text x="196" y="48" fontFamily="system-ui, sans-serif" fontSize="18" fontWeight="700" fill="currentColor">Agregar</text>
  </Draw>
);

function IosGuide({ inApp }) {
  const toast = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.origin); toast('Enlace copiado. Pégalo en Safari.'); } catch { toast('No se pudo copiar. Escribe esta dirección en Safari: ' + location.origin, 'error'); }
  };
  const steps = [
    ['Toca el botón Compartir', 'Es el cuadro con una flecha hacia arriba, en la barra de abajo de Safari (en iPad, arriba a la derecha).', SHARE_BAR],
    ['Baja y toca «Agregar a inicio»', 'Si no la ves, desliza la lista hacia arriba.', ADD_ROW],
    ['Toca «Agregar»', 'Está arriba a la derecha. Listo: el panel queda como una app en tu pantalla de inicio.', ADD_BTN],
  ];
  return (
    <section className="card" aria-labelledby="h-ios">
      <h2 id="h-ios">En iPhone o iPad</h2>
      {inApp && (
        <div className="state state-error" role="note">
          <p className="state-title">Estás en un navegador dentro de otra app.</p>
          <p>Desde aquí no se puede instalar. Abre el panel en Safari (o en Chrome) y sigue los pasos.</p>
          <button type="button" className="p-btn" onClick={copy}>Copiar enlace del panel</button>
        </div>
      )}
      <ol className="ios-steps">
        {steps.map(([t, d, draw], i) => (
          <li key={t}><span className="ios-n" aria-hidden="true">{i + 1}</span><div><strong>{t}</strong><p className="help">{d}</p>{draw}</div></li>
        ))}
      </ol>
      <p className="help"><Share size={18} /> Las instrucciones valen para iOS 16.4 o más nuevo; los avisos solo funcionan con la app instalada así.</p>
    </section>
  );
}

export default function Instalar() {
  const e = env();
  const { can, prompt } = useInstallPrompt();
  if (e.standalone) return <><PageHead title="Instalar en mi teléfono" /><div className="state"><p className="state-title">Ya está instalada.</p><p>Estás usando el panel como app.</p><PLink className="p-btn" to="/avisos">Ir a Avisos</PLink></div></>;
  return (
    <>
      <PageHead title="Instalar en mi teléfono" sub="El panel queda en tu pantalla de inicio, como cualquier app, y se abre más rápido." />
      {e.ios ? <IosGuide inApp={e.inApp} /> : (
        <section className="card" aria-labelledby="h-and">
          <h2 id="h-and">En Android</h2>
          {can ? <button type="button" className="p-btn p-btn-big p-btn-primary" onClick={prompt}><Icon d={ICONS.down} />Instalar el panel</button> : (
            <p>Abre el menú del navegador (los tres puntos <strong>⋮</strong>) y toca <strong>«Instalar aplicación»</strong> o <strong>«Agregar a la pantalla de inicio»</strong>.</p>
          )}
          {e.inApp && <p className="help">Parece que abriste el panel dentro de otra app. Ábrelo en Chrome para poder instalarlo.</p>}
        </section>
      )}
    </>
  );
}

// Dismissible card on Inicio. Hidden once installed, or when this browser has no way to offer it.
export function InstallCard() {
  const [hidden, setHidden] = useState(read);
  const { can, prompt } = useInstallPrompt();
  const e = env();
  if (hidden || e.standalone || !(can || e.ios)) return null;
  const close = () => { try { localStorage.setItem(KEY, '1'); } catch { /* the card just comes back next time */ } setHidden(true); };
  return (
    <section className="card install-card" aria-labelledby="h-inst">
      <h2 id="h-inst">Ten el panel en tu teléfono</h2>
      <p className="help">Instálalo en tu pantalla de inicio para abrirlo con un toque{e.ios ? '' : ' y recibir avisos'}.</p>
      <div className="p-row install-actions">
        {can ? <button type="button" className="p-btn p-btn-primary" onClick={prompt}><Icon d={ICONS.down} />Instalar</button> : <PLink className="p-btn p-btn-primary" to="/instalar"><Icon d={ICONS.down} />Ver cómo</PLink>}
        <button type="button" className="p-btn" onClick={close}>Ahora no</button>
      </div>
    </section>
  );
}
