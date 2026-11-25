# Graph Report - micaminoesjesus  (2026-11-24)

## Corpus Check
- 177 files · ~1,083,883 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 6, .css 4, .example 1)

## Summary
- 1405 nodes · 3301 edges · 78 communities (61 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4608802f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- retreats.js
- perm.js
- lib/push.js
- build-equipo.mjs
- CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)
- environment
- ProyectoDetalle.jsx
- build-pptx.cjs
- content.js
- environment
- ui.jsx
- .oxlintrc.json
- env
- regpublic.js
- index.jsx
- React + Vite
- regrules.js
- Inscripciones.jsx
- CLAUDE.md
- .claude/CLAUDE.md
- buildFichaTecnica
- PanelApp.jsx
- Media.jsx
- schemas.js
- Plan técnico v3: backend, panel y gestión de contenido (MCJ)
- scripts
- Content.jsx
- dependencies
- FormBody
- Review.jsx
- get
- Despliegue en Coolify (producción)
- build.py
- Proyectos.jsx
- regadmin.js
- regsvc.js
- What You Must Do When Invoked
- q
- app.js
- useData
- admin.js
- 001_init.sql
- App.jsx
- Home.jsx
- useLang
- Tarjetas de presentación MCJ — guía rápida
- Footer.jsx
- routes/seo.js
- routes/auth.js
- routes/media.js
- gen-panel-icons.js
- graphify reference: extra exports and benchmark
- post
- graphify reference: query, path, explain
- config.js
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- rows.js
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- sw.js
- 004_translation.sql
- extraction-spec.md
- 003_media.sql
- 005_registrations.sql
- 006_contact.sql
- ref_node_assert
- react-router-dom
- rolesWith
- routes/push.js
- gen-seed-sql.js
- regrules.test.js

## God Nodes (most connected - your core abstractions)
1. `useLang()` - 67 edges
2. `q()` - 45 edges
3. `get()` - 39 edges
4. `adminRoutes()` - 38 edges
5. `environment` - 36 edges
6. `errText()` - 34 edges
7. `post()` - 31 edges
8. `react-router-dom` - 30 edges
9. `useLoad()` - 30 edges
10. `react` - 29 edges

## Surprising Connections (you probably didn't know these)
- `headTags()` --calls--> `pageTitle()`  [EXTRACTED]
  server/lib/seo.js → src/i18n/meta.js
- `buildApp()` --indirect_call--> `adminRoutes()`  [INFERRED]
  server/app.js → server/routes/admin.js
- `buildApp()` --indirect_call--> `authRoutes()`  [INFERRED]
  server/app.js → server/routes/auth.js
- `buildApp()` --indirect_call--> `publicRoutes()`  [INFERRED]
  server/app.js → server/routes/public.js
- `buildApp()` --indirect_call--> `regPublicRoutes()`  [INFERRED]
  server/app.js → server/routes/regpublic.js

## Import Cycles
- None detected.

## Communities (78 total, 12 thin omitted)

### Community 0 - "retreats.js"
Cohesion: 0.03
Nodes (70): src_assets_images_adoracion_camino_belen, src_assets_images_adoracion_cenaculo, src_assets_images_jaim_alabastroroto, src_assets_images_jaim_belenretiro, src_assets_images_jaim_jesucristonuestraesperanza, src_assets_images_mesharet_betsalel, src_assets_images_mesharet_catequistas, src_assets_images_mesharet_hospitalidad (+62 more)

### Community 1 - "perm.js"
Cohesion: 0.16
Nodes (16): ALL, approverRoles, can(), PERMS, R, REVIEWER, RW, assertFresh() (+8 more)

### Community 2 - "lib/push.js"
Cohesion: 0.17
Nodes (11): deliver(), DIGEST_HOUR, digestDue(), digestMsg(), endpointOk(), HOSTS, ITEM, mxLocal() (+3 more)

### Community 3 - "build-equipo.mjs"
Cohesion: 0.07
Nodes (33): FONT_FILES, FORMATS, here, localFonts, src, tmp, byDerej, calRows (+25 more)

