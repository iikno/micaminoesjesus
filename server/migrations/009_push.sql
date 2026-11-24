-- Panel push notifications. Additive only.
-- One row per device. endpoint_hash (sha256 of the endpoint) is the unique key: if another user signs in on the
-- same device the row is reassigned to them. Rows go with the user (ON DELETE CASCADE) or when the push service answers 404/410.
CREATE TABLE push_subscriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  endpoint_hash CHAR(64) NOT NULL,
  endpoint VARCHAR(1000) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(100) NOT NULL,
  user_agent VARCHAR(160) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_push_endpoint (endpoint_hash),
  INDEX (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;

-- Daily registrations summary: the primary key makes "one per day" atomic across restarts and replicas
-- (INSERT IGNORE; whoever inserts the day sends). until_at is where the next summary starts counting.
CREATE TABLE push_digests (
  day DATE NOT NULL PRIMARY KEY,
  until_at DATETIME NOT NULL
) CHARACTER SET utf8mb4;
