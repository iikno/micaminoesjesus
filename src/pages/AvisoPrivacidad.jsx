import { Link } from 'react-router-dom';
import { useLang, useMeta } from '../i18n';

export default function AvisoPrivacidad() {
  useMeta('privacidad');
  const { lang, t, to } = useLang();
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="kicker red">Legal</div>
          <h1 className="d">Aviso de <span className="jesus">privacidad</span></h1>
        </div>
      </section>

      <section className="band">
        <div className="wrap legal" lang="es">
          {lang === 'en' && <p className="draft" role="note" lang="en">{t('legal.en')}</p>}
          <p className="draft" role="note" lang="es">
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
            <li>Contacto de emergencia (nombre y teléfono).</li>
            <li>Si te inscribes a una actividad para niñas y niños (Dérej Simjá, hasta 12 años): nombre y teléfono de la madre, padre o tutor que hace la inscripción. En el Dérej Oz, si eres menor de 18 años, te pedimos confirmar que tienes permiso de tu madre, padre o tutor.</li>
            <li>Alergias: es un dato personal sensible, es opcional y solo se trata con tu consentimiento expreso y separado.</li>
            <li>Mensajes que nos envías desde el formulario de contacto, junto con la dirección IP desde la que se enviaron.</li>
          </ul>

          <h2 className="d">Finalidades</h2>
          <ul>
            <li>Atender tus mensajes y solicitudes de información.</li>
            <li>Gestionar tu inscripción y participación en retiros, talleres, peregrinaciones y demás actividades.</li>
            <li>Contactarte a ti o a tu contacto de emergencia cuando sea necesario durante una actividad.</li>
            <li>Atender necesidades de salud o alimentación, como las alergias, durante las actividades.</li>
          </ul>

          <h2 className="d">Seguridad y conservación</h2>
          <ul>
            <li>El contacto de emergencia, los datos del tutor y las alergias se guardan cifrados y solo los ve la persona responsable de la actividad.</li>
            <li>Borramos las alergias y el contacto de emergencia 30 días después de terminada la actividad, y la inscripción completa 90 días después.</li>
            <li>Los mensajes de contacto se conservan 12 meses (los marcados como spam, 30 días). El registro de actividad interna se conserva 24 meses.</li>
            <li>Para evitar el spam usamos reCAPTCHA de Google en los formularios; Google recibe datos técnicos de tu navegador para esa verificación.</li>
          </ul>

          <h2 className="d">Derechos ARCO</h2>
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición, así como
            revocar tu consentimiento, enviándonos tu solicitud desde la página de{' '}
            <Link to={to('/contacto')}>Contacto</Link> con el asunto &ldquo;Derechos ARCO&rdquo;. Responderemos en un plazo de 20 días hábiles [pendiente: verificar el plazo con asesoría legal].
          </p>

          <h2 className="d">Cambios al aviso</h2>
          <p>Este aviso puede cambiar. Publicaremos la versión vigente en esta misma página.</p>
        </div>
      </section>
    </>
  );
}