### Community 4 - "CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)"
Cohesion: 0.11
Nodes (18): 0. PROPÓSITO DE ESTE DOCUMENTO, 10. RESUMEN DE PENDIENTES (BACKLOG GENERAL), 1.1 Naturaleza de cada Dérej, 1.2 Sistema de códigos internos, 1.3 Categorías de formato (tipo de contenido), 1.4 Etiquetas de Tiempo Litúrgico, 1.5 Presencia sacerdotal obligatoria, 1. LA ARQUITECTURA GENERAL: LOS SEIS DÉREJ (דֶּרֶךְ - "CAMINOS") (+10 more)

### Community 5 - "environment"
Cohesion: 0.04
Nodes (45): build, environment, expose, restart, volumes, ADMIN_NAME, ADMIN_PASS, ADMIN_USER (+37 more)

### Community 6 - "ProyectoDetalle.jsx"
Cohesion: 0.30
Nodes (8): adaptRetreat(), TIPO_ABBR, useCatalog(), bundled, imgUrl(), Home(), FICHA_ICONS, ProyectoDetalle()

### Community 7 - "build-pptx.cjs"
Cohesion: 0.12
Nodes (13): ASSETS, fs, HEX, JSZip, OUT, path, PLAN, PptxGenJS (+5 more)

### Community 8 - "content.js"
Cohesion: 0.19
Nodes (17): buildCalendar(), formatRange(), FREE, MES, parts(), TO, published(), publishedBySlug() (+9 more)

### Community 9 - "environment"
Cohesion: 0.05
Nodes (37): build, depends_on, environment, ports, profiles, command, condition, environment (+29 more)

### Community 10 - "ui.jsx"
Cohesion: 0.08
Nodes (32): ACTIONS, Dashboard(), day(), ORDER, Ctx, Pendientes(), pendingCount(), PendingGroups() (+24 more)

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "env"
Cohesion: 0.09
Nodes (21): runs-on, steps, DB_HOST, DB_NAME, DB_PASS, DB_USER, MAIL_DISABLED, SESSION_SECRET (+13 more)

### Community 13 - "regpublic.js"
Cohesion: 0.16
Nodes (14): ref_node_test, zod, email, arcoDue(), contactSchema, SUBJECTS, pushContact(), fail() (+6 more)

### Community 14 - "index.jsx"
Cohesion: 0.27
Nodes (6): DICT, langOf(), strip(), PAGE_META, ROUTES, SITE_NAME

### Community 15 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 16 - "regrules.js"
Cohesion: 0.10
Nodes (15): byQueue(), HOLDS, MAILS, nextInLine(), OFFER_MS, person, phone, position() (+7 more)

### Community 17 - "Inscripciones.jsx"
Cohesion: 0.13
Nodes (23): Due(), PILL, ST, SUBJECT, today(), ACTIONS, Cupo(), EventCard() (+15 more)

### Community 21 - "PanelApp.jsx"
Cohesion: 0.11
Nodes (38): react, nav(), Avisos(), Instalar(), InstallCard(), IosGuide(), read(), Mas() (+30 more)

### Community 22 - "Media.jsx"
Cohesion: 0.13
Nodes (33): ACTIONS, ENTITY_NAME, InviteForm(), Users(), userState(), api(), ApiError, del() (+25 more)

### Community 23 - "schemas.js"
Cohesion: 0.07
Nodes (29): changePassword, date, decision, enText, forgot, glossaryTerm, invite, login (+21 more)

### Community 24 - "Plan técnico v3: backend, panel y gestión de contenido (MCJ)"
Cohesion: 0.10
Nodes (20): 0. Estado actual, 10. Retención de datos (aceptada), 11. Despliegue: Docker + Coolify, 12. Aviso de privacidad (LFPDPPP) y bloqueadores de lanzamiento, 13. `.env.example` (nombres; en producción van en la UI de Coolify), 14. Migración de datos (seed), 15. Fases y estimación (developer a medio tiempo), 16. Preguntas abiertas (+12 more)

### Community 25 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, create-admin, db:down, db:up, dev, dev:api, job:hourly (+7 more)

### Community 26 - "Content.jsx"
Cohesion: 0.10
Nodes (32): put(), bodyErrors(), bodyToForm(), clean(), cleanList(), drop(), formToBody(), ICONS (+24 more)

### Community 27 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, argon2, fastify, @fastify/cookie, @fastify/helmet, @fastify/multipart, @fastify/rate-limit, @fastify/static (+8 more)

