-- 003-roles.sql  |  Práctica 4, ejercicio 1.6: roles y usuarios (mínimo privilegio)
-- Las contraseñas NO van aquí: se pasan como variables de entorno con crear-usuarios.sh (usa envsubst).
-- Plantilla: ${APP_PASSWORD}, ${CONSULTA_PASSWORD}, ${ADMIN_PASSWORD}
USE `bureau-manager`;

CREATE ROLE IF NOT EXISTS 'rol_app', 'rol_consulta', 'rol_admin';

-- rol_app: lo que usa el backend (conexionDataBase.js) y el script de carga. Sin DELETE salvo en tokens, sin DDL.
GRANT SELECT, INSERT, UPDATE ON `bureau-manager`.`condominio`                    TO 'rol_app';
GRANT SELECT, INSERT, UPDATE ON `bureau-manager`.`edificio`                      TO 'rol_app';
GRANT SELECT, INSERT, UPDATE ON `bureau-manager`.`departamento`                  TO 'rol_app';
GRANT SELECT, INSERT, UPDATE ON `bureau-manager`.`inquilino`                     TO 'rol_app';
GRANT SELECT, INSERT, UPDATE ON `bureau-manager`.`recibo`                        TO 'rol_app';
GRANT SELECT, INSERT         ON `bureau-manager`.`concepto de pago`              TO 'rol_app';
GRANT SELECT, INSERT         ON `bureau-manager`.`cuota ordinaria`               TO 'rol_app';
GRANT SELECT, INSERT         ON `bureau-manager`.`cuota extraordinaria`          TO 'rol_app';
GRANT SELECT, INSERT         ON `bureau-manager`.`cuota de penalización`         TO 'rol_app';
GRANT SELECT, INSERT         ON `bureau-manager`.`cuota de fondo de reserva`     TO 'rol_app';
GRANT SELECT, INSERT         ON `bureau-manager`.`adeudos anteriores`            TO 'rol_app';
GRANT SELECT, INSERT         ON `bureau-manager`.`total pagado`                  TO 'rol_app';
GRANT SELECT, INSERT, UPDATE ON `bureau-manager`.`administrador`                 TO 'rol_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON `bureau-manager`.`password_reset_tokens` TO 'rol_app';

-- rol_consulta: solo lectura, y SIN acceso a credenciales (se excluye administrador y tokens).
GRANT SELECT ON `bureau-manager`.`condominio`                TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`edificio`                  TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`departamento`              TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`inquilino`                 TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`recibo`                    TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`concepto de pago`          TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`cuota ordinaria`           TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`cuota extraordinaria`      TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`cuota de penalización`     TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`cuota de fondo de reserva` TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`adeudos anteriores`        TO 'rol_consulta';
GRANT SELECT ON `bureau-manager`.`total pagado`              TO 'rol_consulta';

-- rol_admin: dueño de la base (DDL + DML), pero solo de ESTA base, no de todo el servidor.
GRANT ALL PRIVILEGES ON `bureau-manager`.* TO 'rol_admin';

CREATE USER IF NOT EXISTS 'usr_app'      IDENTIFIED BY '${APP_PASSWORD}';
CREATE USER IF NOT EXISTS 'usr_consulta' IDENTIFIED BY '${CONSULTA_PASSWORD}';
CREATE USER IF NOT EXISTS 'usr_admin'    IDENTIFIED BY '${ADMIN_PASSWORD}';
GRANT 'rol_app'      TO 'usr_app';
GRANT 'rol_consulta' TO 'usr_consulta';
GRANT 'rol_admin'    TO 'usr_admin';
SET DEFAULT ROLE ALL TO 'usr_app', 'usr_consulta', 'usr_admin';   -- sin esto el rol no se activa al conectarse
