import { useMemo } from 'react';
import { useLang } from '../i18n';
import { useData } from './api';
import { imgUrl } from './img';

export const TIPO_ABBR = { taller: 'T', retiro: 'R', hora_santa: 'HS', vivencial: 'V', experiencial: 'E', estaciones: 'Est' };

// API rows -> the shape the pages already render (id = slug, conceptoCentral = summary, ...). Cover images are
// uploaded media or bundled legacy files (see lib/img.js).
export const adaptRetreat = (r) => ({
  id: r.slug, title: r.title, subtitle: r.subtitle, tipo: r.tipo, derej: r.derej_slug, paso: r.paso, sequenceTheme: r.tema_paso,
  conceptoCentral: r.summary, season: r.season_slug, seasonSecondary: r.season_secondary, estado: r.estado_catalogo, corte: r.corte_simja,
  codigo: r.codigo, image: imgUrl(r.cover), imageAlt: r.cover_alt,
  ...(r.body ?? {}), temas: r.body?.temas ?? [], bloques: r.body?.bloques ?? [], fichaTecnica: r.body?.fichaTecnica ?? [], chips: r.body?.chips ?? [],
});

// Dérej, seasons and the retreat list in the current language. Dérej subtitles/audiences are fixed copy in the dictionary.
export function useCatalog() {
  const { lang, td } = useLang();
  const derej = useData('/api/public/derej');
  const seasons = useData('/api/public/seasons');
  const list = useData(`/api/public/retreats?lang=${lang}`);
  const loading = derej.loading || seasons.loading || list.loading;
  const error = derej.error || seasons.error || list.error;
  const retry = () => { derej.retry(); seasons.retry(); list.retry(); };
  const data = useMemo(() => {
    if (loading || error) return null;
    const DEREJ = Object.fromEntries(derej.data.map((d) => [d.slug, {
      name: d.name, subtitle: td(`derej.${d.slug}.subtitle`, d.subtitle), audience: td(`derej.${d.slug}.audience`, d.audience), esquema: d.esquema,
      pasoTotal: d.paso_total, color: d.color, foto: imgUrl(d.foto), who: td(`derej.${d.slug}.who`, d.who), more: td(`derej.${d.slug}.more`, d.more),
    }]));
    const SEASONS = Object.fromEntries(seasons.data.map((s) => [s.slug, { name: lang === 'en' ? td(`season.${s.slug}`, s.name) : s.name }]));
    const retreats = list.data.map(adaptRetreat);
    const byDerej = (k) => retreats.filter((r) => r.derej === k).sort((a, b) => (a.paso ?? 0) - (b.paso ?? 0));
    return {
      DEREJ, SEASONS, retreats, byDerej,
      total: retreats.length, ready: retreats.filter((r) => r.estado !== 'proximamente').length,
    };
  }, [loading, error, derej.data, seasons.data, list.data, lang, td]);
  return { data, loading, error, retry };
}
