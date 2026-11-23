# Plan técnico v3: backend, panel y gestión de contenido (MCJ)

## 0. Estado actual
- SPA React 19 + Vite 8, sin backend. Datos hard-coded: `src/data/retreats.js` (48 entradas; `SEQUENCES`, `SEASONS`, `DEREJ`, `TIPOS`, `ESTADOS`, `CORTES_SIMJA`, `withDerivedFields`) y `activities.json` (1 actividad con link Jotform).
- Clave inconsistente: `SEQUENCES` usa `derej-gibor`, `DEREJ` usa `guibor`. En BD habrá una sola (`guibor`); `sequence` se deriva de `derej.esquema = secuencial`.
- `Admin.jsx` (544 líneas) con contraseña `mcj@2025` en el bundle: se elimina. `Contacto.jsx`: captcha aritmético en cliente, sin envío real.
- `.env` ya está en `.gitignore`. Variables DB presentes: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME.
- **F0 + F1 (rediseño con datos estáticos) ya iniciadas en la rama `redesign-c`.** Este plan arranca en F2.

## 1. Decisiones del dueño
| # | Decisión | Consecuencia |
|---|---|---|
| 1 | `pastoral` y `peregrinacion` son ámbitos separados | Matriz por ámbito (sec. 5) |
| 2 | Publicar requiere aprobación; el `asesor` aprueba **ambos ámbitos**, comenta, **no edita**; `admin` **no se autoaprueba**; basta **una** aprobación; admin/asesor pueden corregir erratas directo (queda en bitácora) | Flujo de revisión (sec. 5) |
| 3 | Un retiro tiene varias ediciones al año | `retreat_sessions` |
| 4 | Lista de espera visible, costo texto libre; **retiros y peregrinaciones usan inscripción propia, se abandona Jotform** | Módulo de inscripciones (sec. 6) |
| 5 | MCJ conserva sus datos, sin procesador externo; alergias = dato sensible | Consentimiento expreso (sec. 12) |
| 6 | Espera 48 h para confirmar tras promoción; correo del inscrito verificado por enlace | Sec. 6 |
| 7 | Equipo + bandeja de contacto = admin; XP Lev = pastoral | Matriz sec. 5 |
| 8 | Retención propuesta aceptada | Sec. 10 |
| 9 | **Despliegue: Docker gestionado por Coolify** (ya no Hostinger) | Sec. 11 |
| 10 | Traducción automática ES→EN desde el panel con **Claude API** (la llave ya está en `.env`); Escritura **no** se traduce a máquina | Sec. 9 |
| 10b | Sin respuesta del aprobador: no se publica; recordatorios a ambos cada 48 h | Sec. 5 |
| 10c | Eventos de entrada libre: `registration_mode = none \| own`; el calendario muestra "Entrada libre" | Sec. 4 y 6 |
| 10d | Coolify ya instalado; **solo producción** (sin staging); pruebas locales con docker compose | Sec. 11 |
| 11 | Menores: Simjá (≤12) los inscribe madre/padre/tutor; Oz (13-17) puede autoinscribirse | Sec. 6 y 12 |
| 12 | Dominio `micaminoesjesus.org`; repo privado; panel solo en español, sitio público ES + EN | |

## 2. Stack (mínimo de dependencias)
| Capa | Elección | Por qué |
|---|---|---|
| HTTP | **Fastify 5** (alt. Express) | Validación por esquema, plugins oficiales |
| BD | **MySQL 8 + mysql2**, migraciones SQL planas con runner de ~30 líneas | Sin ORM; si se quiere builder, Kysely |
| Validación | **zod** | Un esquema por endpoint |
| Passwords | **argon2** (alt. bcryptjs) | Estándar |
| Sesión | Cookie `httpOnly; Secure; SameSite=Lax`, id opaco, sesiones en MySQL | Revocable, sin JWT |
| Email | **nodemailer** | Ya definido |
| Imágenes | **sharp** (máx 1600 px, WebP ~80, miniatura 480, sin EXIF) | Pedido |
| Estáticos | `@fastify/static` sirve `dist/` y `/uploads` desde la misma app | Un solo contenedor, sin nginx |
| Seguridad | `@fastify/helmet`, `rate-limit`, `cookie`, `multipart` | Oficiales |
| Traducción | Módulo `lib/translate.js`, proveedor por defecto **Claude API**, adaptadores intercambiables (sec. 9) | Sin SDK obligatorio: `fetch` basta |
| Panel | Misma app Vite, rutas `/panel/*` lazy | Cero stack nuevo |
La retención diaria ya no necesita `node-cron`: ver sec. 11.

