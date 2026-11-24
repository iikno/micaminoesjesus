# Graph Report - micaminoesjesus  (2026-11-23)

## Corpus Check
- 150 files · ~136,593 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 4, .css 4, .example 1)

## Summary
- 1093 nodes · 2976 edges · 49 communities (43 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `46987ae6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- retreats.js
- translations.js
- package.json
- build-equipo.mjs
- CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)
- environment
- react-router-dom
- build-pptx.cjs
- q
- environment
- q
- .oxlintrc.json
- env
- regsvc.js
- Home
- React + Vite
- fastify
- ui.jsx
- CLAUDE.md
- .claude/CLAUDE.md
- withDerivedFields
- get
- Media.jsx
- schemas.js
- Plan técnico v3: backend, panel y gestión de contenido (MCJ)
- scripts
- Translation.jsx
- dependencies
- Content.jsx
- PanelApp.jsx
- lib/translate.js
- Despliegue en Coolify (producción)
- admin.js
- images.js
- regadmin.js
- regrules.js
- @fastify/rate-limit
- Review.jsx
- nodemailer
- RegistrationForm.jsx
- App.jsx
- Home.jsx
- useLang
- useLang
- Peregrinos.jsx
- routes/auth.js
- db.js
- index.jsx
- rows.js

## God Nodes (most connected - your core abstractions)
1. `useLang()` - 67 edges
2. `q()` - 39 edges
3. `FormBody()` - 37 edges
4. `get()` - 36 edges
5. `adminRoutes()` - 34 edges
6. `environment` - 33 edges
7. `errText()` - 31 edges
8. `react-router-dom` - 31 edges
9. `useLoad()` - 30 edges
10. `Async()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Estado de partida (antes de F2)` --references--> `withDerivedFields()`  [INFERRED]
  docs/plan-backend.md → src/data/retreats.js
- `headTags()` --calls--> `pageTitle()`  [EXTRACTED]
  server/lib/seo.js → src/i18n/meta.js
- `buildApp()` --indirect_call--> `adminRoutes()`  [INFERRED]
  server/app.js → server/routes/admin.js
- `adminRoutes()` --indirect_call--> `authenticate()`  [INFERRED]
  server/routes/admin.js → server/lib/auth.js
- `adminRoutes()` --indirect_call--> `csrf()`  [INFERRED]
  server/routes/admin.js → server/lib/auth.js

## Import Cycles
- None detected.

## Communities (49 total, 6 thin omitted)

### Community 0 - "retreats.js"
Cohesion: 0.03
Nodes (22): adoraciones, CORTES_SIMJA, DEEP_CONTENT_DEFAULTS, derejGuibor, derejJaim, derejKavod, derejMesharet, derejOz (+14 more)

### Community 1 - "translations.js"
Cohesion: 0.37
Nodes (12): tx(), audit(), bootstrapAdmin(), srcHash(), autoTranslate(), getTranslation(), month(), sourceFields() (+4 more)

### Community 2 - "package.json"
Cohesion: 0.16
Nodes (15): devDependencies, oxlint@^1.71.0, @types/react@^19.2.17, @types/react-dom@^19.2.3, vite@^8.1.1, @vitejs/plugin-react@^6.0.3, name, private (+7 more)

### Community 3 - "build-equipo.mjs"
Cohesion: 0.11
Nodes (23): byDerej, calRows, css, derejSlide(), DJ, esc(), foot(), here (+15 more)

### Community 4 - "CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)"
Cohesion: 0.11
Nodes (18): 0. PROPÓSITO DE ESTE DOCUMENTO, 10. RESUMEN DE PENDIENTES (BACKLOG GENERAL), 1.1 Naturaleza de cada Dérej, 1.2 Sistema de códigos internos, 1.3 Categorías de formato (tipo de contenido), 1.4 Etiquetas de Tiempo Litúrgico, 1.5 Presencia sacerdotal obligatoria, 1. LA ARQUITECTURA GENERAL: LOS SEIS DÉREJ (דֶּרֶךְ - "CAMINOS") (+10 more)

### Community 5 - "environment"
Cohesion: 0.05
Nodes (42): build, environment, expose, restart, volumes, ADMIN_NAME, ADMIN_PASS, ADMIN_USER (+34 more)

### Community 6 - "react-router-dom"
Cohesion: 0.18
Nodes (21): PeregrinacionDetalle, Async(), useMeta(), pageTitle(), cache, load(), useData(), adaptRetreat() (+13 more)

### Community 7 - "build-pptx.cjs"
Cohesion: 0.12
Nodes (9): ASSETS, fs, HEX, JSZip, OUT, path, PLAN, PptxGenJS (+1 more)

### Community 8 - "q"
Cohesion: 0.12
Nodes (30): buildCalendar(), formatRange(), FREE, MES, parts(), TO, published(), publishedBySlug() (+22 more)

### Community 9 - "environment"
Cohesion: 0.05
Nodes (37): build, depends_on, environment, ports, profiles, command, condition, environment (+29 more)

### Community 10 - "q"
Cohesion: 0.17
Nodes (13): IMAGE_FIELDS, MEDIA_REF, ALL, approverRoles, PERMS, R, REVIEWER, RW (+5 more)

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "env"
Cohesion: 0.09
Nodes (21): runs-on, steps, DB_HOST, DB_NAME, DB_PASS, DB_USER, MAIL_DISABLED, SESSION_SECRET (+13 more)

### Community 13 - "regsvc.js"
Cohesion: 0.15
Nodes (31): freeSpots(), transition(), acceptOffer(), act(), availability(), bad(), cancel(), checkCaptcha() (+23 more)

### Community 14 - "Home"
Cohesion: 0.41
Nodes (8): PilgrimNext(), Failed(), Loading(), dateRange(), fmt(), Home(), Photo(), Inscripcion()

### Community 15 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 17 - "ui.jsx"
Cohesion: 0.08
Nodes (41): Done(), ACTIONS, Dashboard(), day(), ORDER, photo(), Mas(), Shell() (+33 more)

### Community 21 - "get"
Cohesion: 0.18
Nodes (35): Audit(), Users(), get(), Bandeja(), Detail(), Due(), PILL, ST (+27 more)

### Community 22 - "Media.jsx"
Cohesion: 0.12
Nodes (30): react, ACTIONS, ENTITY_NAME, InviteForm(), userState(), api(), ApiError, del() (+22 more)

### Community 23 - "schemas.js"
Cohesion: 0.05
Nodes (39): buildSql(), cols(), esc(), fixIds(), insertIfMissing(), OUT, PUB, pubVals() (+31 more)

### Community 24 - "Plan técnico v3: backend, panel y gestión de contenido (MCJ)"
Cohesion: 0.10
Nodes (20): 0. Estado actual, 10. Retención de datos (aceptada), 11. Despliegue: Docker + Coolify, 12. Aviso de privacidad (LFPDPPP) y bloqueadores de lanzamiento, 13. `.env.example` (nombres; en producción van en la UI de Coolify), 14. Migración de datos (seed), 15. Fases y estimación (developer a medio tiempo), 16. Preguntas abiertas (+12 more)

### Community 25 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, create-admin, db:down, db:up, dev, dev:api, job:hourly (+7 more)

### Community 26 - "Translation.jsx"
Cohesion: 0.20
Nodes (19): errText(), put(), mark(), bodyErrors(), BodyEditor(), Fold(), Lines(), move() (+11 more)

### Community 27 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, argon2@^0.45.2, @fastify/cookie@^11.1.5, @fastify/helmet@^13.2.0, @fastify/multipart@^10.1.9, @fastify/static@^10.1.12, mysql2@^3.24.6, react@^19.2.7 (+10 more)

### Community 28 - "Content.jsx"
Cohesion: 0.11
Nodes (42): ctx, bodyToForm(), clean(), cleanList(), drop(), formToBody(), ICONS, list() (+34 more)

### Community 29 - "PanelApp.jsx"
Cohesion: 0.31
Nodes (14): post(), Card(), ChangePassword(), Err(), Forgot(), Invite(), Login(), Reset() (+6 more)

### Community 30 - "lib/translate.js"
Cohesion: 0.05
Nodes (37): decideBootstrap(), email, GOOGLE_VERIFY, verifyCaptcha(), arcoDue(), contactSchema, SUBJECTS, cell() (+29 more)

### Community 31 - "Despliegue en Coolify (producción)"
Cohesion: 0.17
Nodes (11): 1. Preparación, 2. Base de datos MySQL (AWS RDS, externa), 3. Aplicación, 3b. Inscripciones, contacto y reCAPTCHA (F4), 4. Tarea programada (recordatorios, publicación programada, inscripciones, retención y limpieza), 5. Primer despliegue (checklist), 6. DNS, 7. Rollback (+3 more)

### Community 32 - "admin.js"
Cohesion: 0.16
Nodes (25): runHourly(), snapshotOf(), approvers(), labelOf(), notifyDecision(), notifyReminders(), notifySubmitted(), can() (+17 more)

### Community 33 - "images.js"
Cohesion: 0.33
Nodes (6): sharp, ImageError, MAX_SIDE, processImage(), sniff(), THUMB_SIDE

### Community 34 - "regadmin.js"
Cohesion: 0.29
Nodes (7): decrypt(), encrypt(), parseKey(), forbidden(), kindOf, sensitive(), key

### Community 35 - "regrules.js"
Cohesion: 0.10
Nodes (29): AUDIT_MONTHS, byQueue(), canManage(), canRead(), CONTACT_MONTHS, decide(), HOLDS, MAILS (+21 more)

### Community 37 - "Review.jsx"
Cohesion: 0.38
Nodes (9): Card(), Detail(), diffOf(), English(), INTERNAL, norm(), show(), toLocalInput() (+1 more)

### Community 39 - "RegistrationForm.jsx"
Cohesion: 0.29
Nodes (13): Check(), EMPTY, Field(), RegistrationForm(), submit(), captchaToken(), issueMap(), pubPost() (+5 more)

### Community 42 - "App.jsx"
Cohesion: 0.14
Nodes (12): App(), AvisoPrivacidad, Calendario, Contacto, Home, Inscripcion, Nosotros, PanelApp (+4 more)

### Community 43 - "Home.jsx"
Cohesion: 0.10
Nodes (17): react-router-dom, Calendario(), isPer(), Marquee(), nextOf(), OWN, ProjectPanels(), Verso() (+9 more)

### Community 44 - "useLang"
Cohesion: 0.23
Nodes (18): XpLev, TIPO_ABBR, CardFoot(), CardHead(), CARDS, Catalog(), ChipList(), DEREJ_ORDER (+10 more)

### Community 46 - "useLang"
Cohesion: 0.24
Nodes (13): Footer(), LINKS, Chevron(), Header(), LangSwitch(), NAME, OTROS_HINT, SubLink() (+5 more)

### Community 47 - "Peregrinos.jsx"
Cohesion: 0.36
Nodes (5): Peregrinos, PerPillars(), Polaroid(), PER_PHOTOS, Peregrinos()

### Community 48 - "routes/auth.js"
Cohesion: 0.24
Nodes (21): one(), q(), authenticate(), COOKIE, cookieOptions(), createSession(), csrf(), destroySession() (+13 more)

### Community 54 - "db.js"
Cohesion: 0.19
Nodes (13): mysql2, zod, buildApp(), { values }, bool, config, opt, parseConfig() (+5 more)

### Community 55 - "index.jsx"
Cohesion: 0.31
Nodes (5): DICT, langOf(), strip(), PAGE_META, SITE_NAME

### Community 57 - "rows.js"
Cohesion: 0.15
Nodes (8): CAL_DATES, json(), seedRows(), EQUIPO, DEREJ, retreats, SEASONS, VERSO

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router-dom` connect `Home.jsx` to `package.json`, `react-router-dom`, `RegistrationForm.jsx`, `App.jsx`, `useLang`, `useLang`, `Home`, `ui.jsx`, `get`, `Media.jsx`, `index.jsx`, `dependencies`, `Content.jsx`, `PanelApp.jsx`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `adminRoutes()` (e.g. with `buildApp()` and `authenticate()`) actually correct?**
  _`adminRoutes()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `retreats.js` be split into smaller, more focused modules?**
  _Cohesion score 0.02702702702702703 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `db.js` to `admin.js`, `package.json`, `regrules.js`, `regadmin.js`, `regsvc.js`, `schemas.js`, `dependencies`, `lib/translate.js`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Should `build-equipo.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.10582010582010581 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Media.jsx` to `package.json`, `Review.jsx`, `react-router-dom`, `RegistrationForm.jsx`, `App.jsx`, `useLang`, `Home`, `ui.jsx`, `get`, `index.jsx`, `Translation.jsx`, `dependencies`, `Content.jsx`, `PanelApp.jsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._