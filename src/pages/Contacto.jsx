import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY, WHATSAPP_URL, INSTAGRAM_URL } from '../data/site';

function randomDigit() {
  return Math.floor(Math.random() * 9) + 1;
}

export default function Contacto() {
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
    if (name) parts.push(`Hola, soy ${name}.`);
    if (message) parts.push(message);
    if (email) parts.push(`Mi correo: ${email}`);
    const text = parts.length ? parts.join(' ') : 'Hola, quisiera más información sobre Mi Camino es Jesús.';
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setFormSent(true);
    setCaptchaError(false);
  };

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">Contacto</div>
          <h1 className="d">Da el primer <span className="jesus">paso</span></h1>
        </div>
      </section>

      <section className="band contacto-page">
        <div className="wrap grid">
          <div className="info">
            <h2 className="d">Ubicación</h2>
            <p>Puebla, Puebla, México</p>
            <h2 className="d">Escríbenos</h2>
            <ul>
              <li><a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><b>WhatsApp</b>{WHATSAPP_DISPLAY}</a></li>
              <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><b>Instagram</b>@micaminoesjesus</a></li>
              {/* shortcut: URL desconocida, agregar cuando el cliente la dé (Facebook, TikTok) */}
            </ul>
          </div>

          <div>
            {formSent ? (
              <div className="sent" role="status">
                <h2 className="d">¡Listo!</h2>
                <p>Abrimos WhatsApp con tu mensaje. Solo confírmalo desde ahí y te responderemos pronto.</p>
              </div>
            ) : (
              <form className="form" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="c-nombre">Nombre</label>
                  <input id="c-nombre" type="text" autoComplete="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="c-correo">Correo</label>
                  <input id="c-correo" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="c-mensaje">Mensaje</label>
                  <textarea id="c-mensaje" placeholder="Cuéntanos en qué podemos ayudarte" rows="4" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="c-captcha">Verificación: ¿cuánto es {captchaNums[0]} + {captchaNums[1]}?</label>
                  <input
                    id="c-captcha"
                    type="text"
                    inputMode="numeric"
                    placeholder="Tu respuesta"
                    value={captchaAnswer}
                    aria-invalid={captchaError}
                    aria-describedby={captchaError ? 'c-captcha-error' : undefined}
                    onChange={(e) => {
                      setCaptchaAnswer(e.target.value);
                      setCaptchaError(false);
                    }}
                  />
                  {captchaError && <p id="c-captcha-error" className="err" role="alert">Respuesta incorrecta, intenta de nuevo.</p>}
                </div>
                <button type="submit" className="btn">Enviar por WhatsApp</button>
                <p className="fine">Al enviar aceptas el <Link to="/aviso-de-privacidad">aviso de privacidad</Link>.</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
