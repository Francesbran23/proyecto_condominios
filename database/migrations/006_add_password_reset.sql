USE `bureau-manager`;

ALTER TABLE `administrador`
  MODIFY COLUMN `contraseña_administrador` varchar(255) NOT NULL;

CREATE TABLE `password_reset_tokens` (
  `id_administrador` int NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_administrador`),
  UNIQUE KEY `uq_password_reset_token_hash` (`token_hash`),
  CONSTRAINT `fk_password_reset_administrador`
    FOREIGN KEY (`id_administrador`) REFERENCES `administrador` (`id_administrador`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
