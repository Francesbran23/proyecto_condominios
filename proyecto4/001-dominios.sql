-- 001-dominios.sql  |  Práctica 4: tipos, DEFAULT, NOT NULL, UNIQUE y CHECK
-- Se aplica sobre database/bureau-manager.sql (esquema consolidado que ya incluye database/migrations/001..006).
-- Requiere MySQL >= 8.0.16 (los CHECK se aplican de verdad desde esa versión).
-- Nota MySQL: una columna usada en una FK con ON UPDATE CASCADE no puede llevar CHECK (error 3823),
-- por eso ningún CHECK recae sobre columnas id_* que sean claves foráneas.
USE `bureau-manager`;

-- ---------- Montos: de DOUBLE (binario, impreciso) a DECIMAL(10,2) ----------
ALTER TABLE `cuota ordinaria`
  MODIFY `monto_ordinaria` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD CONSTRAINT `ck_ordinaria_monto` CHECK (`monto_ordinaria` >= 0);        -- R1: no hay cuotas negativas

ALTER TABLE `cuota extraordinaria`
  MODIFY `monto_extraordinaria` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD CONSTRAINT `ck_extraordinaria_monto` CHECK (`monto_extraordinaria` >= 0);

ALTER TABLE `cuota de penalización`
  MODIFY `monto_penalizacion` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD CONSTRAINT `ck_penalizacion_monto` CHECK (`monto_penalizacion` >= 0);

ALTER TABLE `cuota de fondo de reserva`
  MODIFY `monto_reserva` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD CONSTRAINT `ck_reserva_monto` CHECK (`monto_reserva` >= 0);

ALTER TABLE `adeudos anteriores`
  MODIFY `monto_adeudos` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD CONSTRAINT `ck_adeudos_monto` CHECK (`monto_adeudos` >= 0);

ALTER TABLE `total pagado`
  MODIFY `monto_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD CONSTRAINT `ck_total_monto` CHECK (`monto_total` >= 0);                 -- R2: el total nunca es negativo

-- ---------- administrador ----------
ALTER TABLE `administrador`
  ADD CONSTRAINT `uq_administrador_correo` UNIQUE (`correo_administrador`),   -- R3: un correo = una cuenta (login y recuperación)
  ADD CONSTRAINT `ck_administrador_correo`
      CHECK (`correo_administrador` REGEXP '^[^ @]+@[^ @]+[.][^ @]+$'),       -- R4: formato de correo (igual que la API)
  ADD CONSTRAINT `ck_administrador_password`
      CHECK (CHAR_LENGTH(`contraseña_administrador`) >= 8),                    -- R5: mínimo 8 (el hash scrypt mide 168)
  ADD CONSTRAINT `ck_administrador_nombre`
      CHECK (CHAR_LENGTH(TRIM(`nombre_administrador`)) > 0);                   -- R6: nombre no vacío

-- ---------- inquilino ----------
ALTER TABLE `inquilino`
  ADD CONSTRAINT `ck_inquilino_correo`
      CHECK (`correo_inquilino` REGEXP '^[^ @]+@[^ @]+[.][^ @]+$'),            -- R7: el recibo se envía por correo
  ADD CONSTRAINT `ck_inquilino_nombre`
      CHECK (CHAR_LENGTH(TRIM(`nombre_inquilino`)) > 0);

-- ---------- jerarquía condominio > edificio > departamento ----------
ALTER TABLE `condominio`
  ADD CONSTRAINT `uq_condominio_nombre` UNIQUE (`nombre_condominio`),          -- R8: no dos condominios con el mismo nombre
  ADD CONSTRAINT `ck_condominio_nombre` CHECK (CHAR_LENGTH(TRIM(`nombre_condominio`)) > 0);

ALTER TABLE `edificio`
  ADD CONSTRAINT `uq_edificio_nombre_condominio` UNIQUE (`id_condominio`, `nombre_edificio`);  -- R9: nombre único dentro del condominio

ALTER TABLE `departamento`
  ADD CONSTRAINT `uq_departamento_numero_edificio` UNIQUE (`id_edificio`, `numero_departamento`); -- R10: un número por edificio

-- ---------- recibo ----------
ALTER TABLE `recibo`
  MODIFY `fecha` DATE NOT NULL DEFAULT (CURRENT_DATE),                         -- DEFAULT: fecha de emisión = hoy
  ADD CONSTRAINT `uq_recibo_condominio_no` UNIQUE (`id_condominio`, `no_recibo`),  -- R11: folio no repetido por condominio
  ADD CONSTRAINT `uq_recibo_total`          UNIQUE (`id_total`),          -- R16: cada recibo tiene SU PROPIO total y SUS PROPIAS cuotas (1:1);
  ADD CONSTRAINT `uq_recibo_ordinaria`      UNIQUE (`id_ordinaria`),      --      evita que dos recibos compartan una fila de cuota y que un
  ADD CONSTRAINT `uq_recibo_extraordinaria` UNIQUE (`id_extraordinaria`), --      UPDATE de penalización altere recibos ajenos
  ADD CONSTRAINT `uq_recibo_penalizacion`   UNIQUE (`id_penalizacion`),
  ADD CONSTRAINT `uq_recibo_reserva`        UNIQUE (`id_reserva`),
  ADD CONSTRAINT `uq_recibo_adeudos`        UNIQUE (`id_adeudos`),
  ADD CONSTRAINT `uq_recibo_concepto`       UNIQUE (`id_concepto`),
  ADD CONSTRAINT `ck_recibo_no_recibo` CHECK (CHAR_LENGTH(TRIM(`no_recibo`)) > 0),  -- R12: folio no vacío
  ADD CONSTRAINT `ck_recibo_pago_coherente` CHECK (
        (`estado_pago` = 'pendiente' AND `fecha_pago` IS NULL) OR
        (`estado_pago` = 'pagado'    AND `fecha_pago` IS NOT NULL)),            -- R13: pagado <=> tiene fecha de pago
  ADD CONSTRAINT `ck_recibo_pago_posterior` CHECK (
        `fecha_pago` IS NULL OR DATE(`fecha_pago`) >= `fecha`);                 -- R14: no se paga antes de emitir (entre columnas)

-- ---------- token de recuperación ----------
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `ck_token_sha256` CHECK (`token_hash` REGEXP '^[0-9a-f]{64}$');  -- R15: SHA-256 hexadecimal
