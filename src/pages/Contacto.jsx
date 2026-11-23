import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY, WHATSAPP_URL, INSTAGRAM_URL } from '../data/site';
import { useLang, useMeta } from '../i18n';

function randomDigit() {
  return Math.floor(Math.random() * 9) + 1;
}

export default function Contacto() {
  useMeta('contacto');
  const { t, r, to } = useLang();
  const [formSent, setFormSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaNums, setCaptchaNums] = useState([randomDigit(), randomDigit()]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const expected = captchaNums[0] + captchaNums[1];
    const given = parseInt(captchaAnswer, 10);

    if (given !== expected) {
      setCaptchaError(true);
      setCaptchaAnswer('');
      setCaptchaNums([randomDigit(), randomDigit()]);
      return;
    }

    const parts = [];
    if (name) parts.push(t('con.wa.hi', { name }));
    if (message) parts.push(message);
    if (email) parts.push(t('con.wa.mail', { email }));
    const text = parts.length ? parts.join(' ') : t('con.wa.default');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setFormSent(true);
    setCaptchaError(false);
  };

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
            {formSent ? (
              <div className="sent" role="status">
                <h2 className="d">{t('con.sent.h')}</h2>
                <p>{t('con.sent.p')}</p>
              </div>
            ) : (
              <form className="form" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="c-nombre">{t('con.name')}</label>
                  <input id="c-nombre" type="text" autoComplete="name" placeholder={t('con.name.ph')} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="c-correo">{t('con.email')}</label>
                  <input id="c-correo" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="c-mensaje">{t('con.msg')}</label>
                  <textarea id="c-mensaje" placeholder={t('con.msg.ph')} rows="4" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="c-captcha">{t('con.captcha', { a: captchaNums[0], b: captchaNums[1] })}</label>
                  <input
                    id="c-captcha"
                    type="text"
                    inputMode="numeric"
                    placeholder={t('con.captcha.ph')}
                    value={captchaAnswer}
                    aria-invalid={captchaError}
                    aria-describedby={captchaError ? 'c-captcha-error' : undefined}
                    onChange={(e) => {
                      setCaptchaAnswer(e.target.value);
                      setCaptchaError(false);
                    }}
                  />
                  {captchaError && <p id="c-captcha-error" className="err" role="alert">{t('con.captcha.err')}</p>}
                </div>
                <button type="submit" className="btn">{t('con.send')}</button>
                <p className="fine">{r('con.fine', (s) => <Link to={to('/aviso-de-privacidad')}>{s}</Link>)}</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
