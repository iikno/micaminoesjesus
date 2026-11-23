const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const parts = (d) => d.split('-').map(Number); // 'YYYY-MM-DD'

// "21 a 27 mar 2027", "28 feb a 2 mar 2027", "29 nov 2026"
export function formatRange(start, end) {
  const [y, m, d] = parts(start);
  if (!end || end === start) return `${d} ${MES[m - 1]} ${y}`;
  const [y2, m2, d2] = parts(end);
  if (y === y2 && m === m2) return `${d} a ${d2} ${MES[m - 1]} ${y}`;
  if (y === y2) return `${d} ${MES[m - 1]} a ${d2} ${MES[m2 - 1]} ${y}`;
  return `${d} ${MES[m - 1]} ${y} a ${d2} ${MES[m2 - 1]} ${y2}`;
}

// Same shape as the static src/data/calendario.js items, so the page renders either source unchanged.
// Inputs are published snapshots. Past items drop out; everything sorts by start date.
export function buildCalendar({ sessions, retreats, derej, pilgrimages, today }) {
  const free = (s) => (s.registration_mode === 'none' ? 'Entrada libre' : '');
  const items = [];
  for (const s of sessions) {
    const r = retreats.get(s.retreat_id);
    items.push({
      start: s.starts_on, end: s.ends_on ?? s.starts_on,
      it: {
        id: `s${s.id}`, kind: 'retiro', slug: r?.slug ?? null,
        cuando: s.date_text || formatRange(s.starts_on, s.ends_on),
        titulo: s.title || r?.title,
        nota: [s.note || derej.get(r?.derej_slug)?.name, free(s)].filter(Boolean).join(' · '),
        estado: s.cal_state, destacado: s.highlight,
      },
    });
  }
  for (const p of pilgrimages) {
    if (!p.starts_on || p.state === 'cancelada') continue;
    items.push({
      start: p.starts_on, end: p.ends_on ?? p.starts_on,
      it: {
        id: `p${p.id}`, kind: 'peregrinacion', slug: p.slug, cuando: formatRange(p.starts_on, p.ends_on),
        titulo: p.title, nota: ['Peregrinos', p.place, free(p)].filter(Boolean).join(' · '),
        estado: 'confirmada', destacado: false,
      },
    });
  }
  return items.filter((x) => x.end >= today).sort((a, b) => a.start.localeCompare(b.start)).map((x) => x.it);
}