## 3. Estructura del repo
```
/src            front + /src/panel (lazy) + /src/i18n/{es,en}.js
/server
  index.js config.js db.js migrate.js seed.js
  migrations/001_init.sql ...
  routes/{auth,users,derej,retiros,sesiones,peregrinaciones,inscripciones,
          revision,calendario,equipo,xplev,contacto,media,translate,audit,public}.js
  lib/{mailer,captcha,audit,perm,images,crypto,translate,i18n}.js
  jobs/retention.js
Dockerfile  docker-compose.yml (opcional, ver sec. 11)  .env.example
```
Un `package.json` con scripts `dev:web`, `dev:api`, `migrate`, `seed`. Vite proxea `/api` en dev.

## 4. Esquema de BD (MySQL, utf8mb4)
- `users`(id, email UNIQUE, name, role ENUM('admin','asesor','pastoral','peregrinacion'), pass_hash NULL, email_verified_at, status ENUM('invited','active','disabled'), failed_logins, locked_until)
- `sessions`, `tokens`(kind ENUM('invite','verify','reset','reg_verify','reg_cancel'), token_hash, expires_at, used_at)
- `derej`(slug UNIQUE, name, subtitle, audience, esquema, paso_total, sort) · `seasons`
- `retreats`(id, slug, codigo, derej_id, tipo, paso, tema_paso, title, subtitle, summary, season_slug, season_secondary, corte_simja, cover_media_id, estado_catalogo, **status** ENUM('borrador','en_revision','rechazado','publicado','programado'), publish_at, **published_snapshot JSON**, body JSON, created_by, updated_by, timestamps). El campo `jotform_url` queda solo como legado hasta que las inscripciones propias estén activas.
- `retreat_sessions`(id, retreat_id, starts_on, ends_on, place, **registration_mode** ENUM('none','own'), cupo NULL, notes, cost_info, status, publish_at, published_snapshot). `pilgrimages` lleva el mismo campo. Con `none` no hay formulario ni cupo y el calendario muestra **"Entrada libre"**.
- `verses`(id, ref, text_es, text_en, version_en, source_note, status, created_by): versículos reutilizables; el contenido los referencia por `ref` en vez de incrustar la cita (ver sec. 9).
- `pilgrimages`(id, slug, title, summary, itinerary JSON, place, starts_on, ends_on, cupo, cost_info TEXT, state ENUM('abierta','llena','cerrada','cancelada'), cover_media_id, status, publish_at, published_snapshot, created_by, updated_by, timestamps)
- `registrations`(id, event_type ENUM('pilgrimage','retreat_session'), event_id, name, phone, email, email_verified_at, emergency_name, emergency_phone, allergies_enc NULL, **guardian_name NULL, guardian_phone NULL** (obligatorios si el evento es de Simjá), **is_minor** BOOL, **minor_permission_at NULL** (13-17), consent_general_at, consent_sensitive_at NULL, status ENUM('pendiente_verificacion','confirmada','lista_espera','promovida_pendiente','cancelada','expirada'), waitlist_pos NULL, promote_deadline NULL, captcha_score, created_at, cancelled_at, purge_at)
- `reviews`(id, entity, entity_id, version, submitted_by, reviewer_id, decision ENUM('pendiente','aprobado','rechazado'), comment, timestamps)
- `translations`(entity, entity_id, lang, fields JSON, **source ENUM('auto','humano')**, **src_hash**, status, PK(entity, entity_id, lang))
- `glossary`(id, term, mode ENUM('keep','map'), en NULL, note)
- `team_members`, `xplev_items` (forma exacta a validar con `Nosotros.jsx`/`XpLev.jsx`)
- `media`(path, thumb_path, mime, w, h, bytes, caption, retreat_id, place, taken_on, uploaded_by)
- `contact_messages`(…, consent_at, captcha_score, ip_hash, status, handled_by)
- `audit_log`(user_id, action, entity, entity_id, diff JSON, ip, created_at)
Calendario/actividades **no tienen tabla**: vista derivada de `retreat_sessions` + `pilgrimages` publicados (o programados con `publish_at <= now()`) y futuros.

