import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logotipo from '../assets/logos/logotipo.png';
import { CONTACTO, NAV } from '../data/site';
import { PROYECTOS } from '../data/proyectos';
import { useLang } from '../i18n';

const NAME = { es: 'Español', en: 'English' };
const OTROS_HINT = PROYECTOS.filter((p) => p.externo).map((p) => p.nombre).join(', ');

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);

// Project submenu items. Plain Link for "Otros proyectos": NavLink ignores the #hash, so it would look current on the whole page.
function SubLink({ s, onClick }) {
  const { t, to } = useLang();
  const hint = s.otros ? OTROS_HINT : t(s.hint);
  const body = <><b>{t(s.key)}</b><small>{hint}</small></>;
  return s.otros
    ? <Link to={to(s.to)} onClick={onClick}>{body}</Link>
    : <NavLink to={to(s.to)} onClick={onClick}>{body}</NavLink>;
}

function LangSwitch() {
  const { t, lang, other } = useLang();
  return (
    <div className="lang" role="group" aria-label={t('lang.switch')}>
      {['es', 'en'].map((l) => (l === lang
        ? <span key={l} lang={l} aria-current="true">{l.toUpperCase()}</span>
        // Same page in the other language; hrefLang/lang tell assistive tech and crawlers what it is.
        : <Link key={l} to={other} hrefLang={l} lang={l} aria-label={`${t('lang.switch')}: ${NAME[l]}`}>{l.toUpperCase()}</Link>))}
    </div>
  );
}

export default function Header() {
  const { t, to } = useLang();
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(null); // 'p' = Proyectos submenu (desktop), 'm' = mobile menu
  const box = useRef(null);
  const pBtn = useRef(null);
  const mBtn = useRef(null);
  const close = () => setOpen(null);

  useEffect(() => { setOpen(null); }, [pathname, hash]);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => { if (!box.current?.contains(e.target)) setOpen(null); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key !== 'Escape' || !open) return;
    (open === 'p' ? pBtn : mBtn).current?.focus();
    setOpen(null);
  };
  // Keyboard focus leaving the header closes the open menu.
  const onBlur = (e) => { if (open && e.relatedTarget && !box.current?.contains(e.relatedTarget)) setOpen(null); };
  const toggle = (k) => setOpen((o) => (o === k ? null : k));

  return (
    <header className="top">
      <div className="top-in" ref={box} onKeyDown={onKeyDown} onBlur={onBlur}>
        <Link className="brand" to={to('/')} aria-label={t('header.home')}>
          <img src={logotipo} alt="Mi Camino es Jesús" />
        </Link>

        <nav className="dnav" aria-label={t('header.nav')}>
          {NAV.map((n) => (n.sub ? (
            <div className="has-sub" key={n.to}>
              <NavLink to={to(n.to)}>{t(n.key)}</NavLink>
              <button ref={pBtn} type="button" className="sub-btn" aria-expanded={open === 'p'} aria-controls="sub-proy" aria-label={t('nav.more')} onClick={() => toggle('p')}><Chevron /></button>
              <ul id="sub-proy" className="drop" hidden={open !== 'p'}>
                {n.sub.map((s) => <li key={s.to}><SubLink s={s} onClick={close} /></li>)}
              </ul>
            </div>
          ) : <NavLink key={n.to} to={to(n.to)} end={n.end}>{t(n.key)}</NavLink>))}
          <LangSwitch />
          <NavLink className="nav-cta" to={to(CONTACTO.to)}>{t(CONTACTO.key)}</NavLink>
        </nav>

        <div className="mnav">
          <button ref={mBtn} type="button" className="m-btn" aria-expanded={open === 'm'} aria-controls="mm-panel" onClick={() => toggle('m')}>
            {t('nav.menu')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">{open === 'm' ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
          </button>
          <nav id="mm-panel" className="m-panel" aria-label={t('header.nav')} hidden={open !== 'm'}>
            {NAV.map((n) => (
              <div key={n.to}>
                <NavLink to={to(n.to)} end={n.end} onClick={close}>{t(n.key)}</NavLink>
                {n.sub && <ul>{n.sub.map((s) => <li key={s.to}><SubLink s={s} onClick={close} /></li>)}</ul>}
              </div>
            ))}
            <div className="m-foot">
              <LangSwitch />
              <NavLink className="nav-cta" to={to(CONTACTO.to)} onClick={close}>{t(CONTACTO.key)}</NavLink>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
