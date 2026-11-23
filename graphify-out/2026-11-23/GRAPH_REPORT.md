# Graph Report - micaminoesjesus  (2026-11-23)

## Corpus Check
- 136 files · ~778,294 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 4, .example 1)

## Summary
- 887 nodes · 2180 edges · 57 communities (47 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `350ac062`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- retreats.js
- admin.js
- package.json
- build-equipo.mjs
- CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)
- What You Must Do When Invoked
- useMeta
- build-pptx.cjs
- app.js
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- .oxlintrc.json
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- React + Vite
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- CLAUDE.md
- .claude/CLAUDE.md
- extraction-spec.md
- translations.js
- Content.jsx
- schemas.js
- Plan técnico v3: backend, panel y gestión de contenido (MCJ)
- scripts
- 001_init.sql
- dependencies
- ui.jsx
- images.js
- Despliegue en Coolify (producción)
- regsvc.js
- devDependencies
- regpublic.js
- regrules.js
- 004_translation.sql
- 003_media.sql
- Media.jsx
- RegistrationForm.jsx
- PanelApp.jsx
- get
- App.jsx
- Home.jsx
- useLang
- Admin.jsx
- react-router-dom
- useData
- routes/auth.js
- q
- react
- 005_registrations.sql
- 006_contact.sql
- hourly.js
- config.js
- index.jsx
- verifyCaptcha

## God Nodes (most connected - your core abstractions)
1. `useLang()` - 60 edges
2. `q()` - 38 edges
3. `adminRoutes()` - 33 edges
4. `get()` - 33 edges
5. `errText()` - 30 edges
6. `react-router-dom` - 28 edges
7. `useMeta()` - 27 edges
8. `useLoad()` - 27 edges
9. `post()` - 26 edges
10. `react` - 24 edges

## Surprising Connections (you probably didn't know these)
- `headTags()` --calls--> `pageTitle()`  [EXTRACTED]
  server/lib/seo.js → src/i18n/meta.js
- `buildApp()` --indirect_call--> `adminRoutes()`  [INFERRED]
  server/app.js → server/routes/admin.js
- `buildApp()` --indirect_call--> `authRoutes()`  [INFERRED]
  server/app.js → server/routes/auth.js
- `buildApp()` --indirect_call--> `regPublicRoutes()`  [INFERRED]
  server/app.js → server/routes/regpublic.js
- `availability()` --calls--> `q()`  [EXTRACTED]
  server/lib/regsvc.js → server/db.js

## Import Cycles
- None detected.

## Communities (57 total, 9 thin omitted)

### Community 0 - "retreats.js"
Cohesion: 0.06
Nodes (30): CAL_DATES, insertPublished(), EQUIPO, adoraciones, buildFichaTecnica(), CORTES_SIMJA, DEEP_CONTENT_DEFAULTS, DEREJ (+22 more)

### Community 1 - "admin.js"
Cohesion: 0.14
Nodes (24): ENTITIES, snapshotOf(), toColumns(), ALL, approverRoles, can(), PERMS, R (+16 more)

### Community 2 - "package.json"
Cohesion: 0.13
Nodes (14): name, private, type, version, argon2, @fastify/multipart, mysql2, nodemailer (+6 more)

### Community 3 - "build-equipo.mjs"
Cohesion: 0.13
Nodes (22): byDerej, calRows, css, derejSlide(), DJ, esc(), foot(), here (+14 more)

### Community 4 - "CONSTITUCIÓN DE ARQUITECTURA — MI CAMINO ES JESÚS (MCJ)"
Cohesion: 0.11
Nodes (18): 0. PROPÓSITO DE ESTE DOCUMENTO, 10. RESUMEN DE PENDIENTES (BACKLOG GENERAL), 1.1 Naturaleza de cada Dérej, 1.2 Sistema de códigos internos, 1.3 Categorías de formato (tipo de contenido), 1.4 Etiquetas de Tiempo Litúrgico, 1.5 Presencia sacerdotal obligatoria, 1. LA ARQUITECTURA GENERAL: LOS SEIS DÉREJ (דֶּרֶךְ - "CAMINOS") (+10 more)