## 5. Roles, permisos y revisión
**Matriz** (E = crea/edita lo suyo, V = ve, A = aprueba/rechaza con comentario, U = total, Q = corrección de erratas)
| Recurso | admin | asesor | pastoral | peregrinacion |
|---|---|---|---|---|
| Usuarios | U | ✘ | ✘ | ✘ |
| Dérej, retiros, ediciones | U | V + A + Q | E | ✘ |
| XP Lev | U | V + A + Q | E | ✘ |
| Equipo (Nosotros) | U (E) | V + A + Q | ✘ | ✘ |
| Peregrinaciones | U | V + A + Q | ✘ | E |
| Inscripciones y CSV | U | ✘ | las de retiros | las de peregrinaciones |
| Bandeja de contacto | U (E) | ✘ | ✘ | ✘ |
| Medios | U | V | su ámbito | su ámbito |
| Traducción automática | U | ✘ | su ámbito | su ámbito |
| Audit log | U | V | ✘ | ✘ |
Implementación: `PERMS[rol][recurso]` en `lib/perm.js` + `preHandler(perm('retreats','write'))`; cada recurso lleva `scope` y se evalúa contra el del rol.

**Flujo**
```
borrador ─enviar─▶ en_revision ─aprobar (1 sola)─▶ publicado | programado
                        └─rechazar (comentario obligatorio)─▶ rechazado ─editar─▶ borrador
```
- Aprueba un `admin` o `asesor` **distinto del autor** (nadie se autoaprueba). Mínimo operativo: 1 admin + 1 asesor, o 2 admins.
- La web sirve `published_snapshot`; editar y reenviar no baja lo publicado. Al aprobar se copia fila→snapshot.
- **Corrección de erratas (Q)**: admin y asesor pueden editar texto de un ítem publicado sin revisión, solo campos de texto (no fechas, cupo, estado ni medios), con comentario obligatorio; actualiza fila y snapshot y deja diff en `audit_log` (`action='quick_fix'`).
- La traducción EN pasa por el mismo flujo (se revisa junto al ítem).
- Preview: token firmado de 15 min con el render real.
- Correos: envío a revisión → todos los admin/asesor activos (excepto autor); aprobación/rechazo → autor, con comentario.
- **Sin respuesta**: el ítem **nunca se publica solo**. Si lleva 48 h `en_revision`, el job envía recordatorio a **ambos aprobadores** (admin y asesor) y lo repite cada 48 h hasta que haya decisión; la cola del panel muestra la antigüedad. Un ítem `programado` cuyo `publish_at` llega sin aprobación se queda en `en_revision` y se avisa.

## 6. Inscripciones (peregrinaciones y sesiones de retiro)
- Campos **limitados** a: nombre, teléfono, correo, contacto de emergencia (nombre + teléfono), alergias (opcional). **Solo Simjá**: nombre y teléfono del padre/madre/tutor. **Solo 13-17**: casilla de permiso (ver abajo). Nada más.
- **Menores**: eventos de Simjá (≤12) los inscribe un adulto responsable (el correo y los consentimientos son suyos; "nombre" es el del niño). En Oz, 13-17 se autoinscribe marcando "soy menor de 18" y **"tengo permiso de mi madre/padre/tutor"** (`minor_permission_at`). La ley mexicana suele exigir consentimiento de quien ejerce la patria potestad para tratar datos de menores: **confirmar con asesoría legal**.
- `POST /api/public/inscripciones` con captcha v3, consentimiento general obligatorio y consentimiento expreso aparte si hay alergias.
- Solo para eventos con `registration_mode='own'`; con `none` ("Entrada libre") no hay formulario.
- **Verificación de correo**: queda `pendiente_verificacion` y se envía enlace; solo al verificar entra a `confirmada` o `lista_espera`. A las **24 h** sin verificar se envía **un recordatorio**; a las **72 h** → `expirada` y se libera el lugar (mientras tanto el lugar queda apartado).
- **Cupo sin carreras**: transacción con `SELECT ... FOR UPDATE` sobre el evento; `confirmadas < cupo` → `confirmada`, si no → `lista_espera` con `waitlist_pos` consecutivo.
- **Cancelación** por enlace con token (sin cuenta). Al cancelar una confirmada, en la misma transacción se promueve el menor `waitlist_pos` a `promovida_pendiente` con `promote_deadline = ahora + 48 h`, se avisa por correo con botón "confirmar". Sin respuesta en 48 h el job la pasa a `expirada` y promueve a la siguiente.
- Lista de espera visible: solo conteo; la posición propia va en su correo, nunca nombres.
- **CSV**: solo para el rol responsable (pastoral: retiros, peregrinacion: peregrinaciones, y admin); cada descarga queda en `audit_log`. Alergias solo con permiso `sensitive`.
- Alergias cifradas en columna (AES-256-GCM, `ENCRYPTION_KEY`), fuera de logs y de correos a terceros.
- Confirmación por correo en cada cambio de estado. Límite de 1 inscripción activa por correo y evento; rate limit y captcha.

