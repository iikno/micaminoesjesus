import isotipoBn from '../assets/logos/isotipo-bn.png';
import { useLang } from '../i18n';
import { VERSO } from '../data/site';
import { useApi } from '../lib/api';

// The verse comes from the `verses` table. English appears only once someone typed it by hand (RSV-2CE);
// until then the Spanish text is shown, never a machine translation.
export default function Verso() {
  const { lang, t } = useLang();
  const v = useApi(`/api/public/verse?ref=${encodeURIComponent(VERSO.cita)}&lang=${lang}`, { ref: VERSO.cita, lang: 'es', text: VERSO.texto, version: 'LBLA' });
  const wait = lang === 'en' && v.lang === 'es';
  return (
    <section className="verse" aria-label={t('verse.label')}>
      <div className="wrap">
        <img src={isotipoBn} alt="" />
        <blockquote lang={v.lang}>&ldquo;{v.text}&rdquo;</blockquote>
        <cite>{v.ref} · {v.version}</cite>
        {wait && <p className="verse-note">{t('verse.pending')}</p>}
      </div>
    </section>
  );
}
