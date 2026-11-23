# Despliegue en Coolify (producción)

Decisión: **opción (a)**. La app se construye con el build pack *Dockerfile* y la base de datos es un **recurso MySQL administrado por Coolify**, que trae respaldos programados a S3 integrados. Por eso no hay `docker-compose.prod.yml`. El `docker-compose.yml` del repo es solo para desarrollo local (usa `.env.local`, nunca `.env`).

> Los nombres de menús de Coolify cambian entre versiones. Lo marcado con (?) no se pudo verificar desde el repo; guíate por el nombre aproximado.

## 1. Preparación
- Un servidor con Coolify instalado y el repo de GitHub accesible (si es privado: conecta una **GitHub App** en *Sources*).
- Genera el secreto de sesión: `openssl rand -hex 32` (guárdalo en tu gestor de contraseñas).
- Un servidor SMTP (host, puerto, usuario, contraseña) y un bucket de AWS S3 con un usuario IAM que pueda escribir en él.

## 2. Base de datos MySQL
1. En el proyecto: *New Resource > Database > MySQL*, versión **8**.
2. Anota usuario, contraseña, nombre de base de datos y el **hostname interno** (el que muestra Coolify en "Internal URL"). No expongas el puerto públicamente.
3. *Backups* de ese recurso: crea un **S3 Destination** (*Storages / S3*): endpoint de AWS S3, bucket, región, Access Key y Secret Key; prueba la conexión. Programa respaldo diario (ej. `0 3 * * *`) y define retención (ej. 14 diarios).
4. Ejecuta un respaldo manual antes del primer despliegue y verifica que aparece en el bucket.

## 3. Aplicación
1. *New Resource > Application > GitHub*, repo `micaminoesjesus`, rama `main` (o la rama que publiques).
2. Build pack: **Dockerfile**. Puerto expuesto: **3000**.
3. *Domains*: `https://micaminoesjesus.org` y `https://www.micaminoesjesus.org`. Configura la redirección de www al dominio principal (Coolify tiene una opción de redirect; (?)). Traefik emite el certificado Let's Encrypt solo.
4. *Environment Variables* (marca los secretos como runtime). Referencia completa con comentarios en `.env.example`:
   - Obligatorias: `NODE_ENV=production`, `PUBLIC_URL=https://micaminoesjesus.org`, `SESSION_SECRET`, `DB_HOST`, `DB_PORT=3306`, `DB_USER`, `DB_PASS`, `DB_NAME`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
   - Recomendadas: `TZ=America/Mexico_City`, `SMTP_SECURE=1` solo si el puerto es 465.
   - Opcionales (fases futuras): `CONTACT_TO`, `GC_SITE`, `GC_SECRET`, `CLAUDE`.
   - **No** definas `MAIL_DISABLED` en producción (el servidor se niega a arrancar si está activo).
   - `S3_*`: la app no las lee hoy; los respaldos se configuran en la UI de Coolify (paso 2.3).
   - Si falta algo, la app falla al arrancar con un mensaje que lista solo nombres de variables (revisa los logs del deploy).
5. *Persistent Storage*: volumen (Volume Mount) con destino **`/data/uploads`** (ahí guarda la app los archivos subidos; `UPLOAD_DIR` ya apunta ahí). Sin esto, los archivos se pierden en cada despliegue.
6. *Healthcheck*: el Dockerfile ya trae `HEALTHCHECK` contra `/api/health` (verifica la conexión a MySQL). En Coolify puedes dejarlo activo o poner Path `/api/health`, puerto 3000 (?).
7. Compresión: la app no comprime. Activa gzip/brotli en Traefik con un middleware (etiqueta `traefik.http.middlewares.gzip.compress=true` y asignarlo al router en *Custom Labels*; (?) Coolify suele traer un toggle "Enable gzip compression").
8. **Una sola réplica.** Migraciones y trabajo programado asumen una instancia (las migraciones usan `GET_LOCK`, así que un arranque doble no las corrompe, pero no escales sin revisar).

## 4. Tarea programada (recordatorios, publicación programada, limpieza)
En la app: *Scheduled Tasks > Add*: nombre `hourly`, comando `node server/jobs/hourly.js`, frecuencia `0 * * * *`, contenedor = la app. Sale con código 0 si todo bien o si otra ejecución ya está corriendo (lock en MySQL), y 1 si falla. Es idempotente.

## 5. Primer despliegue (checklist)
1. Respaldo manual de MySQL hecho (paso 2.4).
2. *Deploy*. Las migraciones corren solas al arrancar (antes de escuchar). El seed **nunca** corre automáticamente.
3. Espera a que el contenedor figure *healthy*; abre `https://micaminoesjesus.org/api/health` (debe responder `{"ok":true}`) y el sitio.
4. Crea el primer admin desde la terminal de la app en Coolify (*Terminal*):
   `node server/cli/create-admin.js --email tu@correo.org --name "Tu Nombre"`
   Envía la invitación por SMTP; si el correo falla, imprime el enlace de un solo uso (válido 7 días). Ábrelo, crea tu contraseña (mínimo 12 caracteres) y entra a `/panel`.
5. Prueba: login, "olvidé mi contraseña" (debe llegar el correo), y que los enlaces del correo apunten a `https://micaminoesjesus.org`.
6. Revisa que la tarea `hourly` se ejecutó (logs de *Scheduled Tasks*).

## 6. DNS
- Registros `A` (y `AAAA` si hay IPv6) de `micaminoesjesus.org` y `www` hacia la IP del servidor Coolify.
- Correo: el dominio del remitente (`SMTP_FROM`) necesita **SPF**, **DKIM** y **DMARC** según indique tu proveedor SMTP; sin ellos los correos caen en spam. Empieza DMARC con `p=none`.

## 7. Rollback
*Deployments* > redeploy del commit anterior. Las migraciones son aditivas (no se revierten solas): el código viejo funciona con el esquema nuevo. Si hubiera daño en datos, restaura el respaldo de S3 desde el recurso MySQL.

## 8. Qué NO hacer
- No ejecutes `npm run seed` en producción (carga datos de ejemplo).
- No pongas secretos en el repo ni en el Dockerfile; solo en la UI de Coolify. El `.env` local no entra a la imagen.
- No actives `MAIL_DISABLED` ni cambies `SESSION_SECRET` sin avisar (cierra todas las sesiones).
- No escales a más de una réplica sin revisar.

## No verificado
No se probó contra una instancia real de Coolify ni con S3/SMTP reales. Verificado localmente: build de la imagen, contenedor sano, rutas SPA, `/panel`, login, tarea `hourly` y su lock.
