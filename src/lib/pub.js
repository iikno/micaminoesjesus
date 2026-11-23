// Public (visitor) POSTs and reCAPTCHA v3. Never throws: returns { ok, status, data }.
export async function pubPost(path, body) {
  try {
    const r = await fetch(path, {
      method: 'POST', headers: { 'X-Requested-With': 'mcj', 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body ?? {}),
    });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

// The Google script loads on the first submit only (not on every page view). Without a site key (local dev) the token is empty.
let script;
export function captchaToken(site, action) {
  if (!site) return Promise.resolve('');
  script ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(site)}`;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => { script = null; reject(new Error('captcha_load')); };
    document.head.append(s);
  });
  return script.then(() => new Promise((resolve, reject) => window.grecaptcha.ready(() => window.grecaptcha.execute(site, { action }).then(resolve, reject))));
}

// Maps server validation issues ({ path: 'emergency.name' }) to the form field names.
export const issueMap = (data) => Object.fromEntries((data?.issues ?? []).map((i) => [i.path, i.message]));
