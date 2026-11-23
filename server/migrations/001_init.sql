-- F2 foundation. Migrations are additive only (single production environment, no staging).
-- Later phases add: registrations (F4), contact_messages (F4), media (F3), glossary (F3), xplev_items (F3).

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  role ENUM('admin','asesor','pastoral','peregrinacion') NOT NULL,
  pass_hash VARCHAR(255) NULL,
  email_verified_at DATETIME NULL,
  status ENUM('invited','active','disabled') NOT NULL DEFAULT 'invited',
  failed_logins INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;

-- id = sha256 of the cookie value (a DB leak does not leak live sessions)
CREATE TABLE sessions (
  id CHAR(64) PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  ip VARCHAR(45) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id)
) CHARACTER SET utf8mb4;

CREATE TABLE tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('invite','verify','reset') NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

CREATE TABLE derej (
  slug VARCHAR(40) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  subtitle VARCHAR(120) NOT NULL,
  audience VARCHAR(120) NOT NULL,
  esquema ENUM('secuencial','catalogo','catalogo_sugerido','estaciones') NOT NULL,
  paso_total TINYINT NULL,
  color VARCHAR(9) NULL,
  foto VARCHAR(255) NULL,
  who VARCHAR(80) NULL,
  more VARCHAR(255) NULL,
  sort SMALLINT NOT NULL DEFAULT 0
) CHARACTER SET utf8mb4;

CREATE TABLE seasons (
  slug VARCHAR(40) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  sort SMALLINT NOT NULL DEFAULT 0
) CHARACTER SET utf8mb4;

-- Every reviewable content table repeats: status, publish_at, live_from, published_snapshot,
-- version, created_by, updated_by, timestamps. The site serves only published_snapshot once live_from <= now.
CREATE TABLE retreats (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  codigo VARCHAR(60) NULL,
  derej_slug VARCHAR(40) NOT NULL,
  tipo ENUM('taller','retiro','hora_santa','vivencial','experiencial','estaciones') NOT NULL,
  paso TINYINT NULL,
  tema_paso VARCHAR(160) NULL,
  title VARCHAR(160) NOT NULL,
  subtitle VARCHAR(255) NULL,
  summary TEXT NULL,
  season_slug VARCHAR(40) NULL,
  season_secondary JSON NULL,
  corte_simja ENUM('kinder','primaria','ambos') NULL,
  cover VARCHAR(255) NULL,
  estado_catalogo ENUM('publicado','proximamente') NOT NULL DEFAULT 'publicado',
  body JSON NULL,
  status ENUM('borrador','en_revision','programado','publicado','rechazado') NOT NULL DEFAULT 'borrador',
  publish_at DATETIME NULL,
  live_from DATETIME NULL,
  published_snapshot JSON NULL,
  version INT NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (derej_slug) REFERENCES derej(slug),
  FOREIGN KEY (season_slug) REFERENCES seasons(slug),
  INDEX (status)
) CHARACTER SET utf8mb4;

-- retreat_id NULL = free-form calendar entry (title/note) until an editor links it to a retreat.
CREATE TABLE retreat_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  retreat_id BIGINT UNSIGNED NULL,
  title VARCHAR(160) NULL,
  note VARCHAR(255) NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NULL,
  date_text VARCHAR(60) NULL,
  cal_state ENUM('lista','confirmada','por-confirmar') NOT NULL DEFAULT 'confirmada',
  highlight BOOLEAN NOT NULL DEFAULT FALSE,
  place VARCHAR(160) NULL,
  registration_mode ENUM('none','own') NOT NULL DEFAULT 'own',
  cupo INT NULL,
  cost_info TEXT NULL,
  notes TEXT NULL,
  status ENUM('borrador','en_revision','programado','publicado','rechazado') NOT NULL DEFAULT 'borrador',
  publish_at DATETIME NULL,
  live_from DATETIME NULL,
  published_snapshot JSON NULL,
  version INT NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (retreat_id) REFERENCES retreats(id),
  INDEX (status), INDEX (starts_on)
) CHARACTER SET utf8mb4;

CREATE TABLE pilgrimages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  summary TEXT NULL,
  itinerary JSON NULL,
  place VARCHAR(160) NULL,
  starts_on DATE NULL,
  ends_on DATE NULL,
  cupo INT NULL,
  cost_info TEXT NULL,
  registration_mode ENUM('none','own') NOT NULL DEFAULT 'own',
  state ENUM('abierta','llena','cerrada','cancelada') NOT NULL DEFAULT 'abierta',
  cover VARCHAR(255) NULL,
  status ENUM('borrador','en_revision','programado','publicado','rechazado') NOT NULL DEFAULT 'borrador',
  publish_at DATETIME NULL,
  live_from DATETIME NULL,
  published_snapshot JSON NULL,
  version INT NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status)
) CHARACTER SET utf8mb4;

CREATE TABLE team_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  role_title VARCHAR(160) NOT NULL,
  photo VARCHAR(255) NULL,
  sort SMALLINT NOT NULL DEFAULT 0,
  status ENUM('borrador','en_revision','programado','publicado','rechazado') NOT NULL DEFAULT 'borrador',
  publish_at DATETIME NULL,
  live_from DATETIME NULL,
  published_snapshot JSON NULL,
  version INT NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status)
) CHARACTER SET utf8mb4;

-- Scripture is never machine-translated: text_en is typed by hand from version_en.
CREATE TABLE verses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(80) NOT NULL UNIQUE,
  text_es TEXT NOT NULL,
  text_en TEXT NULL,
  version_en VARCHAR(20) NOT NULL DEFAULT 'RSV-2CE',
  source_note VARCHAR(255) NULL,
  status ENUM('borrador','en_revision','programado','publicado','rechazado') NOT NULL DEFAULT 'borrador',
  publish_at DATETIME NULL,
  live_from DATETIME NULL,
  published_snapshot JSON NULL,
  version INT NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status)
) CHARACTER SET utf8mb4;

-- Table only in F2; filled by the F3 translation module.
CREATE TABLE translations (
  entity VARCHAR(30) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  lang CHAR(2) NOT NULL,
  fields JSON NOT NULL,
  source ENUM('auto','humano') NOT NULL DEFAULT 'auto',
  src_hash CHAR(64) NULL,
  status ENUM('borrador','en_revision','programado','publicado','rechazado') NOT NULL DEFAULT 'borrador',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (entity, entity_id, lang)
) CHARACTER SET utf8mb4;

CREATE TABLE reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(30) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  version INT NOT NULL,
  submitted_by BIGINT UNSIGNED NOT NULL,
  reviewer_id BIGINT UNSIGNED NULL,
  decision ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  comment TEXT NULL,
  created_at DATETIME NOT NULL,
  decided_at DATETIME NULL,
  last_reminded_at DATETIME NULL,
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  INDEX (entity, entity_id), INDEX (decision)
) CHARACTER SET utf8mb4;

CREATE TABLE audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(40) NOT NULL,
  entity VARCHAR(40) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  diff JSON NULL,
  ip VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (entity, entity_id), INDEX (created_at)
) CHARACTER SET utf8mb4;