## 7. API
Público (solo publicado, cache corta, `?lang=es|en` con fallback a ES): `GET /api/public/{derej,retiros,retiros/:slug,calendario,peregrinaciones,peregrinaciones/:slug,equipo,xplev,config}`; `POST /api/public/{contacto,inscripciones}`; `POST /api/public/inscripciones/{verificar,confirmar,cancelar}` (con token).
Auth: `POST /api/auth/{login,logout,accept-invite,verify-email,forgot,reset}`, `GET /api/auth/me`.
Panel (cookie + CSRF + permiso): CRUD `/api/admin/{users,derej,retiros,sesiones,peregrinaciones,equipo,xplev,media,glossary}`; `POST /api/admin/:recurso/:id/{submit,approve,reject,unpublish,quick-fix}`; `POST /api/admin/translate` (sec. 9); `GET /api/admin/revision`, `/preview/:tipo/:id`, `/inscripciones`, `/contacto`, `/audit`.
Toda escritura pasa por `audit(user, action, entity, before, after)` en la misma transacción. `GET /api/health` para healthcheck.

## 8. Autenticación y seguridad
- **Alta**: admin invita (correo + rol) → token (hash en BD, vence en 7 días) → contraseña (mín. 12) → `email_verified_at`. Sin registro público.
- **Login**: argon2, mensaje genérico, 5 fallos → bloqueo 15 min + aviso, rate limit por IP. Sesión 8 h de inactividad, tope 30 días, id rotado al login.
- **Reset**: token 1 h, un uso, invalida sesiones.
- **CSRF**: SameSite=Lax + `X-CSRF-Token` (double submit) + validación de `Origin`. **CORS**: mismo origen en producción (cerrado); solo `localhost:5173` en dev.
- **Rate limit**: login 5/min/IP; contacto e inscripciones 3/10 min/IP; API pública 120/min.
- **Uploads**: 8 MB, magic bytes (jpeg/png/webp), re-encode con sharp, nombre aleatorio, `nosniff`.
- **reCAPTCHA v3** (contacto e inscripciones): token con `GC_SITE`, verificación con `GC_SECRET`, `success`, `action` y `score >= CAPTCHA_MIN_SCORE` (0.5); bajo umbral → `spam`. `GC_SITE` se entrega por `/api/public/config`, sin `VITE_*`.
- Texto plano en correos y panel, SQL parametrizado, usuario MySQL solo DML, CSP con `google.com/recaptcha` y `gstatic.com`.
- Secretos solo en Coolify (nunca en la imagen ni en el repo). Repo privado: rotar claves no es urgente, sí si alguien con acceso sale del equipo.

## 9. Idioma (ES + EN) y traducción automática
- **Público bilingüe**: `/` (ES) y `/en/...`, `<html lang>`, `hreflang` + `canonical`, selector, sitemap con ambas. Panel solo en español. UI en diccionario propio `src/i18n/{es,en}.js` + hook `t()` (sin `react-i18next`).
- **Contenido**: tabla `translations(entity, entity_id, lang, fields JSON)` con ES en las columnas principales y EN opcional (fallback a ES con aviso). Evita columnas `_en` duplicadas y agregar un idioma no requiere migración.
- **Traducción automática**: **proveedor elegido por el dueño = Claude API**; comparativa que lo respalda:
| | DeepL API | LibreTranslate (self-hosted) | Claude API |
|---|---|---|---|
| Costo | **Free: 500 k caracteres/mes**; Pro de pago por uso | Gratis (solo infraestructura) | De pago por token; para este volumen, centavos por retiro (verificar precios vigentes) |
| Calidad ES→EN | Muy alta, natural | Media/baja, literal | Muy alta, entiende contexto doctrinal y respeta tono |
| Glosario | Nativo (API de glosarios) | No; protección por marcadores | Se incluye en el prompt |
| Privacidad | Externo; en el plan Free el texto puede usarse para mejorar el servicio, Pro no lo retiene | **Total**, queda en tu servidor | Externo; la API de empresa no entrena con tus datos por defecto (verificar condiciones) |
| Infra | Ninguna | Contenedor extra en Coolify, ~2 GB RAM para modelos | Ninguna |
| Riesgo | Tope mensual con volcado inicial grande | Calidad insuficiente para textos doctrinales | Costos si se abusa; alucinar o "mejorar" texto |
  El contenido a traducir es **texto público del sitio** (no datos personales), así que el envío a un tercero es aceptable; **nunca** se traducen inscripciones, mensajes de contacto ni datos de usuarios.
