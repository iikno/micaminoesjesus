# Despliegue en Coolify (producción)

Decisión: la app se construye con el build pack **Docker Compose** (`docker-compose.yml`, un solo servicio `app`) y la base de datos es un **MySQL externo en AWS RDS**, no un recurso de Coolify ni un contenedor. Los respaldos son los de RDS. El `docker-compose.yml` del repo es el de producción y **no** debe ejecutarse en local (leería `.env`); el desarrollo local usa `docker-compose.local.yml` con `.env.local`.

> Los nombres de menús de Coolify cambian entre versiones. Lo marcado con (?) no se pudo verificar desde el repo; guíate por el nombre aproximado.

## 1. Preparación
- Un servidor con Coolify instalado y el repo de GitHub accesible (si es privado: conecta una **GitHub App** en *Sources*).
- Genera el secreto de sesión: `openssl rand -hex 32` (guárdalo en tu gestor de contraseñas).
- Un servidor SMTP (host, puerto, usuario, contraseña) y una instancia de AWS RDS MySQL 8 ya creada.

## 2. Base de datos MySQL (AWS RDS, externa)
1. En RDS (MySQL 8) crea la base `mcj` con `utf8mb4` (`CREATE DATABASE mcj CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`) y un usuario `mcj` con privilegios solo sobre ella (`GRANT ALL ON mcj.* TO 'mcj'@'%';`).
2. *Security Group* de la instancia: regla de entrada **3306 solo desde la IP pública del servidor de Coolify** (nunca `0.0.0.0/0`).
3. Anota el endpoint (`*.rds.amazonaws.com`), puerto, usuario, contraseña y base: van como `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`. Define `DB_SSL=1` (TLS con el certificado raíz de Amazon RDS, ya incluido en el driver).
4. Respaldos: los **respaldos automáticos de RDS** (define retención, ej. 14 días) y *snapshots*. Toma un **snapshot manual** antes del primer despliegue y verifica que quede *available*.

