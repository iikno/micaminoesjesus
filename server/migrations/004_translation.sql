-- F3b translation: glossary (admin-managed) and a monthly usage counter for the Claude cap.
-- translations(entity, entity_id, lang, fields, source, src_hash) already exists from 001; source 'humano' = manual edit.
CREATE TABLE glossary (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  term VARCHAR(120) NOT NULL UNIQUE,
  mode ENUM('keep','map') NOT NULL DEFAULT 'keep',
  en VARCHAR(160) NULL,
  note VARCHAR(255) NULL
) CHARACTER SET utf8mb4;

CREATE TABLE translate_usage (
  ym CHAR(7) PRIMARY KEY,
  chars BIGINT UNSIGNED NOT NULL DEFAULT 0,
  input_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0,
  output_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0,
  calls INT UNSIGNED NOT NULL DEFAULT 0
) CHARACTER SET utf8mb4;

INSERT IGNORE INTO glossary (term, mode, en, note) VALUES
  ('Mi Camino es Jesús', 'keep', NULL, 'Nombre de la obra'),
  ('XP Lev', 'keep', NULL, 'Proyecto'),
  ('Peregrinos', 'keep', NULL, 'Proyecto'),
  ('Dérej', 'keep', NULL, 'Hebreo: camino'),
  ('Guibor', 'keep', NULL, 'Nombre de Dérej'),
  ('Kavod', 'keep', NULL, 'Nombre de Dérej'),
  ('Mesharét', 'keep', NULL, 'Nombre de Dérej'),
  ('Simjá', 'keep', NULL, 'Nombre de Dérej'),
  ('Oz', 'keep', NULL, 'Nombre de Dérej'),
  ('Jaím', 'keep', NULL, 'Nombre de Dérej'),
  ('Shemá', 'keep', NULL, 'Hebreo'),
  ('Betsalel', 'keep', NULL, 'Nombre hebreo'),
  ('Hora Santa', 'map', 'Holy Hour', NULL),
  ('Adoración Eucarística', 'map', 'Eucharistic Adoration', NULL),
  ('Nueva Evangelización', 'map', 'New Evangelization', NULL),
  ('Tiempo Ordinario', 'map', 'Ordinary Time', NULL),
  ('Adviento', 'map', 'Advent', NULL),
  ('Cuaresma', 'map', 'Lent', NULL),
  ('Pascua', 'map', 'Easter', NULL),
  ('Pentecostés', 'map', 'Pentecost', NULL);