### Community 5 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 6 - "useMeta"
Cohesion: 0.22
Nodes (15): Inscripcion, Peregrinos, Polaroid(), Async(), Failed(), Loading(), useMeta(), pageTitle() (+7 more)

### Community 7 - "build-pptx.cjs"
Cohesion: 0.15
Nodes (9): ASSETS, fs, HEX, JSZip, OUT, path, PLAN, PptxGenJS (+1 more)

### Community 8 - "app.js"
Cohesion: 0.10
Nodes (36): fastify, @fastify/cookie, @fastify/helmet, @fastify/rate-limit, @fastify/static, buildApp(), buildCalendar(), formatRange() (+28 more)

### Community 9 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 10 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 13 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 14 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 15 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 21 - "translations.js"
Cohesion: 0.18
Nodes (21): batches(), buildSystemPrompt(), claudeBatch(), escapeRe(), hasTerm(), keepWarnings(), leaves(), PROVIDERS (+13 more)

### Community 22 - "Content.jsx"
Cohesion: 0.11
Nodes (32): put(), bodyErrors(), bodyToForm(), clean(), cleanList(), drop(), formToBody(), ICONS (+24 more)

### Community 23 - "schemas.js"
Cohesion: 0.07
Nodes (30): date, decision, enText, forgot, glossaryTerm, invite, login, mediaPatch (+22 more)

### Community 24 - "Plan técnico v3: backend, panel y gestión de contenido (MCJ)"
Cohesion: 0.10
Nodes (20): 0. Estado actual, 10. Retención de datos (aceptada), 11. Despliegue: Docker + Coolify, 12. Aviso de privacidad (LFPDPPP) y bloqueadores de lanzamiento, 13. `.env.example` (nombres; en producción van en la UI de Coolify), 14. Migración de datos (seed), 15. Fases y estimación (developer a medio tiempo), 16. Preguntas abiertas (+12 more)

### Community 25 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, create-admin, db:down, db:up, dev, dev:api, job:hourly (+6 more)

### Community 26 - "001_init.sql"
Cohesion: 0.21
Nodes (13): audit_log, derej, pilgrimages, retreat_sessions, retreats, reviews, seasons, sessions (+5 more)

### Community 27 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, argon2, fastify, @fastify/cookie, @fastify/helmet, @fastify/multipart, @fastify/rate-limit, @fastify/static (+7 more)

### Community 28 - "ui.jsx"
Cohesion: 0.13
Nodes (25): ORDER, BY_PATH, MODE, PUBLISH, RESOURCES, TIPOS, Card(), Detail() (+17 more)

### Community 30 - "images.js"
Cohesion: 0.33
Nodes (6): sharp, ImageError, MAX_SIDE, processImage(), sniff(), THUMB_SIDE

### Community 31 - "Despliegue en Coolify (producción)"
Cohesion: 0.17
Nodes (11): 1. Preparación, 2. Base de datos MySQL (AWS RDS, externa), 3. Aplicación, 3b. Inscripciones, contacto y reCAPTCHA (F4), 4. Tarea programada (recordatorios, publicación programada, inscripciones, retención y limpieza), 5. Primer despliegue (checklist), 6. DNS, 7. Rollback (+3 more)

### Community 32 - "regsvc.js"
Cohesion: 0.22
Nodes (22): acceptOffer(), act(), availability(), bad(), cancel(), flush(), idOf(), KEY (+14 more)

### Community 33 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, oxlint, @types/react, @types/react-dom, vite, @vitejs/plugin-react

### Community 34 - "regpublic.js"
Cohesion: 0.13
Nodes (21): zod, arcoDue(), contactSchema, SUBJECTS, decrypt(), encrypt(), parseKey(), cell() (+13 more)

### Community 35 - "regrules.js"
Cohesion: 0.08
Nodes (22): AUDIT_MONTHS, byQueue(), canManage(), canRead(), CONTACT_MONTHS, HOLDS, MAILS, nextInLine() (+14 more)

### Community 38 - "Media.jsx"
Cohesion: 0.17
Nodes (26): InviteForm(), api(), ApiError, del(), errText(), fieldErrors(), issueText(), MSG (+18 more)

### Community 39 - "RegistrationForm.jsx"
Cohesion: 0.38
Nodes (9): EMPTY, Field(), RegistrationForm(), submit(), captchaToken(), issueMap(), pubPost(), Contacto() (+1 more)

