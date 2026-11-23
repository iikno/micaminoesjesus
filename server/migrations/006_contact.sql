-- F4 contact form inbox. Additive only. ARCO messages carry due_on = received + 20 business days.
CREATE TABLE contact_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NULL,
  subject ENUM('informacion','retiros','peregrinaciones','voluntariado','arco','otro') NOT NULL,
  message TEXT NOT NULL,
  lang CHAR(2) NOT NULL DEFAULT 'es',
  status ENUM('nuevo','leido','respondido','spam') NOT NULL DEFAULT 'nuevo',
  is_arco BOOLEAN NOT NULL DEFAULT FALSE,
  due_on DATE NULL,
  score DECIMAL(3,2) NULL,
  consent_at DATETIME NOT NULL,
  ip VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status, created_at),
  INDEX (is_arco, status)
) CHARACTER SET utf8mb4;