### Community 28 - "FormBody"
Cohesion: 0.22
Nodes (17): ctx, Final(), FormBody(), go(), next(), patchWithVersion(), persist(), save() (+9 more)

### Community 29 - "Review.jsx"
Cohesion: 0.16
Nodes (20): photoUrl(), CardBody(), diffOf(), enInfo(), INTERNAL, norm(), said(), show() (+12 more)

### Community 30 - "get"
Cohesion: 0.26
Nodes (16): Audit(), get(), Bandeja(), ContentList(), FormScreen(), nuevo(), useRetreats(), Details() (+8 more)

### Community 31 - "Despliegue en Coolify (producción)"
Cohesion: 0.15
Nodes (12): 1. Preparación, 2. Base de datos MySQL (AWS RDS, externa), 3. Aplicación, 3b. Inscripciones, contacto y reCAPTCHA (F4), 3c. Panel como app y avisos (push), 4. Tarea programada (recordatorios, publicación programada, inscripciones, retención y limpieza), 5. Primer despliegue (checklist), 6. DNS (+4 more)

### Community 32 - "build.py"
Cohesion: 0.06
Nodes (72): A(), B(), back_a(), back_c2(), C(), capy(), centerline(), check() (+64 more)

### Community 33 - "Proyectos.jsx"
Cohesion: 0.13
Nodes (19): Calendario, Proyectos, src_assets_images_karposhub, src_assets_images_proyecto_ignis, src_assets_images_proyecto_ignis_et_logos, src_assets_images_xp_lev, Calendario(), isPer() (+11 more)

### Community 34 - "regadmin.js"
Cohesion: 0.39
Nodes (7): cell(), toCsv(), forbidden(), kindOf, plain(), regAdminRoutes(), sensitive()

### Community 35 - "regsvc.js"
Cohesion: 0.12
Nodes (33): ref_node_crypto, GOOGLE_VERIFY, verifyCaptcha(), decrypt(), encrypt(), parseKey(), justFilled(), acceptOffer() (+25 more)

### Community 36 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 37 - "q"
Cohesion: 0.18
Nodes (21): q(), runHourly(), approvers(), labelOf(), notifyDecision(), notifyReminders(), notifySubmitted(), idsOf() (+13 more)

### Community 38 - "app.js"
Cohesion: 0.07
Nodes (28): devDependencies, oxlint, @types/react, @types/react-dom, vite, @vitejs/plugin-react, name, private (+20 more)

### Community 39 - "useData"
Cohesion: 0.27
Nodes (13): EMPTY, RegistrationForm(), submit(), cache, load(), useData(), captchaToken(), issueMap() (+5 more)

### Community 40 - "admin.js"
Cohesion: 0.12
Nodes (36): ENTITIES, snapshotOf(), toColumns(), batches(), buildSystemPrompt(), claudeBatch(), draftOnSubmit(), escapeRe() (+28 more)

### Community 41 - "001_init.sql"
Cohesion: 0.16
Nodes (15): audit_log, derej, pilgrimages, retreat_sessions, retreats, reviews, seasons, sessions (+7 more)

### Community 42 - "App.jsx"
Cohesion: 0.14
Nodes (13): App(), AvisoPrivacidad, Contacto, Home, Nosotros, onPanelHost, PanelApp, ProyectoDetalle (+5 more)

### Community 43 - "Home.jsx"
Cohesion: 0.11
Nodes (18): Peregrinos, src_assets_fotos_web_hero_patio, src_assets_fotos_web_hero_velas, src_assets_fotos_web_nosotros_comunidad, src_assets_fotos_web_nosotros_escalinata, src_assets_fotos_web_tira_adoracion, src_assets_fotos_web_tira_cruz, src_assets_fotos_web_tira_mesa (+10 more)

### Community 44 - "useLang"
Cohesion: 0.11
Nodes (24): Footer(), Header(), LangSwitch(), NAME, OTROS_HINT, SubLink(), Layout(), Field() (+16 more)

### Community 45 - "Tarjetas de presentación MCJ — guía rápida"
Cohesion: 0.22
Nodes (8): Canva, Fuentes (instalarlas antes de abrir nada), Hacer el QR de una persona, Illustrator, Medidas e impresión, Nombres largos, Regenerar todo desde cero, Tarjetas de presentación MCJ — guía rápida

