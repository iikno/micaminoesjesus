import peregrinosLogo from '../assets/logos/peregrinos.png';
import { useLang } from '../i18n';
import { PER_PHOTOS } from '../lib/perPhotos';

// The four pillars of a pilgrimage, each with a photo (or the PER logo on a soft tile while the photo is missing).
export default function PerPillars() {
  const { t } = useLang();
  return (
    <ul className="per-cards">
      {[0, 1, 2, 3].map((i) => (
        <li className="pcard" key={i}>
          <div className="ph">
            {PER_PHOTOS[i]
              ? <img src={PER_PHOTOS[i]} alt={t(`pg.photo.${i}`)} loading="lazy" />
              : <span className="ph-empty"><img src={peregrinosLogo} alt="" /></span>}
          </div>
          <h3>{t(`pilar.${i}`)}</h3>
          <p>{t(`pilar.${i}.t`)}</p>
        </li>
      ))}
    </ul>
  );
}