## 3. Aplicación
1. *New Resource > Application > GitHub*, repo `micaminoesjesus`, rama `main` (o la rama que publiques).
2. Build pack: **Docker Compose**, archivo `docker-compose.yml`. Es solo el servicio `app` (sin base de datos).
3. *Domains*: asígnalos al servicio `app` con puerto 3000: `https://micaminoesjesus.org` y `https://www.micaminoesjesus.org`. Configura la redirección de www al dominio principal (Coolify tiene una opción de redirect; (?)). Traefik emite el certificado Let's Encrypt solo.
4. *Environment Variables* (Coolify las inyecta al compose; las obligatorias hacen fallar el deploy con un mensaje claro si faltan: `NODE_ENV`, `PUBLIC_URL`, `SESSION_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `SMTP_HOST`). Referencia completa con comentarios en `.env.example`:
   - Obligatorias: `NODE_ENV=production`, `PUBLIC_URL=https://micaminoesjesus.org`, `SESSION_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `SMTP_HOST`.
   - Recomendadas: `DB_SSL=1` (RDS), `TZ=America/Mexico_City`, `SMTP_SECURE=1` solo si el puerto es 465.
   - Opcionales (el compose usa el valor por defecto o vacío si no están): `PORT`, `TZ`, `DB_PORT`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO`, `GC_SITE`, `GC_SECRET`.
   - Imágenes y traducción (F3b), todas opcionales: `UPLOADS_DIR` (carpeta de las imágenes subidas; el compose la fija en `/data/uploads`, el volumen persistente), `UPLOAD_MAX_MB` (8), `CLAUDE` (llave de la API de Anthropic: sin ella la traducción automática queda apagada y el panel lo dice), `TRANSLATE_PROVIDER` (`claude`), `TRANSLATE_MODEL` (`claude-haiku-5-5`) y `TRANSLATE_MONTHLY_LIMIT` (tope mensual en caracteres de texto fuente, 100000; el panel muestra el uso en *Glosario*).
   - Inscripciones y contacto (F4): `REG_ENC_KEY` (**necesaria para inscripciones**; sin ella el formulario responde 503), `GC_SITE` y `GC_SECRET` (reCAPTCHA v3; sin `GC_SECRET` los formularios públicos se niegan a funcionar en producción), `CONTACT_TO` (a dónde llega el correo del formulario de contacto), `RECAPTCHA_MIN_SCORE` (0.5) y `ALLERGIES_ENABLED` (déjala **vacía/apagada** hasta que exista la entidad legal y el aviso sea definitivo: es un bloqueo de lanzamiento). Ver sección 3b.
   - **No** definas `MAIL_DISABLED` en producción (el servidor se niega a arrancar si está activo).
   - `S3_*`: la app no las lee hoy; los respaldos de la BD son los de RDS (paso 2.4).
   - Si falta algo, la app falla al arrancar con un mensaje que lista solo nombres de variables (revisa los logs del deploy).
5. *Persistent Storage*: ya lo define el compose (volumen con nombre `uploads` en **`/data/uploads`**, donde la app guarda las imágenes subidas: `pub/` se sirve en `/uploads`, `private/` guarda las fotos marcadas con menores y nunca se sirve). **Respáldalo:** Coolify no lo respalda solo; sin ese volumen las portadas subidas se pierden en un desastre (la base de datos solo guarda sus nombres).
6. *Healthcheck*: el Dockerfile ya trae `HEALTHCHECK` contra `/api/health` (verifica la conexión a MySQL). En Coolify puedes dejarlo activo o poner Path `/api/health`, puerto 3000 (?).
7. Compresión: la app no comprime. Activa gzip/brotli en Traefik con un middleware (etiqueta `traefik.http.middlewares.gzip.compress=true` y asignarlo al router en *Custom Labels*; (?) Coolify suele traer un toggle "Enable gzip compression").
8. **Una sola réplica.** Migraciones y trabajo programado asumen una instancia (las migraciones usan `GET_LOCK`, así que un arranque doble no las corrompe, pero no escales sin revisar).

## 3b. Inscripciones, contacto y reCAPTCHA (F4)
- **`REG_ENC_KEY`**: genera 32 bytes aleatorios en hexadecimal con `openssl rand -hex 32` y pégalos en Coolify. Cifra (AES-256-GCM) el contacto de emergencia, los datos del tutor y las alergias. **Si pierdes la llave, esos datos quedan ilegibles para siempre** (los nombres, teléfonos y correos de las personas inscritas no están cifrados y siguen ahí). Guarda una copia en tu gestor de contraseñas y no la cambies: cambiarla deja ilegibles las inscripciones ya guardadas.
- **reCAPTCHA v3**: en https://www.google.com/recaptcha/admin crea un sitio tipo v3 y agrega el dominio `micaminoesjesus.org` (y `www.micaminoesjesus.org`). La clave del sitio va en `GC_SITE` (la ve el navegador) y la secreta en `GC_SECRET`. La CSP ya permite `google.com/recaptcha` y `gstatic.com/recaptcha`.
- **Enlaces de los correos** (`/inscripcion/<token>`): el token se deriva del id con `SESSION_SECRET`; cambiar `SESSION_SECRET` invalida los enlaces ya enviados.
- **Retención** (la aplica la tarea `hourly`): alergias y contacto de emergencia se borran 30 días después del fin del evento; la inscripción completa, a los 90; mensajes de contacto 12 meses (spam 30 días); historial de auditoría 24 meses.
- Las migraciones 005 y 006 (tablas `registrations` y `contact_messages`) son aditivas y corren solas al arrancar.

## 4. Tarea programada (recordatorios, publicación programada, inscripciones, retención y limpieza)
En la app: *Scheduled Tasks > Add*: nombre `hourly`, comando `node server/jobs/hourly.js`, frecuencia `0 * * * *`, contenedor = el servicio `app`. Sale con código 0 si todo bien o si otra ejecución ya está corriendo (lock en MySQL), y 1 si falla. Es idempotente. Además de lo anterior, cada hora: recuerda confirmar el correo a las 24 h, libera las inscripciones sin verificar a las 72 h, vence las ofertas de la lista de espera a las 48 h y pasa al siguiente, y aplica la retención.

## 5. Primer despliegue (checklist)
1. Snapshot manual de RDS hecho (paso 2.4) y Security Group abierto a la IP del servidor.
2. *Deploy*. Las migraciones corren solas al arrancar (antes de escuchar). El seed **nunca** corre automáticamente.
3. Espera a que el contenedor figure *healthy*; abre `https://micaminoesjesus.org/api/health` (debe responder `{"ok":true}`) y el sitio.
4. **Primer admin automático (recomendado):** antes del primer deploy define `ADMIN_USER` (correo) y `ADMIN_PASS` (mínimo 6 caracteres; opcional `ADMIN_NAME`). Al primer arranque, si no existe ningún admin, se crea uno activo con esa contraseña (en el log: "Admin inicial creado: <correo>", sin la contraseña). Si ya hay un admin las variables se ignoran y nunca cambian una contraseña existente. Entra a `/panel`, cambia la contraseña en **Cambiar contraseña** (menú lateral) y **quita `ADMIN_PASS` (y `ADMIN_USER`) de Coolify**. Alternativa manual: crea el primer admin desde la terminal de la app en Coolify (*Terminal*):
   `node server/cli/create-admin.js --email tu@correo.org --name "Tu Nombre"`
   Envía la invitación por SMTP; si el correo falla, imprime el enlace de un solo uso (válido 7 días). Ábrelo, crea tu contraseña (mínimo 6 caracteres) y entra a `/panel`.
5. Prueba: login, "olvidé mi contraseña" (debe llegar el correo), y que los enlaces del correo apunten a `https://micaminoesjesus.org`.
6. Revisa que la tarea `hourly` se ejecutó (logs de *Scheduled Tasks*).

## 6. DNS
- Registros `A` (y `AAAA` si hay IPv6) de `micaminoesjesus.org` y `www` hacia la IP del servidor Coolify.
- Correo: el dominio del remitente (`SMTP_FROM`) necesita **SPF**, **DKIM** y **DMARC** según indique tu proveedor SMTP; sin ellos los correos caen en spam. Empieza DMARC con `p=none`.

## 7. Rollback
*Deployments* > redeploy del commit anterior. Las migraciones son aditivas (no se revierten solas): el código viejo funciona con el esquema nuevo. Si hubiera daño en datos, restaura un snapshot o un punto en el tiempo de RDS.

## 8. Qué NO hacer
- No ejecutes `npm run seed` en producción (carga datos de ejemplo).
- No pongas secretos en el repo ni en el Dockerfile; solo en la UI de Coolify. El `.env` local no entra a la imagen.
- No actives `MAIL_DISABLED` ni cambies `SESSION_SECRET` sin avisar (cierra todas las sesiones).
- No escales a más de una réplica sin revisar.

## No verificado
No se probó contra una instancia real de Coolify ni con RDS/SMTP reales. Verificado localmente: build de la imagen, contenedor sano, rutas SPA, `/panel`, login, tarea `hourly` y su lock.