- **Decisión: Claude API por defecto** (`TRANSLATE_PROVIDER=claude`), con un modelo pequeño y rápido vigente (p. ej. `claude-haiku-5-5`; confirmar el id actual en la documentación antes de fijarlo en `TRANSLATE_MODEL`). Por qué: entiende contexto doctrinal, respeta tono y se le puede dar el glosario y reglas ("no traduzcas Dérej…", "deja las referencias bíblicas tal cual") en el **system prompt**. La llave ya existe en `.env`: la variable se llama **`CLAUDE`** (solo nombre, valor no revisado). Se recomienda renombrarla a `ANTHROPIC_API_KEY` en Coolify, o mapearla en `config.js`; si no es una llave de API de Anthropic, queda como pendiente. DeepL queda como adaptador de reserva; LibreTranslate se descarta (calidad débil y +2 GB de RAM).
- Controles de costo: traducir por ítem (no masivo), caché por `src_hash` (no retraduce si el ES no cambió), `max_tokens` acotado y tope mensual en `config`.
- **Diseño**: botón "Traducir automáticamente" por ítem en el panel → `POST /api/admin/translate` envía los campos ES (título, resumen, temas del `body`…) y guarda el resultado en `translations` como **borrador `source='auto'`** con `src_hash` del ES; al editar un humano pasa a `source='humano'`; si cambia el ES queda marcada "desactualizada". La interfaz sola: `translate(textos[], {from:'es', to:'en', glossary}) → textos[]` (un archivo, ~60 líneas, un adaptador por proveedor).
- **Glosario** (`glossary`): modo `keep` (no traducir: Dérej Guibor/Kavod/Mesharét/Simjá/Oz/Jaím, nombres hebreos, XP Lev, Peregrinos, nombres de retiros) y `map` (término → traducción fija, p. ej. "Hora Santa" → "Holy Hour"). Con Claude va en el **system prompt**; con otros proveedores, glosario nativo o marcadores `⟦n⟧` que se restauran. Siempre se valida que los términos `keep` sigan presentes.
- **Escritura: nunca se traduce a máquina.** El ES cita la LBLA; la cita en inglés se guarda **a mano, versículo por versículo**, desde una versión católica inglesa establecida, en la tabla `verses` (`ref`, `text_es`, `text_en`, `version_en`). El traductor deja la referencia (`ref`) intacta y el texto bíblico se inserta desde `verses`; si falta `text_en`, el panel marca el pasaje "pendiente" y bloquea el envío a revisión del EN.
  - **Versión confirmada: RSV-2CE** (Revised Standard Version, Second Catholic Edition, Ignatius): exige línea de crédito y permite citar un número limitado de versículos sin permiso. **Verificar los términos exactos** (límite y texto del crédito) con el editor.
  - Reserva si los términos no alcanzan: NABRE (revisar términos de la USCCB) o dominio público (Douay-Rheims).
  - Cada `verses.version_en` se imprime con su crédito en el pie de la página EN.
- El EN auto siempre pasa por la revisión (sec. 5); no se publica solo.

## 10. Retención de datos (aceptada)
| Dato | Plazo |
|---|---|
| Mensajes de contacto | 12 meses (spam 30 días) |
| Inscripciones | anonimizar/borrar a los 90 días del fin del evento |
| Alergias + contacto de emergencia | borrar a los **30 días** del fin del evento |
| Inscripciones canceladas/expiradas | 30 días |
| Audit log | 24 meses |
| Invitaciones sin aceptar | vencen a los 7 días (purga a los 30) |
| Sesiones | máx. 30 días; expiradas se purgan a diario |
`jobs/retention.js` (idempotente, registra cuántas filas borró). Debe declararse en el aviso de privacidad. En la misma corrida **horaria** también: expira promociones de lista de espera (48 h), envía el recordatorio de verificación a las 24 h y expira inscripciones no verificadas a las 72 h, y manda recordatorios de revisión cada 48 h a admin y asesor. Las purgas pesadas de retención solo a las 03:00.

