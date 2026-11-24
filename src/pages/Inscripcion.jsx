import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Failed, Loading } from '../components/Status';
import { useLang } from '../i18n';
import { pubPost } from '../lib/pub';
import { dateRange } from '../lib/dates';

// Page behind the links in the emails. Opening it verifies the email (a POST, so mail scanners that only GET do not confirm);
// cancelling and accepting a waitlist offer need an explicit click.
export default function Inscripcion() {
  const { token } = useParams();
  const { lang, t, to } = useLang();
  const [s, setS] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | notfound | error
  const [ask, setAsk] = useState(false);
  const [err, setErr] = useState('');
  const base = `/api/public/registrations/${encodeURIComponent(token)}`;

  const load = useCallback(async () => {
    try {
      const r = await fetch(base, { headers: { Accept: 'application/json' } });
      if (r.status === 404) return setState('notfound');
      if (!r.ok) return setState('error');
      let data = await r.json();
      if (data.status === 'pendiente_verificacion' && !data.verify_expired) {
        await pubPost(`${base}/verify`);
        data = await (await fetch(base, { headers: { Accept: 'application/json' } })).json();
      }
      setS(data);
      setState('ok');
    } catch {
      setState('error');
    }
  }, [base]);

  useEffect(() => {
    load();
    document.documentElement.lang = lang;
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex,nofollow';
    document.head.append(m);
    return () => m.remove();
  }, [load, lang]);

  async function act(path) {
    setErr('');
    const r = await pubPost(`${base}/${path}`);
    if (!r.ok) setErr(t('ins.err'));
    setAsk(false);
    await load();
  }

  if (state === 'loading') return <Loading />;
  if (state === 'error') return <Failed onRetry={load} />;
  if (state === 'notfound') return <Failed notFound />;
  const date = s.offer_expires_at && new Date(s.offer_expires_at).toLocaleString(lang === 'en' ? 'en-US' : 'es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  const live = ['confirmado', 'lista_espera', 'oferta'].includes(s.status);
  return (
    <section className="band">
      <div className="wrap legal">
        <div className="kicker red">{t('ins.k')}</div>
        <h1 className="h2">{s.event?.title ?? t('ins.k')}</h1>
        {s.event && <p>{dateRange(lang, s.event.starts_on, s.event.ends_on)}</p>}
        <p className="big" role="status">{t(`ins.st.${s.status}`, { pos: s.position, date })}</p>
        {err && <p className="err" role="alert">{err}</p>}
        <div className="row">
          {s.status === 'oferta' && <button type="button" className="btn" onClick={() => act('confirm')}>{t('ins.confirm')}</button>}
          {live && !ask && <button type="button" className="btn btn--ghost" onClick={() => setAsk(true)}>{t('ins.cancel')}</button>}
          {live && ask && (
            <div role="alertdialog" aria-label={t('ins.cancel.ask')} className="row">
              <p>{t('ins.cancel.ask')}</p>
              <button type="button" className="btn" onClick={() => act('cancel')}>{t('ins.cancel.yes')}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setAsk(false)}>{t('ins.cancel.no')}</button>
            </div>
          )}
          {!live && <Link className="btn btn--ghost" to={to('/calendario')}>{t('ins.again')}</Link>}
        </div>
      </div>
    </section>
  );
}
