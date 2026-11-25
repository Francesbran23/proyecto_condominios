-- pruebas-dominio.sql — 10 intentos de violar restricciones (cada uno DEBE fallar salvo el de DEFAULT).
-- Ejecutar con usr_admin:  mysql -u usr_admin -p bureau-manager < pruebas-dominio.sql --force
-- (--force sigue tras cada error para ver todos los mensajes; pegue la salida real en pruebas-dominio.md)
USE `bureau-manager`;
SET @ord_antes = (SELECT COUNT(*) FROM `cuota ordinaria`);

-- 1. NOT NULL
INSERT INTO condominio (nombre_condominio, direccion_condominio) VALUES (NULL, 'Av. Prueba 1, CDMX');
-- 2. NOT NULL (columna omitida y sin DEFAULT)
INSERT INTO edificio (id_condominio) VALUES (1);
-- 3. DEFAULT (este SÍ funciona): monto y fecha toman su valor inicial
INSERT INTO `cuota ordinaria` (descripcion_ordinaria) VALUES ('prueba default');
SELECT monto_ordinaria FROM `cuota ordinaria` WHERE descripcion_ordinaria = 'prueba default';   -- 0.00
DELETE FROM `cuota ordinaria` WHERE descripcion_ordinaria = 'prueba default';
-- 4. UNIQUE simple
INSERT INTO administrador (nombre_administrador, apellido_paterno_administrador, apellido_materno_administrador, correo_administrador, `contraseña_administrador`)
VALUES ('X','Y','Z','admin1@condominios.example','12345678');
-- 5. UNIQUE compuesta (mismo número de departamento en el mismo edificio)
INSERT INTO departamento (id_edificio, numero_departamento) SELECT id_edificio, numero_departamento FROM departamento WHERE id_departamento = 1;
-- 6. CHECK de rango (monto negativo)
INSERT INTO `cuota ordinaria` (monto_ordinaria, descripcion_ordinaria) VALUES (-50.00, 'negativa');
-- 7. CHECK de formato (correo sin arroba)
INSERT INTO inquilino (id_departamento, nombre_inquilino, apellino_paterno_inquilino, apellino_materno_inquilino, correo_inquilino)
VALUES (1, 'Ana', 'Ruiz', 'Cruz', 'correo-sin-arroba');
-- 8. CHECK entre columnas (pagado sin fecha de pago)
UPDATE recibo SET estado_pago = 'pagado', fecha_pago = NULL WHERE id_recibo = 1;
-- 9. CHECK entre columnas (pago anterior a la emisión)
UPDATE recibo SET estado_pago = 'pagado', fecha_pago = '2000-01-01 10:00:00' WHERE id_recibo = 1;
-- 10. Lista de valores permitidos (ENUM estado_pago)
UPDATE recibo SET estado_pago = 'cancelado' WHERE id_recibo = 1;
-- Comprobación final: nada de lo rechazado quedó guardado
SELECT COUNT(*) - @ord_antes AS cuotas_ordinarias_de_mas FROM `cuota ordinaria`;   -- 0