## 11. Despliegue: Docker + Coolify
**Arquitectura recomendada (2 recursos en Coolify)**
1. **Application `mcj`** desde el repo Git (build pack **Dockerfile**): una sola imagen donde la API Node sirve la API, el `dist/` del front y `/uploads` (`@fastify/static`, cache largo en estáticos). Menos contenedores que web+api separados; si luego se quiere nginx aparte, se pasa a build pack **Docker Compose** con `web` (nginx estático) + `api`.
2. **Database MySQL 8** como recurso de Coolify (con volumen persistente y backups programados) en red interna; `DB_HOST` apunta al nombre interno del recurso. Alternativa: servicio `db` dentro del compose.
- **Dockerfile** multi-stage: etapa 1 `node:22-bookworm-slim` hace `npm ci && vite build`; etapa 2 copia `server/`, `dist/` y deps de producción (argon2/sharp con binarios nativos funcionan en Debian slim), usuario no root, `HEALTHCHECK` a `/api/health`, `CMD ["node","server/index.js"]`. Las migraciones corren al arrancar (`npm run migrate && node server/index.js`) o como comando de pre-despliegue de Coolify.
- **Dominio y HTTPS**: se configura `micaminoesjesus.org` (y `www` → redirección) en la aplicación; el **proxy de Coolify (Traefik)** emite y renueva Let's Encrypt. **Se elimina Caddy/certbot.**
- **Variables**: se cargan en la UI de Coolify (marcar como runtime y secretas); no hay `.env` en el repo ni en la imagen. `.env.example` solo documenta los nombres.
- **Almacenamiento persistente**: volumen de Coolify montado en `UPLOAD_DIR=/data/uploads`; volumen de MySQL gestionado por el recurso.
- **Backups**: la BD usa **Scheduled Backups de Coolify**, frecuencia diaria y retención configurable. **¿Por qué S3?** Si el servidor o su disco muere, los respaldos guardados en el mismo servidor mueren con él; S3 es solo "otro lugar fuera del servidor". **Destino decidido: AWS S3.** Las credenciales ya existen en `.env` (nombres: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; no hay `S3_ENDPOINT` porque es AWS nativo); se cargan en Coolify como destino S3 y para el `rclone` de uploads. Buenas prácticas: usuario IAM con permisos **solo** sobre ese bucket, bucket privado con cifrado y versionado, regla de ciclo de vida alineada a la retención (sec. 10). Para este volumen cuesta pocos pesos al mes (verificar precios vigentes). **Plan B (riesgoso)**: backups locales de Coolify + descarga manual periódica; depende de acordarse, no se recomienda. El volumen de uploads no lo respalda Coolify de forma nativa (verificar en la versión instalada): una **Scheduled Task** semanal/diaria ejecuta `rclone sync /data/uploads s3:...` desde el contenedor, o un contenedor sidecar con ese comando. Los backups contienen datos personales: cifrar (SSE del bucket o `rclone crypt`) y aplicar la retención de la sec. 10. **Prueba de restauración trimestral.**
- **Healthchecks**: el de Coolify/Docker sobre `/api/health` (comprueba BD) habilita despliegues sin corte (rolling) y reinicio automático.
- **Cron / retención**: recomiendo una **Scheduled Task de Coolify** (`node server/jobs/retention.js`, horaria) porque tiene log visible y no se duplica si hay más de una réplica ni se pierde al reiniciar; alternativa, `node-cron` dentro de la API (más simple pero se ejecuta por réplica).
- **Entornos**: Coolify ya instalado; **solo producción** (sin staging ni previews). Nota de seguridad: (1) se prueba todo en local con `docker compose` + MySQL local sembrado (`seed`) y `MAIL_DISABLED=true` antes de desplegar; (2) las migraciones deben ser **retrocompatibles** (agregar columnas/tablas, no renombrar ni borrar en el mismo despliegue; el código nuevo y el viejo deben convivir) para poder volver a la imagen anterior; (3) **backup de la BD justo antes de cada despliegue** que traiga migraciones (backup manual en Coolify o `mysqldump` previo) y rollback documentado.
- **Servidor**: VPS con Coolify instalado (≥2 vCPU / 4 GB RAM sugerido; sin LibreTranslate no hace falta más); firewall solo 80/443/22, panel de Coolify tras dominio con HTTPS y 2FA, SSH solo por llave, actualizaciones automáticas.
- **Correo**: SPF, DKIM y DMARC de `micaminoesjesus.org`; `SMTP_FROM=no-reply@micaminoesjesus.org`. Sin esto, los avisos de aprobación e inscripción caen en spam.
- **SEO**: el servidor inyecta `<title>` y metas OG por ruta e idioma en `index.html` y genera `sitemap.xml` bilingüe; el front hace fetch en runtime (lo programado se publica solo, sin rebuild).

