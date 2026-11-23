-- F3b media library. Additive only. Files live under UPLOADS_DIR (pub/ is served at /uploads, private/ never is).
-- has_minors photos are kept in private/ and never served publicly until a parental-consent policy exists.
CREATE TABLE media (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file VARCHAR(80) NOT NULL UNIQUE,
  thumb VARCHAR(80) NOT NULL,
  mime VARCHAR(20) NOT NULL DEFAULT 'image/webp',
  width SMALLINT UNSIGNED NOT NULL,
  height SMALLINT UNSIGNED NOT NULL,
  bytes INT UNSIGNED NOT NULL,
  alt_es VARCHAR(255) NULL,
  alt_en VARCHAR(255) NULL,
  caption_retreat VARCHAR(160) NULL,
  caption_place VARCHAR(160) NULL,
  caption_date DATE NULL,
  has_minors BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (created_at)
) CHARACTER SET utf8mb4;
