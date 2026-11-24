-- English draft prepared automatically when an item is sent to review. 'pendiente' while the provider answers,
-- 'fallo' (with a short code) if it did not; NULL once a draft exists or when nothing was attempted.
ALTER TABLE translations
  ADD COLUMN auto_state ENUM('pendiente','fallo') NULL,
  ADD COLUMN auto_error VARCHAR(60) NULL;