## 12. Aviso de privacidad (LFPDPPP) y bloqueadores de lanzamiento
- Responsable: **Mi Camino es Jesús**, **persona moral aún inexistente**. El aviso se redacta como **borrador con marcadores** (`[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[REPRESENTANTE]`, fecha de vigencia) y lo valida asesoría legal. **No habrá buzón `privacidad@`**: las solicitudes ARCO entran por el formulario de contacto (`/contacto`) con asunto **"Derechos ARCO"**; se enrutan a `CONTACT_TO` y quedan **marcadas** en la bandeja (`contact_messages.kind='arco'`, filtro y etiqueta visible, con fecha límite de respuesta calculada; el plazo legal se entiende de 20 días hábiles, verificar con asesoría). El aviso en el repo ya apunta a `/contacto`. Falta nombrar a la persona que responde.
- La ley vigente es la **LFPDPPP publicada en el DOF el 20-mar-2025**: exige aviso **integral y simplificado**, finalidades, ARCO y consentimiento. Verificar con asesoría los detalles (autoridad, plazos).
- Datos: contacto (nombre, correo, teléfono, mensaje, IP hasheada, score captcha) e inscripción (+ emergencia, alergias, y tutor en Simjá).
- **Alergias = dato sensible (salud)**: consentimiento **expreso**, aparte de la casilla general y sin premarcar; campo opcional; cifrado; visible solo al rol responsable; borrado a los 30 días; fuera de logs y CSV de roles sin permiso.
- Terceros que tocan datos: SMTP y reCAPTCHA (Google); declararlos aunque no actúen "por cuenta".
- Páginas `/aviso-de-privacidad` y `/en/privacy-notice`, enlazadas en contacto e inscripciones; aviso simplificado junto a cada formulario.
- **Menores**: Simjá solo por adulto responsable; 13-17 con casilla de permiso (confirmar con asesoría). **No se publican fotos de menores** hasta definir consentimiento parental.
- **Bloqueadores de lanzamiento**:
  1. **Inscripciones con datos sensibles (alergias) NO salen a producción hasta que exista el responsable legal y el aviso esté firmado.** Mientras tanto se puede lanzar inscripciones **sin** el campo alergias (`ALLERGIES_ENABLED=false`), o dejar el resto de la web y el contacto en vivo.
  2. El formulario de contacto tampoco debe ir a producción sin aviso publicado, aunque sea borrador revisado.
  3. Inscripciones de menores, hasta confirmar el criterio legal.

## 13. `.env.example` (nombres; en producción van en la UI de Coolify)
```
NODE_ENV=production
PORT=3001
PUBLIC_URL=https://micaminoesjesus.org
DB_HOST DB_PORT DB_USER DB_PASS DB_NAME
SESSION_SECRET              # cookies y tokens de preview
ENCRYPTION_KEY              # 32 bytes base64, cifrado de alergias
GC_SITE GC_SECRET           # reCAPTCHA v3
CAPTCHA_MIN_SCORE=0.5
SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS
SMTP_FROM=no-reply@micaminoesjesus.org
CONTACT_TO
DEFAULT_LANG=es
TRANSLATE_PROVIDER=claude   # claude | deepl | libretranslate
ANTHROPIC_API_KEY           # hoy la llave se llama CLAUDE en .env; renombrar
TRANSLATE_MODEL             # modelo pequeño vigente (confirmar id)
TRANSLATE_MONTHLY_CAP       # tope de tokens/mes
# reserva: DEEPL_API_KEY / LIBRETRANSLATE_URL
ALLERGIES_ENABLED=false     # hasta que exista el responsable legal
MAIL_DISABLED=false         # true en previews
S3_BUCKET S3_REGION S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY   # backups off-server (AWS S3)
UPLOAD_DIR=/data/uploads
UPLOAD_MAX_MB=8
FIRST_ADMIN_EMAIL           # el seed crea el primer admin
```
`MYSQL_ROOT_PASSWORD` solo si la BD va como servicio de compose; el recurso MySQL de Coolify lo gestiona.

