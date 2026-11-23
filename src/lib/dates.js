// 'YYYY-MM-DD' (or an ISO string) -> "21 mar 2027" / "Mar 21, 2027", in the page language.
const fmt = (lang, v) => new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

export const dateRange = (lang, start, end) => {
  if (!start) return '';
  return !end || end === start ? fmt(lang, start) : `${fmt(lang, start)} – ${fmt(lang, end)}`;
};
