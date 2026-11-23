// reCAPTCHA v3 server check. Pure: secret, URL and fetch are parameters, so tests never reach Google.
export const GOOGLE_VERIFY = 'https://www.google.com/recaptcha/api/siteverify';

// Returns { ok, score, reason }. reason: missing | unavailable | rejected | action | low_score.
export async function verifyCaptcha({ secret, token, action, ip, minScore = 0.5, url = GOOGLE_VERIFY, fetchFn = fetch }) {
  if (!token) return { ok: false, score: 0, reason: 'missing' };
  let r;
  try {
    const res = await fetchFn(url, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(5000),
      body: new URLSearchParams({ secret, response: token, ...(ip && { remoteip: ip }) }).toString(),
    });
    r = await res.json();
  } catch {
    return { ok: false, score: 0, reason: 'unavailable' };
  }
  if (!r?.success) return { ok: false, score: 0, reason: 'rejected' };
  if (r.action !== action) return { ok: false, score: r.score ?? 0, reason: 'action' };
  if ((r.score ?? 0) < minScore) return { ok: false, score: r.score ?? 0, reason: 'low_score' };
  return { ok: true, score: r.score, reason: null };
}