### Community 46 - "Footer.jsx"
Cohesion: 0.31
Nodes (7): src_assets_logos_isotipo_bn, LINKS, Verso(), CONTACTO, INSTAGRAM_URL, NAV, VERSO

### Community 47 - "routes/seo.js"
Cohesion: 0.13
Nodes (24): ref_node_vm, buildApp(), injectPanel(), isPanelHost(), isPanelPath(), panelRedirect(), TAGS, buildSitemap() (+16 more)

### Community 48 - "routes/auth.js"
Cohesion: 0.17
Nodes (25): one(), authenticate(), COOKIE, cookieOptions(), createSession(), csrf(), destroySession(), hash() (+17 more)

### Community 49 - "routes/media.js"
Cohesion: 0.19
Nodes (13): sharp, ImageError, MAX_SIDE, processImage(), sniff(), THUMB_SIDE, IMAGE_FIELDS, MEDIA_REF (+5 more)

### Community 50 - "gen-panel-icons.js"
Cohesion: 0.38
Nodes (6): icon(), logoAt(), OUT, reach(), SVG, w

### Community 51 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 52 - "post"
Cohesion: 0.23
Nodes (11): src_assets_logos_logotipo, post(), ChangePassword(), Forgot(), Invite(), Login(), Reset(), SetPassword() (+3 more)

### Community 53 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 54 - "config.js"
Cohesion: 0.18
Nodes (16): ref_node_util, { values }, bool, config, opt, parseConfig(), prodChecks(), schema (+8 more)

### Community 55 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 56 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 57 - "rows.js"
Cohesion: 0.16
Nodes (12): CAL_DATES, json(), seedRows(), src_assets_images_equipo_angelica, src_assets_images_equipo_cristopher, src_assets_images_equipo_jehosua, src_assets_images_equipo_maribel, src_assets_images_equipo_silvia (+4 more)

### Community 58 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 61 - "sw.js"
Cohesion: 0.50
Nodes (3): clean, isPanelPath(), safeUrl()

### Community 71 - "react-router-dom"
Cohesion: 0.18
Nodes (19): react-router-dom, Inscripcion, PeregrinacionDetalle, PilgrimNext(), Async(), Failed(), useMeta(), pageTitle() (+11 more)

### Community 72 - "rolesWith"
Cohesion: 0.29
Nodes (7): approverRolesOf(), inboxRoles(), managerRolesOf(), rolesWith(), canManage(), canRead(), scopeOf()

### Community 73 - "routes/push.js"
Cohesion: 0.38
Nodes (6): MAX_PER_USER, hashEndpoint(), b64, limit(), pushRoutes(), sub

### Community 76 - "gen-seed-sql.js"
Cohesion: 0.33
Nodes (11): mysql2, buildSql(), cols(), esc(), fixIds(), insertIfMissing(), OUT, PUB (+3 more)

## Knowledge Gaps
- **432 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+427 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 612 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router-dom` connect `react-router-dom` to `Proyectos.jsx`, `app.js`, `useData`, `ProyectoDetalle.jsx`, `App.jsx`, `Home.jsx`, `useLang`, `ui.jsx`, `Footer.jsx`, `index.jsx`, `Inscripciones.jsx`, `post`, `PanelApp.jsx`, `Content.jsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `react` connect `PanelApp.jsx` to `app.js`, `useData`, `ProyectoDetalle.jsx`, `react-router-dom`, `App.jsx`, `ui.jsx`, `useLang`, `index.jsx`, `Inscripciones.jsx`, `post`, `Media.jsx`, `Content.jsx`, `Review.jsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `zod` connect `regpublic.js` to `regadmin.js`, `app.js`, `admin.js`, `routes/push.js`, `regrules.js`, `config.js`, `schemas.js`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `adminRoutes()` (e.g. with `buildApp()` and `authenticate()`) actually correct?**
  _`adminRoutes()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _432 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `retreats.js` be split into smaller, more focused modules?**
  _Cohesion score 0.02702702702702703 - nodes in this community are weakly interconnected._
- **Should `build-equipo.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07254623044096728 - nodes in this community are weakly interconnected._