import isotipoBn from '../assets/logos/isotipo-bn.png';
import { VERSO } from '../data/site';

export default function Verso() {
  return (
    <section className="verse" aria-label="Versículo">
      <div className="wrap">
        <img src={isotipoBn} alt="" />
        <blockquote>&ldquo;{VERSO.texto}&rdquo;</blockquote>
        <cite>{VERSO.cita}</cite>
      </div>
    </section>
  );
}
