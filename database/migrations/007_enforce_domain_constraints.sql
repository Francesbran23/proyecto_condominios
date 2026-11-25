USE `bureau-manager`;

UPDATE recibo r
JOIN (
  SELECT id_recibo,
         ROW_NUMBER() OVER (PARTITION BY id_condominio, no_recibo ORDER BY id_recibo) AS duplicado
  FROM recibo
) duplicados ON duplicados.id_recibo = r.id_recibo
SET r.no_recibo = CONCAT('AUTO-', r.id_recibo)
WHERE r.id_recibo > 0 AND duplicados.duplicado > 1;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'cuota ordinaria'
     AND constraint_type = 'CHECK'
     AND constraint_name IN ('chk_ordinaria_monto_no_negativo', 'ck_ordinaria_monto')) > 0,
  'SELECT 1',
  'ALTER TABLE `cuota ordinaria` ADD CONSTRAINT `chk_ordinaria_monto_no_negativo` CHECK (`monto_ordinaria` >= 0)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'cuota extraordinaria'
     AND constraint_type = 'CHECK'
     AND constraint_name IN ('chk_extraordinaria_monto_no_negativo', 'ck_extraordinaria_monto')) > 0,
  'SELECT 1',
  'ALTER TABLE `cuota extraordinaria` ADD CONSTRAINT `chk_extraordinaria_monto_no_negativo` CHECK (`monto_extraordinaria` >= 0)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'cuota de penalización'
     AND constraint_type = 'CHECK'
     AND constraint_name IN ('chk_penalizacion_monto_no_negativo', 'ck_penalizacion_monto')) > 0,
  'SELECT 1',
  'ALTER TABLE `cuota de penalización` ADD CONSTRAINT `chk_penalizacion_monto_no_negativo` CHECK (`monto_penalizacion` >= 0)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'cuota de fondo de reserva'
     AND constraint_type = 'CHECK'
     AND constraint_name IN ('chk_reserva_monto_no_negativo', 'ck_reserva_monto')) > 0,
  'SELECT 1',
  'ALTER TABLE `cuota de fondo de reserva` ADD CONSTRAINT `chk_reserva_monto_no_negativo` CHECK (`monto_reserva` >= 0)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'adeudos anteriores'
     AND constraint_type = 'CHECK'
     AND constraint_name IN ('chk_adeudos_monto_no_negativo', 'ck_adeudos_monto')) > 0,
  'SELECT 1',
  'ALTER TABLE `adeudos anteriores` ADD CONSTRAINT `chk_adeudos_monto_no_negativo` CHECK (`monto_adeudos` >= 0)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'total pagado'
     AND constraint_type = 'CHECK'
     AND constraint_name IN ('chk_total_monto_no_negativo', 'ck_total_monto')) > 0,
  'SELECT 1',
  'ALTER TABLE `total pagado` ADD CONSTRAINT `chk_total_monto_no_negativo` CHECK (`monto_total` >= 0)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'administrador'
     AND index_name = 'uq_administrador_correo' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `administrador` ADD CONSTRAINT `uq_administrador_correo` UNIQUE (`correo_administrador`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'administrador'
     AND constraint_type = 'CHECK'
     AND constraint_name = 'chk_administrador_correo') > 0,
  'SELECT 1',
  'ALTER TABLE `administrador` ADD CONSTRAINT `chk_administrador_correo` CHECK (`correo_administrador` = TRIM(`correo_administrador`) AND `correo_administrador` REGEXP ''^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'')'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'administrador'
     AND constraint_type = 'CHECK'
     AND constraint_name IN ('chk_administrador_contrasena_longitud', 'ck_administrador_password')) > 0,
  'SELECT 1',
  'ALTER TABLE `administrador` ADD CONSTRAINT `chk_administrador_contrasena_longitud` CHECK (CHAR_LENGTH(`contraseña_administrador`) >= 8)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'administrador'
     AND constraint_type = 'CHECK'
     AND constraint_name IN ('chk_administrador_nombre', 'ck_administrador_nombre')) > 0,
  'SELECT 1',
  'ALTER TABLE `administrador` ADD CONSTRAINT `chk_administrador_nombre` CHECK (CHAR_LENGTH(TRIM(`nombre_administrador`)) > 0)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'inquilino'
     AND constraint_type = 'CHECK'
     AND constraint_name = 'chk_inquilino_correo') > 0,
  'SELECT 1',
  'ALTER TABLE `inquilino` ADD CONSTRAINT `chk_inquilino_correo` CHECK (`correo_inquilino` = TRIM(`correo_inquilino`) AND `correo_inquilino` REGEXP ''^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'')'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'condominio'
     AND index_name = 'uq_condominio_nombre' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `condominio` ADD CONSTRAINT `uq_condominio_nombre` UNIQUE (`nombre_condominio`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'edificio'
     AND index_name IN ('uq_edificio_condominio_nombre', 'uq_edificio_nombre_condominio')
     AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `edificio` ADD CONSTRAINT `uq_edificio_condominio_nombre` UNIQUE (`id_condominio`, `nombre_edificio`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'departamento'
     AND index_name IN ('uq_departamento_edificio_numero', 'uq_departamento_numero_edificio')
     AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `departamento` ADD CONSTRAINT `uq_departamento_edificio_numero` UNIQUE (`id_edificio`, `numero_departamento`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'recibo'
     AND index_name = 'uq_recibo_condominio_numero' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `uq_recibo_condominio_numero` UNIQUE (`id_condominio`, `no_recibo`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'recibo'
     AND constraint_type = 'CHECK' AND constraint_name = 'chk_recibo_numero_no_vacio'),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `chk_recibo_numero_no_vacio` CHECK (CHAR_LENGTH(TRIM(`no_recibo`)) > 0)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'recibo'
     AND constraint_type = 'CHECK' AND constraint_name = 'chk_recibo_pago_fecha_estado'),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `chk_recibo_pago_fecha_estado` CHECK ((`estado_pago` = ''pagado'' AND `fecha_pago` IS NOT NULL) OR (`estado_pago` = ''pendiente'' AND `fecha_pago` IS NULL))'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'recibo'
     AND constraint_type = 'CHECK' AND constraint_name = 'chk_recibo_fecha_pago_no_anticipada'),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `chk_recibo_fecha_pago_no_anticipada` CHECK (`fecha_pago` IS NULL OR `fecha_pago` >= CAST(`fecha` AS DATETIME))'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'recibo'
     AND index_name = 'uq_recibo_total' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `uq_recibo_total` UNIQUE (`id_total`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'recibo'
     AND index_name = 'uq_recibo_ordinaria' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `uq_recibo_ordinaria` UNIQUE (`id_ordinaria`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'recibo'
     AND index_name = 'uq_recibo_extraordinaria' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `uq_recibo_extraordinaria` UNIQUE (`id_extraordinaria`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'recibo'
     AND index_name = 'uq_recibo_penalizacion' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `uq_recibo_penalizacion` UNIQUE (`id_penalizacion`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'recibo'
     AND index_name = 'uq_recibo_reserva' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `uq_recibo_reserva` UNIQUE (`id_reserva`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'recibo'
     AND index_name = 'uq_recibo_adeudos' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `uq_recibo_adeudos` UNIQUE (`id_adeudos`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'recibo'
     AND index_name = 'uq_recibo_concepto' AND non_unique = 0),
  'SELECT 1',
  'ALTER TABLE `recibo` ADD CONSTRAINT `uq_recibo_concepto` UNIQUE (`id_concepto`)'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;

SET @domain_ddl = IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_schema = DATABASE() AND table_name = 'password_reset_tokens'
     AND constraint_type = 'CHECK' AND constraint_name = 'chk_password_reset_token_hash'),
  'SELECT 1',
  'ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `chk_password_reset_token_hash` CHECK (REGEXP_LIKE(`token_hash`, ''^[0-9a-f]{64}$'', ''c''))'
);
PREPARE domain_stmt FROM @domain_ddl;
EXECUTE domain_stmt;
DEALLOCATE PREPARE domain_stmt;
