# Graph Report - micaminoesjesus  (2026-11-24)

## Corpus Check
- 164 files · ~145,172 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 4, .css 4, .example 1)

## Summary
- 1201 nodes · 3353 edges · 62 communities (54 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `46987ae6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- retreats.js
- admin.js
- package.json
- build-equipo.mjs
- CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)
- environment
- react-router-dom
- build-pptx.cjs
- routes/seo.js
- environment
- ref_node_assert
- .oxlintrc.json
- env
- contact.js
- Home
- React + Vite
- push.test.js
- PanelApp.jsx
- CLAUDE.md
- .claude/CLAUDE.md
- withDerivedFields
- panel/pwa.js
- ui.jsx
- schemas.js
- Plan técnico v3: backend, panel y gestión de contenido (MCJ)
- scripts
- Translation.jsx
- dependencies
- Content.jsx
- PanelApp.jsx
- translations.js
- Despliegue en Coolify (producción)
- admin.js
- Inscripciones.jsx
- resources.jsx
- regrules.js
- gen-seed-sql.js
- regsvc.js
- package.json
- RegistrationForm.jsx
- audit
- regpublic.js
- App.jsx
- Home.jsx
- useLang
- content.js
- useLang
- Peregrinos.jsx
- routes/auth.js
- images.js
- body.test.js
- calendar.js
- lockout.js
- captcha.test.js
- db.js
- index.jsx
- entities.js
- rows.js
- argon2
- @fastify/cookie
- @fastify/rate-limit

## God Nodes (most connected - your core abstractions)
1. `useLang()` - 67 edges
2. `q()` - 45 edges
3. `get()` - 39 edges
4. `adminRoutes()` - 38 edges
5. `FormBody()` - 38 edges
6. `environment` - 36 edges
7. `errText()` - 34 edges
8. `react-router-dom` - 31 edges
9. `post()` - 31 edges
10. `react` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Estado de partida (antes de F2)` --references--> `withDerivedFields()`  [INFERRED]
  docs/plan-backend.md → src/data/retreats.js
- `headTags()` --calls--> `pageTitle()`  [EXTRACTED]
  server/lib/seo.js → src/i18n/meta.js
- `buildApp()` --indirect_call--> `adminRoutes()`  [INFERRED]
  server/app.js → server/routes/admin.js
- `buildApp()` --indirect_call--> `authRoutes()`  [INFERRED]
  server/app.js → server/routes/auth.js
- `buildApp()` --indirect_call--> `seoRoutes()`  [INFERRED]
  server/app.js → server/routes/seo.js

## Import Cycles
- None detected.

## Communities (62 total, 8 thin omitted)

### Community 0 - "retreats.js"
Cohesion: 0.03
Nodes (22): adoraciones, CORTES_SIMJA, DEEP_CONTENT_DEFAULTS, derejGuibor, derejJaim, derejKavod, derejMesharet, derejOz (+14 more)

### Community 1 - "admin.js"
Cohesion: 0.18
Nodes (29): one(), q(), authenticate(), can(), availability(), assertFresh(), canDecide(), FlowError (+21 more)

### Community 2 - "package.json"
Cohesion: 0.18
Nodes (11): devDependencies, oxlint@^1.71.0, @types/react@^19.2.17, @types/react-dom@^19.2.3, vite@^8.1.1, @vitejs/plugin-react@^6.0.3, oxlint, @types/react (+3 more)

### Community 3 - "build-equipo.mjs"
Cohesion: 0.13
Nodes (23): byDerej, calRows, css, derejSlide(), DJ, esc(), foot(), here (+15 more)

### Community 4 - "CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)"
Cohesion: 0.11
Nodes (18): 0. PROPÓSITO DE ESTE DOCUMENTO, 10. RESUMEN DE PENDIENTES (BACKLOG GENERAL), 1.1 Naturaleza de cada Dérej, 1.2 Sistema de códigos internos, 1.3 Categorías de formato (tipo de contenido), 1.4 Etiquetas de Tiempo Litúrgico, 1.5 Presencia sacerdotal obligatoria, 1. LA ARQUITECTURA GENERAL: LOS SEIS DÉREJ (דֶּרֶךְ - "CAMINOS") (+10 more)

### Community 5 - "environment"
Cohesion: 0.04
Nodes (45): build, environment, expose, restart, volumes, ADMIN_NAME, ADMIN_PASS, ADMIN_USER (+37 more)

### Community 6 - "react-router-dom"
Cohesion: 0.18
Nodes (21): PeregrinacionDetalle, Async(), useMeta(), pageTitle(), cache, load(), useData(), adaptRetreat() (+13 more)

### Community 7 - "build-pptx.cjs"
Cohesion: 0.12
Nodes (9): ASSETS, fs, HEX, JSZip, OUT, path, PLAN, PptxGenJS (+1 more)

### Community 8 - "routes/seo.js"
Cohesion: 0.25
Nodes (16): injectPanel(), isPanelPath(), TAGS, buildSitemap(), esc(), headTags(), injectHead(), parsePath() (+8 more)

### Community 9 - "environment"
Cohesion: 0.05
Nodes (37): build, depends_on, environment, ports, profiles, command, condition, environment (+29 more)

### Community 10 - "ref_node_assert"
Cohesion: 0.22
Nodes (4): decideBootstrap(), email, ok, root

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "env"
Cohesion: 0.09
Nodes (21): runs-on, steps, DB_HOST, DB_NAME, DB_PASS, DB_USER, MAIL_DISABLED, SESSION_SECRET (+13 more)

### Community 13 - "contact.js"
Cohesion: 0.33
Nodes (5): arcoDue(), contactSchema, SUBJECTS, cell(), toCsv()

### Community 14 - "Home"
Cohesion: 0.41
Nodes (8): PilgrimNext(), Failed(), Loading(), dateRange(), fmt(), Home(), Photo(), Inscripcion()

### Community 15 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 16 - "push.test.js"
Cohesion: 0.11
Nodes (31): approverRolesOf(), contactMsg(), decisionMsg(), deliver(), DIGEST_HOUR, digestDue(), digestMsg(), endpointOk() (+23 more)

### Community 17 - "PanelApp.jsx"
Cohesion: 0.15
Nodes (46): nav(), Audit(), Users(), get(), Bandeja(), ContentForm(), ContentList(), FormScreen() (+38 more)

### Community 21 - "panel/pwa.js"
Cohesion: 0.17
Nodes (23): Avisos(), Note(), detectEnv(), Instalar(), InstallCard(), IosGuide(), read(), Share() (+15 more)

### Community 22 - "ui.jsx"
Cohesion: 0.09
Nodes (51): react, ACTIONS, ENTITY_NAME, InviteForm(), userState(), api(), ApiError, del() (+43 more)

### Community 23 - "schemas.js"
Cohesion: 0.08
Nodes (23): changePassword, date, decision, enText, forgot, glossaryTerm, invite, login (+15 more)

### Community 24 - "Plan técnico v3: backend, panel y gestión de contenido (MCJ)"
Cohesion: 0.10
Nodes (20): 0. Estado actual, 10. Retención de datos (aceptada), 11. Despliegue: Docker + Coolify, 12. Aviso de privacidad (LFPDPPP) y bloqueadores de lanzamiento, 13. `.env.example` (nombres; en producción van en la UI de Coolify), 14. Migración de datos (seed), 15. Fases y estimación (developer a medio tiempo), 16. Preguntas abiertas (+12 more)

### Community 25 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, create-admin, db:down, db:up, dev, dev:api, job:hourly (+7 more)

### Community 26 - "Translation.jsx"
Cohesion: 0.17
Nodes (22): put(), bodyErrors(), bodyToForm(), clean(), cleanList(), drop(), formToBody(), ICONS (+14 more)

### Community 27 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, fastify@^5.12.8, @fastify/multipart@^10.1.9, @fastify/static@^10.1.12, mysql2@^3.24.6, react@^19.2.7, react-dom@^19.2.7, react-router-dom@^7.18.1 (+6 more)

### Community 28 - "Content.jsx"
Cohesion: 0.13
Nodes (33): ctx, CONTENT, Done(), Facts(), Final(), FormBody(), go(), next() (+25 more)

### Community 29 - "PanelApp.jsx"
Cohesion: 0.23
Nodes (17): post(), Card(), ChangePassword(), Err(), Forgot(), Invite(), Login(), Reset() (+9 more)

### Community 30 - "translations.js"
Cohesion: 0.17
Nodes (15): batches(), buildSystemPrompt(), claudeBatch(), draftOnSubmit(), escapeRe(), hasTerm(), keepWarnings(), leaves() (+7 more)

### Community 31 - "Despliegue en Coolify (producción)"
Cohesion: 0.15
Nodes (12): 1. Preparación, 2. Base de datos MySQL (AWS RDS, externa), 3. Aplicación, 3b. Inscripciones, contacto y reCAPTCHA (F4), 3c. Panel como app y avisos (push), 4. Tarea programada (recordatorios, publicación programada, inscripciones, retención y limpieza), 5. Primer despliegue (checklist), 6. DNS (+4 more)

### Community 32 - "admin.js"
Cohesion: 0.24
Nodes (14): runHourly(), sendMail(), trySend(), approvers(), labelOf(), notifyDecision(), notifyReminders(), notifySubmitted() (+6 more)

### Community 33 - "Inscripciones.jsx"
Cohesion: 0.15
Nodes (27): Detail(), Due(), PILL, ST, SUBJECT, today(), ACTIONS, Cupo() (+19 more)

### Community 34 - "resources.jsx"
Cohesion: 0.14
Nodes (11): BY_PATH, CORTE_CARD, D, DEREJ_ICON, MODE, MODE_CARD, PUBLISH, SEASON_ICON (+3 more)

### Community 35 - "regrules.js"
Cohesion: 0.12
Nodes (25): byQueue(), canManage(), canRead(), decide(), freeSpots(), HOLDS, MAILS, nextInLine() (+17 more)

### Community 36 - "gen-seed-sql.js"
Cohesion: 0.29
Nodes (13): buildSql(), cols(), esc(), fixIds(), insertIfMissing(), OUT, PUB, pubVals() (+5 more)

### Community 37 - "regsvc.js"
Cohesion: 0.21
Nodes (24): justFilled(), transition(), acceptOffer(), act(), bad(), cancel(), flush(), idOf() (+16 more)

### Community 38 - "package.json"
Cohesion: 0.18
Nodes (10): @fastify/helmet@^13.2.0, nodemailer@^10.6.1, web-push@^4.0.0, name, private, type, version, @fastify/helmet (+2 more)

### Community 39 - "RegistrationForm.jsx"
Cohesion: 0.29
Nodes (13): Check(), EMPTY, Field(), RegistrationForm(), submit(), captchaToken(), issueMap(), pubPost() (+5 more)

### Community 40 - "audit"
Cohesion: 0.24
Nodes (10): audit(), decrypt(), encrypt(), parseKey(), forbidden(), kindOf, plain(), regAdminRoutes() (+2 more)

### Community 41 - "regpublic.js"
Cohesion: 0.24
Nodes (11): buildApp(), csrf(), normLang(), checkCaptcha(), publicRoutes(), fail(), head, limit() (+3 more)

### Community 42 - "App.jsx"
Cohesion: 0.14
Nodes (12): App(), AvisoPrivacidad, Calendario, Contacto, Home, Inscripcion, Nosotros, PanelApp (+4 more)

### Community 43 - "Home.jsx"
Cohesion: 0.10
Nodes (17): react-router-dom, Calendario(), isPer(), Marquee(), nextOf(), OWN, ProjectPanels(), Verso() (+9 more)

### Community 44 - "useLang"
Cohesion: 0.23
Nodes (18): XpLev, TIPO_ABBR, CardFoot(), CardHead(), CARDS, Catalog(), ChipList(), DEREJ_ORDER (+10 more)

### Community 45 - "content.js"
Cohesion: 0.25
Nodes (11): published(), publishedBySlug(), snaps(), fallbackDeep(), LANGS, localize(), plain(), IMAGE_FIELDS (+3 more)

### Community 46 - "useLang"
Cohesion: 0.24
Nodes (13): Footer(), LINKS, Chevron(), Header(), LangSwitch(), NAME, OTROS_HINT, SubLink() (+5 more)

### Community 47 - "Peregrinos.jsx"
Cohesion: 0.36
Nodes (5): Peregrinos, PerPillars(), Polaroid(), PER_PHOTOS, Peregrinos()

### Community 48 - "routes/auth.js"
Cohesion: 0.18
Nodes (21): COOKIE, cookieOptions(), createSession(), destroySession(), hash(), hashPassword(), newToken(), verifyPassword() (+13 more)

### Community 49 - "images.js"
Cohesion: 0.21
Nodes (8): sharp, OUT, SVG, ImageError, MAX_SIDE, processImage(), sniff(), THUMB_SIDE

### Community 50 - "body.test.js"
Cohesion: 0.20
Nodes (4): retreat, retreatBody, translationFields, strip()

### Community 51 - "calendar.js"
Cohesion: 0.39
Nodes (6): buildCalendar(), formatRange(), FREE, MES, parts(), TO

### Community 52 - "lockout.js"
Cohesion: 0.38
Nodes (5): afterFailure(), isLocked(), LOCK_MINUTES, MAX_FAILS, now

### Community 53 - "captcha.test.js"
Cohesion: 0.53
Nodes (4): GOOGLE_VERIFY, verifyCaptcha(), mock(), run()

### Community 54 - "db.js"
Cohesion: 0.12
Nodes (25): mysql2, zod, { values }, bool, config, opt, parseConfig(), prodChecks() (+17 more)

### Community 55 - "index.jsx"
Cohesion: 0.31
Nodes (5): DICT, langOf(), strip(), PAGE_META, SITE_NAME

### Community 57 - "rows.js"
Cohesion: 0.17
Nodes (6): CAL_DATES, EQUIPO, DEREJ, retreats, SEASONS, VERSO

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router-dom` connect `Home.jsx` to `Inscripciones.jsx`, `package.json`, `RegistrationForm.jsx`, `react-router-dom`, `App.jsx`, `useLang`, `useLang`, `Home`, `PanelApp.jsx`, `ui.jsx`, `index.jsx`, `dependencies`, `Content.jsx`, `PanelApp.jsx`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `adminRoutes()` (e.g. with `buildApp()` and `authenticate()`) actually correct?**
  _`adminRoutes()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `retreats.js` be split into smaller, more focused modules?**
  _Cohesion score 0.02702702702702703 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `db.js` to `admin.js`, `regrules.js`, `package.json`, `audit`, `regpublic.js`, `ref_node_assert`, `contact.js`, `schemas.js`, `dependencies`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `build-equipo.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.jsx` to `Inscripciones.jsx`, `package.json`, `RegistrationForm.jsx`, `react-router-dom`, `App.jsx`, `useLang`, `Home`, `PanelApp.jsx`, `panel/pwa.js`, `index.jsx`, `Translation.jsx`, `dependencies`, `Content.jsx`, `PanelApp.jsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._