import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WHATSAPP_DISPLAY, WHATSAPP_URL, INSTAGRAM_URL } from '../data/site';
import { useLang, useMeta } from '../i18n';
import { useData } from '../lib/api';
import { captchaToken, issueMap, pubPost } from '../lib/pub';

const SUBJECTS = ['informacion', 'retiros', 'peregrinaciones', 'voluntariado', 'arco', 'otro'];
const EMPTY = { name: '', email: '', phone: '', subject: '', message: '', consent: false };

export default function Contacto() {
  useMeta('contacto');
  const { lang, t, r, to } = useLang();
  const cfg = useData('/api/public/config');
  const [v, setV] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const top = useRef();
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const bad = (k) => (errs[k] ? { 'aria-invalid': true, 'aria-describedby': `c-${k}-e` } : {});
  const E = ({ k }) => (errs[k] ? <p className="err" id={`c-${k}-e`}>{errs[k]}</p> : null);

  const fail = (text, issues = {}) => { setMsg(text); setErrs(issues); requestAnimationFrame(() => top.current?.focus()); };
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setErrs({});
    let captcha;
    try { captcha = await captchaToken(cfg.data?.recaptcha, 'contact'); } catch { setBusy(false); return fail(t('con.err.captcha')); }
    const res = await pubPost('/api/public/contact', { name: v.name, email: v.email, phone: v.phone, subject: v.subject, message: v.message, consent_privacy: v.consent, lang, captcha });
    setBusy(false);
    if (res.ok) return setSent(true);
    if (res.data?.error === 'validation') {
      const keys = { name: 'name', email: 'email', phone: 'phone', subject: 'subject', message: 'message', consent_privacy: 'consent' };
      return fail(t('con.err.summary'), Object.fromEntries(Object.keys(issueMap(res.data)).filter((p) => keys[p]).map((p) => [keys[p], t('reg.err.field')])));
    }
    if (res.status === 429) return fail(t('con.err.rate'));
    if (res.data?.error === 'captcha_unavailable') return fail(t('con.err.captcha'));
    return fail(t('con.err.generic'));
  }

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">{t('con.k')}</div>
          <h1 className="d">{r('con.h')}</h1>
        </div>
      </section>

      <section className="band contacto-page">
        <div className="wrap grid">
          <div className="info">
            <h2 className="d">{t('con.loc')}</h2>
            <p>{t('con.place')}</p>
            <h2 className="d">{t('con.write')}</h2>
            <ul>
              <li><a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><b>WhatsApp</b>{WHATSAPP_DISPLAY}</a></li>
              <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><b>Instagram</b>@micaminoesjesus</a></li>
              {/* shortcut: URL desconocida, agregar cuando el cliente la dé (Facebook, TikTok) */}
            </ul>
          </div>

          <div>
            {sent ? (
              <div className="sent" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
                <h2 className="d">{t('con.sent.h')}</h2>
                <p>{t('con.sent.p')}</p>
              </div>
            ) : (
              <form className="form" onSubmit={submit}>
                <p className="fine">{t('reg.required')}</p>
                <div className="err-summary" role="alert" tabIndex={-1} ref={top}>{msg && <p className="err">{msg}</p>}</div>
                <div className="field">
                  <label htmlFor="c-name">{t('con.name')} *</label>
                  <input id="c-name" type="text" autoComplete="name" maxLength={120} required placeholder={t('con.name.ph')} value={v.name} onChange={set('name')} {...bad('name')} />
                  <E k="name" />
                </div>
                <div className="field">
                  <label htmlFor="c-email">{t('con.email')} *</label>
                  <input id="c-email" type="email" autoComplete="email" maxLength={190} required placeholder="you@example.com" value={v.email} onChange={set('email')} {...bad('email')} />
                  <E k="email" />
                </div>
                <div className="field">
                  <label htmlFor="c-phone">{t('con.phone')} <span className="opt">{t('reg.opt')}</span></label>
                  <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9+()\-\s.]{7,30}" maxLength={30} value={v.phone} onChange={set('phone')} {...bad('phone')} />
                  <E k="phone" />
                </div>
                <div className="field">
                  <label htmlFor="c-subject">{t('con.subject')} *</label>
                  <select id="c-subject" required value={v.subject} onChange={set('subject')} {...bad('subject')}>
                    <option value="" disabled>{t('con.subject.ph')}</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{t(`con.subj.${s}`)}</option>)}
                  </select>
                  <E k="subject" />
                  {v.subject === 'arco' && <p className="fine" role="note">{t('con.arco.note')}</p>}
                </div>
                <div className="field">
                  <label htmlFor="c-message">{t('con.msg')} *</label>
                  <textarea id="c-message" rows="5" required minLength={5} maxLength={5000} placeholder={t('con.msg.ph')} value={v.message} onChange={set('message')} {...bad('message')} />
                  <E k="message" />
                </div>
                <div className="field check">
                  <label htmlFor="c-consent">
                    <input id="c-consent" type="checkbox" required checked={v.consent} onChange={set('consent')} {...bad('consent')} />
                    <span>{r('con.consent', (s) => <Link to={to('/aviso-de-privacidad')}>{s}</Link>)} *</span>
                  </label>
                  <E k="consent" />
                </div>
                <button type="submit" className="btn" disabled={busy}>{busy ? t('con.sending') : t('con.send')}</button>
                <p className="fine"><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">{t('con.wa.alt')}</a></p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
