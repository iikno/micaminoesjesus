# Graph Report - micaminoesjesus  (2026-11-24)

## Corpus Check
- 175 files · ~917,308 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 6, .css 4, .example 1)

## Summary
- 1348 nodes · 3175 edges · 79 communities (63 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2f1f4088`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- retreats.js
- hourly.js
- devDependencies
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
- panel/pwa.js
- errText
- schemas.js
- Plan técnico v3: backend, panel y gestión de contenido (MCJ)
- scripts
- Translation.jsx
- dependencies
- Content.jsx
- Review.jsx
- lib/translate.js
- Despliegue en Coolify (producción)
- build.py
- Proyectos.jsx
- ref_node_test
- regsvc.js
- What You Must Do When Invoked
- pushsvc.js
- app.js
- useData
- admin.js
- 001_init.sql
- App.jsx
- Home.jsx
- useLang
- routes/media.js
- Header.jsx
- push.test.js
- q
- gen-panel-icons.js
- regs.js
- graphify reference: extra exports and benchmark
- PanelApp.jsx
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
- resources.jsx
- routes/seo.js
- gen-seed-sql.js
- calendar.js
- verifyCaptcha

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

## Communities (79 total, 11 thin omitted)

### Community 0 - "retreats.js"
Cohesion: 0.03
Nodes (70): src_assets_images_adoracion_camino_belen, src_assets_images_adoracion_cenaculo, src_assets_images_jaim_alabastroroto, src_assets_images_jaim_belenretiro, src_assets_images_jaim_jesucristonuestraesperanza, src_assets_images_mesharet_betsalel, src_assets_images_mesharet_catequistas, src_assets_images_mesharet_hospitalidad (+62 more)

### Community 1 - "hourly.js"
Cohesion: 0.19
Nodes (17): runHourly(), sendMail(), trySend(), approvers(), labelOf(), notifyDecision(), notifyReminders(), notifySubmitted() (+9 more)

### Community 2 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, oxlint, @types/react, @types/react-dom, vite, @vitejs/plugin-react

### Community 3 - "build-equipo.mjs"
Cohesion: 0.08
Nodes (31): FONT_FILES, FORMATS, here, localFonts, src, tmp, byDerej, calRows (+23 more)

### Community 4 - "CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)"
Cohesion: 0.11
Nodes (18): 0. PROPÓSITO DE ESTE DOCUMENTO, 10. RESUMEN DE PENDIENTES (BACKLOG GENERAL), 1.1 Naturaleza de cada Dérej, 1.2 Sistema de códigos internos, 1.3 Categorías de formato (tipo de contenido), 1.4 Etiquetas de Tiempo Litúrgico, 1.5 Presencia sacerdotal obligatoria, 1. LA ARQUITECTURA GENERAL: LOS SEIS DÉREJ (דֶּרֶךְ - "CAMINOS") (+10 more)

### Community 5 - "environment"
Cohesion: 0.04
Nodes (45): build, environment, expose, restart, volumes, ADMIN_NAME, ADMIN_PASS, ADMIN_USER (+37 more)

### Community 6 - "ProyectoDetalle.jsx"
Cohesion: 0.20
Nodes (12): Nosotros, src_assets_fotos_web_nosotros_comunidad, src_assets_fotos_web_nosotros_escalinata, adaptRetreat(), TIPO_ABBR, useCatalog(), bundled, imgUrl() (+4 more)

### Community 7 - "build-pptx.cjs"
Cohesion: 0.12
Nodes (13): ASSETS, fs, HEX, JSZip, OUT, path, PLAN, PptxGenJS (+5 more)

### Community 8 - "content.js"
Cohesion: 0.30
Nodes (11): published(), publishedBySlug(), snaps(), fallbackDeep(), LANGS, localize(), normLang(), plain() (+3 more)

### Community 9 - "environment"
Cohesion: 0.05
Nodes (37): build, depends_on, environment, ports, profiles, command, condition, environment (+29 more)

### Community 10 - "ui.jsx"
Cohesion: 0.11
Nodes (30): ACTIONS, Dashboard(), day(), ORDER, InstallCard(), IosGuide(), read(), Grid() (+22 more)

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "env"
Cohesion: 0.09
Nodes (21): runs-on, steps, DB_HOST, DB_NAME, DB_PASS, DB_USER, MAIL_DISABLED, SESSION_SECRET (+13 more)

### Community 13 - "regpublic.js"
Cohesion: 0.12
Nodes (22): ref_node_crypto, arcoDue(), contactSchema, SUBJECTS, decrypt(), encrypt(), parseKey(), cell() (+14 more)

### Community 14 - "index.jsx"
Cohesion: 0.23
Nodes (11): buildSitemap(), esc(), headTags(), trim(), urlFor(), DICT, langOf(), strip() (+3 more)

### Community 15 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 16 - "regrules.js"
Cohesion: 0.05
Nodes (37): approverRolesOf(), deliver(), DIGEST_HOUR, digestDue(), digestMsg(), endpointOk(), HOSTS, inboxRoles() (+29 more)

### Community 17 - "Inscripciones.jsx"
Cohesion: 0.10
Nodes (41): ACTIONS, Audit(), ENTITY_NAME, Users(), userState(), get(), Bandeja(), Detail() (+33 more)

### Community 21 - "panel/pwa.js"
Cohesion: 0.16
Nodes (22): nav(), Avisos(), detectEnv(), Instalar(), Mas(), activeTo(), mainNav(), moreNav() (+14 more)

### Community 22 - "errText"
Cohesion: 0.13
Nodes (22): InviteForm(), api(), del(), errText(), fieldErrors(), issueText(), MSG, patch() (+14 more)

### Community 23 - "schemas.js"
Cohesion: 0.07
Nodes (31): changePassword, date, decision, enText, forgot, glossaryTerm, invite, login (+23 more)

### Community 24 - "Plan técnico v3: backend, panel y gestión de contenido (MCJ)"
Cohesion: 0.10
Nodes (20): 0. Estado actual, 10. Retención de datos (aceptada), 11. Despliegue: Docker + Coolify, 12. Aviso de privacidad (LFPDPPP) y bloqueadores de lanzamiento, 13. `.env.example` (nombres; en producción van en la UI de Coolify), 14. Migración de datos (seed), 15. Fases y estimación (developer a medio tiempo), 16. Preguntas abiertas (+12 more)

### Community 25 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, create-admin, db:down, db:up, dev, dev:api, job:hourly (+7 more)

### Community 26 - "Translation.jsx"
Cohesion: 0.15
Nodes (20): put(), bodyErrors(), bodyToForm(), clean(), cleanList(), drop(), formToBody(), ICONS (+12 more)

### Community 27 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, argon2, fastify, @fastify/cookie, @fastify/helmet, @fastify/multipart, @fastify/rate-limit, @fastify/static (+8 more)

### Community 28 - "Content.jsx"
Cohesion: 0.14
Nodes (26): ctx, CONTENT, ContentForm(), Facts(), Final(), FormBody(), go(), next() (+18 more)

### Community 29 - "Review.jsx"
Cohesion: 0.19
Nodes (16): CardBody(), diffOf(), enInfo(), INTERNAL, norm(), said(), show(), fromLocalInput() (+8 more)

### Community 30 - "lib/translate.js"
Cohesion: 0.18
Nodes (15): batches(), buildSystemPrompt(), claudeBatch(), draftOnSubmit(), escapeRe(), hasTerm(), keepWarnings(), leaves() (+7 more)

### Community 31 - "Despliegue en Coolify (producción)"
Cohesion: 0.15
Nodes (12): 1. Preparación, 2. Base de datos MySQL (AWS RDS, externa), 3. Aplicación, 3b. Inscripciones, contacto y reCAPTCHA (F4), 3c. Panel como app y avisos (push), 4. Tarea programada (recordatorios, publicación programada, inscripciones, retención y limpieza), 5. Primer despliegue (checklist), 6. DNS (+4 more)

### Community 32 - "build.py"
Cohesion: 0.14
Nodes (27): A(), B(), C(), capy(), centerline(), D(), _font(), guias() (+19 more)

### Community 33 - "Proyectos.jsx"
Cohesion: 0.22
Nodes (11): Calendario, Proyectos, Calendario(), isPer(), CALENDARIO, ESTADO_LABEL, useApi(), CalendarioPage() (+3 more)

### Community 34 - "ref_node_test"
Cohesion: 0.15
Nodes (9): ref_node_module, ref_node_path, ref_node_test, zod, decideBootstrap(), email, ok, ENV (+1 more)

### Community 35 - "regsvc.js"
Cohesion: 0.20
Nodes (24): justFilled(), acceptOffer(), act(), availability(), bad(), cancel(), flush(), idOf() (+16 more)

### Community 36 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 37 - "pushsvc.js"
Cohesion: 0.19
Nodes (16): web-push, MAX_PER_USER, hashEndpoint(), idsOf(), pushDecision(), pushFull(), pushSubmitted(), pushToUsers() (+8 more)

### Community 38 - "app.js"
Cohesion: 0.12
Nodes (18): name, private, type, version, argon2, fastify, @fastify/cookie, @fastify/helmet (+10 more)

### Community 39 - "useData"
Cohesion: 0.19
Nodes (18): EMPTY, Field(), RegistrationForm(), submit(), Async(), cache, load(), useData() (+10 more)

### Community 40 - "admin.js"
Cohesion: 0.23
Nodes (23): tx(), audit(), bootstrapAdmin(), ENTITIES, snapshotOf(), toColumns(), srcHash(), autoTranslate() (+15 more)

### Community 41 - "001_init.sql"
Cohesion: 0.16
Nodes (15): audit_log, derej, pilgrimages, retreat_sessions, retreats, reviews, seasons, sessions (+7 more)

### Community 42 - "App.jsx"
Cohesion: 0.14
Nodes (13): App(), AvisoPrivacidad, Contacto, Home, Inscripcion, onPanelHost, PanelApp, PeregrinacionDetalle (+5 more)

### Community 43 - "Home.jsx"
Cohesion: 0.09
Nodes (24): Peregrinos, src_assets_fotos_web_hero_patio, src_assets_fotos_web_hero_velas, src_assets_fotos_web_tira_adoracion, src_assets_fotos_web_tira_cruz, src_assets_fotos_web_tira_mesa, src_assets_fotos_web_tira_predicador, src_assets_images_hero (+16 more)

### Community 44 - "useLang"
Cohesion: 0.16
Nodes (21): useLang(), useMeta(), pageTitle(), AvisoPrivacidad(), Detail(), Detalle(), Detail(), CardFoot() (+13 more)

### Community 45 - "routes/media.js"
Cohesion: 0.16
Nodes (15): IMAGE_FIELDS, MEDIA_REF, ALL, approverRoles, can(), PERMS, R, REVIEWER (+7 more)

### Community 46 - "Header.jsx"
Cohesion: 0.16
Nodes (13): src_assets_logos_isotipo_bn, Footer(), LINKS, Header(), LangSwitch(), NAME, OTROS_HINT, SubLink() (+5 more)

### Community 47 - "push.test.js"
Cohesion: 0.18
Nodes (7): ref_node_vm, injectPanel(), isPanelPath(), panelRedirect(), TAGS, ENV, root

### Community 48 - "q"
Cohesion: 0.18
Nodes (24): one(), q(), authenticate(), COOKIE, cookieOptions(), createSession(), csrf(), destroySession() (+16 more)

### Community 49 - "gen-panel-icons.js"
Cohesion: 0.18
Nodes (12): sharp, icon(), logoAt(), OUT, reach(), SVG, w, ImageError (+4 more)

### Community 50 - "regs.js"
Cohesion: 0.38
Nodes (8): Cupo(), Person(), capacity(), mailtoLink(), REG_STATUS, telLink(), waLink(), waNumber()

### Community 51 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 52 - "PanelApp.jsx"
Cohesion: 0.12
Nodes (27): react, src_assets_logos_logotipo, ApiError, post(), ChangePassword(), Forgot(), Invite(), Login() (+19 more)

### Community 53 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 54 - "config.js"
Cohesion: 0.21
Nodes (12): ref_node_fs, ref_node_util, { values }, bool, config, opt, parseConfig(), prodChecks() (+4 more)

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
Cohesion: 0.30
Nodes (9): react-router-dom, Layout(), PilgrimNext(), Failed(), Loading(), dateRange(), fmt(), Inscripcion() (+1 more)

### Community 72 - "resources.jsx"
Cohesion: 0.14
Nodes (11): BY_PATH, CORTE_CARD, D, DEREJ_ICON, MODE, MODE_CARD, PUBLISH, SEASON_ICON (+3 more)

### Community 73 - "routes/seo.js"
Cohesion: 0.33
Nodes (11): buildApp(), isPanelHost(), injectHead(), PANEL_ROBOTS, parsePath(), robotsTxt(), routeOf(), base() (+3 more)

### Community 76 - "gen-seed-sql.js"
Cohesion: 0.33
Nodes (11): mysql2, buildSql(), cols(), esc(), fixIds(), insertIfMissing(), OUT, PUB (+3 more)

### Community 77 - "calendar.js"
Cohesion: 0.39
Nodes (6): buildCalendar(), formatRange(), FREE, MES, parts(), TO

### Community 78 - "verifyCaptcha"
Cohesion: 0.43
Nodes (5): GOOGLE_VERIFY, verifyCaptcha(), checkCaptcha(), mock(), run()

## Knowledge Gaps
- **425 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+420 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 592 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router-dom` connect `react-router-dom` to `Proyectos.jsx`, `app.js`, `useData`, `ProyectoDetalle.jsx`, `App.jsx`, `Home.jsx`, `useLang`, `ui.jsx`, `Header.jsx`, `index.jsx`, `Inscripciones.jsx`, `PanelApp.jsx`, `Content.jsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `zod` connect `ref_node_test` to `pushsvc.js`, `app.js`, `admin.js`, `regpublic.js`, `regrules.js`, `config.js`, `schemas.js`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `react` connect `PanelApp.jsx` to `app.js`, `useData`, `react-router-dom`, `ProyectoDetalle.jsx`, `App.jsx`, `ui.jsx`, `Header.jsx`, `index.jsx`, `Inscripciones.jsx`, `panel/pwa.js`, `errText`, `Translation.jsx`, `Content.jsx`, `Review.jsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `adminRoutes()` (e.g. with `buildApp()` and `authenticate()`) actually correct?**
  _`adminRoutes()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _425 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `retreats.js` be split into smaller, more focused modules?**
  _Cohesion score 0.02702702702702703 - nodes in this community are weakly interconnected._
- **Should `build-equipo.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08199643493761141 - nodes in this community are weakly interconnected._