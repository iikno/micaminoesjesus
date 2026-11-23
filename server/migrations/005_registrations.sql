-- F4 registrations. Additive only. kind/event_id point at retreat_sessions / pilgrimages (polymorphic, no FK).
-- contact_enc = AES-256-GCM JSON {emergency, guardian}; allergies_enc = AES-256-GCM JSON string. Both are
-- (the manage link token is derived from the id with HMAC, nothing secret is stored here)
-- wiped 30 days after the event ends, the whole row 90 days after (see server/jobs/hourly.js).
CREATE TABLE registrations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('session','pilgrimage') NOT NULL,
  event_id BIGINT UNSIGNED NOT NULL,
  lang CHAR(2) NOT NULL DEFAULT 'es',
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(190) NOT NULL,
  contact_enc TEXT NULL,
  allergies_enc TEXT NULL,
  under18 BOOLEAN NULL,
  minor_permission BOOLEAN NULL,
  consent_privacy_at DATETIME NOT NULL,
  consent_health_at DATETIME NULL,
  status ENUM('pendiente_verificacion','confirmado','lista_espera','oferta','cancelado','expirado') NOT NULL DEFAULT 'pendiente_verificacion',
  verified_at DATETIME NULL,
  queue_at DATETIME NULL,
  verify_reminded_at DATETIME NULL,
  offer_expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (kind, event_id, status),
  INDEX (status, created_at),
  INDEX (email)
) CHARACTER SET utf8mb4;
