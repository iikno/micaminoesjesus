import { Link } from 'react-router-dom';

export default function AvisoPrivacidad() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">Legal</div>
          <h1 className="d">Aviso de <span className="jesus">privacidad</span></h1>
        </div>
      </section>

      <section className="band">
        <div className="wrap legal">
          <p className="draft" role="note">
            <b>Borrador, pendiente de revisión legal.</b> El responsable legal aún no está
            constituido. Este texto es provisional, no es un aviso definitivo y no debe tomarse
            como garantía de cumplimiento de la ley.
          </p>

          <h2 className="d">Responsable</h2>
          <p>[Pendiente: nombre o denominación, domicilio y datos de contacto del responsable del tratamiento de los datos personales.]</p>

          <h2 className="d">Datos personales que se recaban</h2>
          <ul>
            <li>Nombre.</li>
            <li>Teléfono.</li>
            <li>Correo electrónico.</li>
            <li>Contacto de emergencia.</li>
            <li>Alergias: es un dato personal sensible y solo se trata con tu consentimiento expreso.</li>
          </ul>

          <h2 className="d">Finalidades</h2>
          <ul>
            <li>Atender tus mensajes y solicitudes de información.</li>
            <li>Gestionar tu inscripción y participación en retiros, talleres, peregrinaciones y demás actividades.</li>
            <li>Contactarte a ti o a tu contacto de emergencia cuando sea necesario durante una actividad.</li>
            <li>Atender necesidades de salud o alimentación, como las alergias, durante las actividades.</li>
          </ul>

          <h2 className="d">Derechos ARCO</h2>
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición, así como
            revocar tu consentimiento, enviándonos tu solicitud desde la página de{' '}
            <Link to="/contacto">Contacto</Link> con el asunto &ldquo;Derechos ARCO&rdquo;.
          </p>

          <h2 className="d">Cambios al aviso</h2>
          <p>Este aviso puede cambiar. Publicaremos la versión vigente en esta misma página.</p>
        </div>
      </section>
    </>
  );
}
