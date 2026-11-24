// Pure helpers of the step-by-step forms (no React, so they can be tested). A resource may define
// `steps: [{ title, fields: [names], preview? }]`; every field not named by a step lives in "Más opciones".

export const norm = (s) => (s ?? '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Address key from a title: no accents, lowercase, hyphens. Empty when too short for the server's /^[a-z0-9-]{2,80}$/.
export function slugify(s) {
  const t = (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
  return t.length >= 2 ? t : '';
}
// `base`, `base-2`, `base-3`… always within 80 characters.
export const withSuffix = (base, n) => (n < 2 ? base : `${base.slice(0, 80 - String(n).length - 1).replace(/-+$/, '')}-${n}`);

const filled = (v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '' && v !== false);

// Where each field is shown for this state: visible in its step, or in "more" (unassigned, or hidden by `when`
// while it still holds a saved value, so nothing stored is ever out of sight).
export function layout(res, st, ctx) {
  const by = Object.fromEntries(res.fields.map((f) => [f.n, f]));
  const named = new Set(res.steps.flatMap((s) => s.fields ?? []));
  const more = res.fields.filter((f) => !named.has(f.n));
  const steps = res.steps.map((s) => {
    const fs = (s.fields ?? []).map((n) => by[n]);
    const shown = fs.filter((f) => !f.when || f.when(st, ctx));
    for (const f of fs) if (!shown.includes(f) && filled(st[f.n])) more.push(f);
    return { ...s, fields: shown };
  });
  return { steps, more };
}

// Index of the step that shows a field right now, or -1 when it is in "Más opciones".
export const locate = (lay, n) => lay.steps.findIndex((s) => s.fields.some((f) => f.n === n));

// The server needs only the required fields (and title-or-retreat for dates): autosave waits until those are valid.
export const minimalOk = (res, errors) => !res.fields.some((f) => errors[f.n] && (f.req || (res.needsTitleOrRetreat && f.n === 'title')));