## 14. Migración de datos (seed)
`server/seed.js` importa `retreats.js` (cambiando los `import` de imágenes por rutas), normaliza `derej-gibor`→`guibor`, mapea `TIPO_FROM_CATEGORY`, copia `temas/cronograma/fichaTecnica` a `body`, pasa las imágenes por sharp a `media` y deja todo `publicado` con snapshot. `activities.json` (1 registro) pasa a `retreat_sessions` (el link Jotform queda como legado hasta activar inscripciones propias). Idempotente (upsert por `slug`). Verificación: 48 retiros, 6 dérej, 5 temporadas. Equipo desde `Nosotros.jsx`. Glosario inicial sembrado con los nombres de Dérej y términos fijos.

## 15. Fases y estimación (developer a medio tiempo)
| Fase | Contenido | Tamaño |
|---|---|---|
| F0 + F1 | Quitar `Admin.jsx`, captcha aritmético; rediseño con datos estáticos; unificar claves; andamiaje i18n (`/en`, diccionario, selector, hreflang). **En curso en `redesign-c`** | 4-7 días |
| F2 | `/server`, migraciones, auth con 4 roles, sesiones, permisos, audit, seed, estados + revisión + correos | 8-10 días |
| F3 | Panel: usuarios, Dérej/retiros + ediciones, peregrinaciones, equipo, XP Lev, medios con sharp, cola de revisión + preview + erratas, editor EN, **traducción automática + glosario**, calendario derivado, audit | 12-16 días |
| F4 | Contacto (reCAPTCHA v3, correo + bandeja) + **inscripciones** (retiros y peregrinaciones, verificación de correo, cupo, espera 48 h, tutor Simjá, permiso 13-17, CSV, cifrado) | 9-12 días |
| F5 | Dockerfile, Coolify (app + MySQL + dominio + variables + backups S3 + tarea de retención), SPF/DKIM/DMARC, OG/sitemap bilingüe, restauración probada | 3-5 días |
**Total: ~8-11 semanas** a medio tiempo (antes 7-10). F1 y F2 pueden ir en paralelo. Riesgos de desvío: entidad legal/aviso (bloquea F4 en producción) y revisión de las traducciones EN.

## 16. Preguntas abiertas
1. **Entidad legal**: ¿fecha estimada de constitución y quién será el representante? Hasta entonces, alergias e inscripciones de menores no salen (bloqueador).
2. **Backups**: AWS S3 decidido; confirmar que el usuario IAM tenga permisos mínimos (solo ese bucket) y quién custodia las llaves. ¿Specs del servidor de Coolify?
3. **Traducción y Biblia**: ¿la variable `CLAUDE` del `.env` es una llave de API de Anthropic (renombrar a `ANTHROPIC_API_KEY`)? RSV-2CE confirmada: verificar crédito y límite de versículos con el editor. ¿Quién captura los versículos EN?
4. **Menores**: confirmar con asesoría la casilla de permiso en 13-17 y qué datos mínimos se piden al tutor; ¿Oz también tiene eventos con menores de 13?
5. **Fotos de menores**: criterio de consentimiento parental (pendiente).
6. **Aprobadores**: el dueño confirmó **admin + asesor** como los dos aprobadores; falta confirmar los **nombres/correos** y quién suple si pasan semanas sin responder (no se publica solo; solo recordatorios cada 48 h).
7. **ARCO**: ¿quién responde las solicitudes marcadas "Derechos ARCO" en la bandeja y en cuántos días (límite legal 20 días hábiles, verificar)?
8. **Retrocompatibilidad**: ¿se acepta la política de migraciones aditivas + backup previo a cada despliegue (sec. 11) como única red de seguridad al no haber staging?

## Pendiente de verificar
No se revisó en detalle `XpLev.jsx`, `Nosotros.jsx` ni `ProyectoDetalle.jsx` (los modelos `xplev_items` y `team_members` son provisionales). A confirmar con fuentes oficiales o asesoría: LFPDPPP 2025 (incluido el plazo de 20 días hábiles), términos de cita de RSV-2CE y NABRE, condiciones de datos de la API de Claude, precios vigentes de S3, y si la versión de Coolify instalada respalda volúmenes de aplicación. Del `.env` solo se leyó el nombre de la variable `CLAUDE`, no su valor.
