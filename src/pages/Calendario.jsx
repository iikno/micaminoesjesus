import { Link } from 'react-router-dom';
import Calendario from '../components/Calendario';

export default function CalendarioPage() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">Calendario público</div>
          <h1 className="d">Lo que <span className="jesus">viene</span></h1>
          <p className="lead">Las fechas que aún no están confirmadas se marcan como tal. Pregúntanos por cualquiera de ellas.</p>
        </div>
      </section>
      <section className="band next">
        <div className="wrap">
          <Calendario />
          <Link className="btn btn--ghost" to="/contacto">Pregunta por fechas</Link>
        </div>
      </section>
    </>
  );
}
