import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n';
import { useData } from '../lib/api';
import { captchaToken, issueMap, pubPost } from '../lib/pub';

const PHONE = '[0-9+()\\-\\s.]{7,30}';
const EMPTY = { name: '', phone: '', email: '', emName: '', emPhone: '', gName: '', gPhone: '', under18: false, permission: false, allergies: '', health: false, consent: false };

// Visible label, optional marker, help and error wired by aria (errors sit next to their field).
function Field({ id, label, optional, help, error, children }) {
  const { t } = useLang();
  const d = [help && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}{optional && <span className="opt"> {t('reg.opt')}</span>}</label>
      {children({ id, 'aria-describedby': d, 'aria-invalid': error ? true : undefined })}
      {help && <p className="fine" id={`${id}-h`}>{help}</p>}
      {error && <p className="err" id={`${id}-e`}>{error}</p>}
    </div>
  );
}

function Check({ id, checked, onChange, required, error, children }) {
  return (
    <div className="field check">
      <label htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : undefined} />
        <span>{children}</span>
      </label>
      {error && <p className="err" id={`${id}-e`}>{error}</p>}
    </div>
  );
}

// info = { open, full, waitlist, derej } from the API. kind = 'session' | 'pilgrimage'.
export default function RegistrationForm({ kind, eventId, info }) {
  const { lang, t, r, to } = useLang();
  const cfg = useData('/api/public/config');
  const [v, setV] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const top = useRef();
  const set = (k) => (val) => setV((x) => ({ ...x, [k]: typeof val === 'string' || typeof val === 'boolean' ? val : val.target.value }));
  const child = info.derej === 'simja', oz = info.derej === 'oz';
  const allergies = !!cfg.data?.allergies;

  if (!info.open) return <p className="reg-note" role="status">{t('reg.closed')}</p>;
  if (cfg.data && !cfg.data.registrations) return <p className="reg-note" role="status">{t('reg.unavailable')}</p>;
  if (sent) {
    return (
      <div className="sent" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
        <h2 className="d">{t('reg.sent.h')}</h2>
        <p>{t('reg.sent.p')}</p>
      </div>
    );
  }

  const fail = (text, issues = {}) => { setMsg(text); setErrs(issues); requestAnimationFrame(() => top.current?.focus()); };
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setErrs({});
    let captcha;
    try { captcha = await captchaToken(cfg.data?.recaptcha, 'register'); } catch { setBusy(false); return fail(t('reg.err.captcha')); }
    const body = {
      kind, event_id: eventId, lang, captcha, name: v.name, phone: v.phone, email: v.email,
      emergency: { name: v.emName, phone: v.emPhone }, consent_privacy: v.consent,
      ...(child && { guardian: { name: v.gName, phone: v.gPhone } }),
      ...(oz && { under18: v.under18, permission: v.under18 ? v.permission : undefined }),
      ...(allergies && v.allergies.trim() && { allergies: v.allergies, consent_health: v.health }),
    };
    const res = await pubPost('/api/public/registrations', body);
    setBusy(false);
    if (res.ok) return setSent(true);
    const code = res.data?.error;
    if (res.status === 400 && code === 'validation') {
      const m = issueMap(res.data);
      // Server paths -> field keys; any unknown path still shows the summary.
      const map = { name: 'name', phone: 'phone', email: 'email', 'emergency.name': 'emName', 'emergency.phone': 'emPhone', 'guardian.name': 'gName', 'guardian.phone': 'gPhone', permission: 'permission', consent_health: 'health', consent_privacy: 'consent', allergies: 'allergies', under18: 'under18' };
      return fail(t('reg.err.summary'), Object.fromEntries(Object.keys(m).filter((p) => map[p]).map((p) => [map[p], t('reg.err.field')])));
    }
    if (code === 'captcha_failed' || code === 'captcha_unavailable') return fail(t('reg.err.captcha'));
    if (code === 'already_registered') return fail(t('reg.err.dup'));
    if (code === 'registration_closed' || code === 'event_not_found') return fail(t('reg.err.closed'));
    if (res.status === 429) return fail(t('reg.err.rate'));
    return fail(res.status === 0 ? t('reg.err.net') : t('reg.err.generic'));
  }

  const privacy = (s) => <Link to={to('/aviso-de-privacidad')}>{s}</Link>;
  return (
    <form className="form reg-form" onSubmit={submit} aria-labelledby="reg-h">
      <h2 className="d" id="reg-h">{child ? t('reg.h.child') : t('reg.h')}</h2>
      {child && <p>{t('reg.child.note')}</p>}
      {info.full && <p className="reg-note" role="status">{t('reg.full', { n: info.waitlist })}</p>}
      <p className="fine">{t('reg.required')}</p>
      <div className="err-summary" role="alert" tabIndex={-1} ref={top}>{msg && <p className="err">{msg}</p>}</div>

      <Field id="r-name" label={`${child ? t('reg.name.child') : t('reg.name')} *`} error={errs.name}>
        {(a) => <input {...a} type="text" autoComplete={child ? 'off' : 'name'} maxLength={120} required value={v.name} onChange={set('name')} />}
      </Field>
      <Field id="r-phone" label={`${child ? t('reg.phone.child') : t('reg.phone')} *`} error={errs.phone}>
        {(a) => <input {...a} type="tel" inputMode="tel" autoComplete="tel" pattern={PHONE} maxLength={30} required value={v.phone} onChange={set('phone')} />}
      </Field>
      <Field id="r-email" label={`${t('reg.email')} *`} help={t('reg.email.help')} error={errs.email}>
        {(a) => <input {...a} type="email" autoComplete="email" maxLength={190} required value={v.email} onChange={set('email')} />}
      </Field>

      {child && (
        <>
          <Field id="r-gname" label={`${t('reg.guardian.name')} *`} error={errs.gName}>
            {(a) => <input {...a} type="text" autoComplete="name" maxLength={120} required value={v.gName} onChange={set('gName')} />}
          </Field>
          <Field id="r-gphone" label={`${t('reg.guardian.phone')} *`} error={errs.gPhone}>
            {(a) => <input {...a} type="tel" inputMode="tel" autoComplete="tel" pattern={PHONE} maxLength={30} required value={v.gPhone} onChange={set('gPhone')} />}
          </Field>
        </>
      )}

      <fieldset className="reg-group">
        <legend>{t('reg.em')}</legend>
        <Field id="r-emname" label={`${t('reg.em.name')} *`} error={errs.emName}>
          {(a) => <input {...a} type="text" autoComplete="off" maxLength={120} required value={v.emName} onChange={set('emName')} />}
        </Field>
        <Field id="r-emphone" label={`${t('reg.em.phone')} *`} error={errs.emPhone}>
          {(a) => <input {...a} type="tel" inputMode="tel" autoComplete="off" pattern={PHONE} maxLength={30} required value={v.emPhone} onChange={set('emPhone')} />}
        </Field>
      </fieldset>

      {oz && (
        <fieldset className="reg-group">
          <legend>{t('reg.u18')}</legend>
          <Check id="r-u18" checked={v.under18} onChange={set('under18')} error={errs.under18}>{t('reg.u18.yes')}</Check>
          {v.under18 && <Check id="r-perm" checked={v.permission} onChange={set('permission')} required error={errs.permission}>{t('reg.perm')} *</Check>}
        </fieldset>
      )}

      {allergies && (
        <fieldset className="reg-group">
          <legend>{t('reg.all')}</legend>
          <Field id="r-all" label={t('reg.all')} optional help={t('reg.all.help')} error={errs.allergies}>
            {(a) => <textarea {...a} rows="3" maxLength={500} value={v.allergies} onChange={set('allergies')} />}
          </Field>
          {v.allergies.trim() && <Check id="r-health" checked={v.health} onChange={set('health')} required error={errs.health}>{t('reg.health')} *</Check>}
        </fieldset>
      )}

      <Check id="r-consent" checked={v.consent} onChange={set('consent')} required error={errs.consent}>{r('reg.consent', privacy)} *</Check>
      <button type="submit" className="btn" disabled={busy}>{busy ? t('reg.sending') : t('reg.send')}</button>
    </form>
  );
}