### Community 40 - "PanelApp.jsx"
Cohesion: 0.13
Nodes (15): Forgot(), Invite(), Login(), Reset(), SetPassword(), useSubmit(), ContentForm(), Guarded() (+7 more)

### Community 41 - "get"
Cohesion: 0.20
Nodes (21): Audit(), get(), Bandeja(), ContentList(), FormScreen(), useRetreats(), Dashboard(), ACTIONS (+13 more)

### Community 42 - "App.jsx"
Cohesion: 0.13
Nodes (14): App(), AvisoPrivacidad, Calendario, Home, Nosotros, PanelApp, PeregrinacionDetalle, Proyectos (+6 more)

### Community 43 - "Home.jsx"
Cohesion: 0.31
Nodes (8): Calendario(), Verso(), CALENDARIO, ESTADO_LABEL, VERSO, useApi(), CalendarioPage(), Tile()

### Community 44 - "useLang"
Cohesion: 0.19
Nodes (15): useLang(), CardFoot(), CARDS, Catalog(), ChipList(), DEREJ_ORDER, groupByCorte(), groupByTipo() (+7 more)

### Community 45 - "Admin.jsx"
Cohesion: 0.19
Nodes (13): ACTIONS, ENTITY_NAME, Users(), userState(), Facts(), History(), PendingChange(), same() (+5 more)

### Community 46 - "react-router-dom"
Cohesion: 0.19
Nodes (13): react-router-dom, Contacto, Footer(), DICT_NAME, Header(), Layout(), INSTAGRAM_URL, NAV (+5 more)

### Community 47 - "useData"
Cohesion: 0.17
Nodes (17): ProyectoDetalle, cache, load(), useData(), adaptRetreat(), TIPO_ABBR, useCatalog(), bundled (+9 more)

### Community 48 - "routes/auth.js"
Cohesion: 0.18
Nodes (22): authenticate(), COOKIE, cookieOptions(), createSession(), csrf(), destroySession(), hash(), hashPassword() (+14 more)

### Community 49 - "q"
Cohesion: 0.26
Nodes (13): { values }, one(), q(), tx(), audit(), IMAGE_FIELDS, MEDIA_REF, dirs() (+5 more)

### Community 50 - "react"
Cohesion: 0.33
Nodes (6): react, Due(), PILL, ST, SUBJECT, today()

### Community 53 - "hourly.js"
Cohesion: 0.33
Nodes (11): runHourly(), sendMail(), trySend(), approvers(), labelOf(), notifyDecision(), notifyReminders(), notifySubmitted() (+3 more)

### Community 54 - "config.js"
Cohesion: 0.22
Nodes (9): bool, config, opt, parseConfig(), prodChecks(), schema, pool, dir (+1 more)

### Community 55 - "index.jsx"
Cohesion: 0.31
Nodes (5): DICT, langOf(), strip(), PAGE_META, SITE_NAME

### Community 56 - "verifyCaptcha"
Cohesion: 0.43
Nodes (5): GOOGLE_VERIFY, verifyCaptcha(), checkCaptcha(), mock(), run()

## Knowledge Gaps
- **296 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 353 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `zod` connect `regpublic.js` to `admin.js`, `package.json`, `regrules.js`, `app.js`, `config.js`, `schemas.js`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `package.json`, `useMeta`, `RegistrationForm.jsx`, `PanelApp.jsx`, `Media.jsx`, `App.jsx`, `Home.jsx`, `get`, `Admin.jsx`, `react-router-dom`, `useData`, `Content.jsx`, `index.jsx`, `ui.jsx`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `react-router-dom` connect `react-router-dom` to `package.json`, `useMeta`, `RegistrationForm.jsx`, `PanelApp.jsx`, `get`, `App.jsx`, `Home.jsx`, `useLang`, `useData`, `Content.jsx`, `index.jsx`, `ui.jsx`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `adminRoutes()` (e.g. with `buildApp()` and `authenticate()`) actually correct?**
  _`adminRoutes()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `retreats.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06156156156156156 - nodes in this community are weakly interconnected._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13978494623655913 - nodes in this community are weakly interconnected._