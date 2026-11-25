-- permisos-pruebas.sql — cada bloque se ejecuta con el usuario indicado (mysql -u <usuario> -p bureau-manager)
-- ===== usr_app =====
SELECT COUNT(*) FROM recibo;                                           -- permitido
UPDATE recibo SET estado_pago='pagado', fecha_pago=NOW() WHERE id_recibo = 2 AND estado_pago='pendiente';  -- permitido
DELETE FROM recibo WHERE id_recibo = 1;                                -- NEGADO: ERROR 1142 DELETE command denied ... table 'recibo'
DROP TABLE inquilino;                                                  -- NEGADO: ERROR 1142 DROP command denied
-- ===== usr_consulta =====
SELECT COUNT(*) FROM inquilino;                                        -- permitido
INSERT INTO condominio (nombre_condominio, direccion_condominio) VALUES ('X','Y');   -- NEGADO: INSERT command denied
SELECT * FROM administrador;                                           -- NEGADO: SELECT command denied (credenciales protegidas)
-- ===== usr_admin =====
CREATE TABLE tmp_prueba (id INT);  DROP TABLE tmp_prueba;              -- permitido (DDL en la base)
CREATE DATABASE otra_base;                                             -- NEGADO: Access denied for user 'usr_admin' to database 'otra_base'
-- ===== REVOKE =====  (como root/usr_admin con GRANT OPTION)
REVOKE INSERT ON `bureau-manager`.`inquilino` FROM 'rol_app';
-- Reconectar usr_app (los privilegios de un rol se leen al activarlo en la sesión) y probar:
INSERT INTO inquilino (id_departamento, nombre_inquilino, apellino_paterno_inquilino, apellino_materno_inquilino, correo_inquilino)
VALUES (1,'Ana','Ruiz','Cruz','ana.ruiz@correo.example');              -- NEGADO tras el REVOKE
GRANT INSERT ON `bureau-manager`.`inquilino` TO 'rol_app';             -- restaurar
-- ===== Matriz efectiva =====
SHOW GRANTS FOR 'usr_app' USING 'rol_app';
SHOW GRANTS FOR 'usr_consulta' USING 'rol_consulta';
