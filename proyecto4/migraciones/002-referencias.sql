-- 002-referencias.sql  |  Práctica 5: acciones referenciales explícitas
-- Hoy todas las FK de bureau-manager.sql tienen solo ON UPDATE CASCADE (el ON DELETE queda en el valor por omisión, NO ACTION ~ RESTRICT).
-- (DROP y ADD de una misma FK van en sentencias separadas: MySQL no permite reutilizar el nombre dentro de un solo ALTER.)
-- Aquí se declara de forma explícita y se justifica cada una (ver referencias.md).
-- MySQL/InnoDB NO admite SET DEFAULT (rechaza la definición), por eso no se usa.
USE `bureau-manager`;

-- ===== Jerarquía: RESTRICT (no se borra un padre con hijos) =====
ALTER TABLE `edificio` DROP FOREIGN KEY `id_condominio`;
ALTER TABLE `edificio`
  ADD CONSTRAINT `id_condominio` FOREIGN KEY (`id_condominio`) REFERENCES `condominio` (`id_condominio`)
      ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `departamento` DROP FOREIGN KEY `id_edificio`;
ALTER TABLE `departamento`
  ADD CONSTRAINT `id_edificio` FOREIGN KEY (`id_edificio`) REFERENCES `edificio` (`id_edificio`)
      ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== inquilino -> departamento: SET NULL (relación opcional; la app "libera" al inquilino, migración 004) =====
ALTER TABLE `inquilino` DROP FOREIGN KEY `id_departamento`;
ALTER TABLE `inquilino`
  ADD CONSTRAINT `id_departamento` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`)
      ON DELETE SET NULL ON UPDATE CASCADE;

-- ===== recibo y total pagado: RESTRICT (el historial contable no se pierde por borrar un catálogo) =====
ALTER TABLE `recibo`
  DROP FOREIGN KEY `adeudos`,      DROP FOREIGN KEY `administrador`, DROP FOREIGN KEY `concepto`,
  DROP FOREIGN KEY `condominio`,   DROP FOREIGN KEY `departamento`,  DROP FOREIGN KEY `extraordinaria`,
  DROP FOREIGN KEY `inquilino`,    DROP FOREIGN KEY `ordinaria`,     DROP FOREIGN KEY `penalizacion`,
  DROP FOREIGN KEY `reserva`,      DROP FOREIGN KEY `total`;

ALTER TABLE `recibo`
  ADD CONSTRAINT `fk_recibo_adeudos`        FOREIGN KEY (`id_adeudos`)        REFERENCES `adeudos anteriores` (`id_adeudos`)             ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_administrador`  FOREIGN KEY (`id_administrador`)  REFERENCES `administrador` (`id_administrador`)            ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_concepto`       FOREIGN KEY (`id_concepto`)       REFERENCES `concepto de pago` (`id_concepto`)              ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_condominio`     FOREIGN KEY (`id_condominio`)     REFERENCES `condominio` (`id_condominio`)                  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_departamento`   FOREIGN KEY (`id_departamento`)   REFERENCES `departamento` (`id_departamento`)              ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_extraordinaria` FOREIGN KEY (`id_extraordinaria`) REFERENCES `cuota extraordinaria` (`id_extraordinaria`)    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_inquilino`      FOREIGN KEY (`id_inquilino`)      REFERENCES `inquilino` (`id_inquilino`)                    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_ordinaria`      FOREIGN KEY (`id_ordinaria`)      REFERENCES `cuota ordinaria` (`id_ordinaria`)              ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_penalizacion`   FOREIGN KEY (`id_penalizacion`)   REFERENCES `cuota de penalización` (`id_penalizacion`)     ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_reserva`        FOREIGN KEY (`id_reserva`)        REFERENCES `cuota de fondo de reserva` (`id_reserva`)      ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recibo_total`          FOREIGN KEY (`id_total`)          REFERENCES `total pagado` (`id_total`)                     ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `total pagado`
  DROP FOREIGN KEY `id_adeudos`, DROP FOREIGN KEY `id_extraordinaria`, DROP FOREIGN KEY `id_ordinaria`,
  DROP FOREIGN KEY `id_penalizacion`, DROP FOREIGN KEY `id_reserva`;

ALTER TABLE `total pagado`
  ADD CONSTRAINT `fk_total_adeudos`        FOREIGN KEY (`id_adeudos`)        REFERENCES `adeudos anteriores` (`id_adeudos`)          ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_total_extraordinaria` FOREIGN KEY (`id_extraordinaria`) REFERENCES `cuota extraordinaria` (`id_extraordinaria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_total_ordinaria`      FOREIGN KEY (`id_ordinaria`)      REFERENCES `cuota ordinaria` (`id_ordinaria`)           ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_total_penalizacion`   FOREIGN KEY (`id_penalizacion`)   REFERENCES `cuota de penalización` (`id_penalizacion`)  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_total_reserva`        FOREIGN KEY (`id_reserva`)        REFERENCES `cuota de fondo de reserva` (`id_reserva`)   ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== password_reset_tokens -> administrador: CASCADE (entidad débil; ya existía, se agrega ON UPDATE) =====
ALTER TABLE `password_reset_tokens` DROP FOREIGN KEY `fk_password_reset_administrador`;
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_password_reset_administrador` FOREIGN KEY (`id_administrador`) REFERENCES `administrador` (`id_administrador`)
      ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== Borrado lógico en recibo (ver edicion-de-valores.md) =====
ALTER TABLE `recibo`
  ADD COLUMN `estado_registro` ENUM('activo','cancelado') NOT NULL DEFAULT 'activo' AFTER `fecha_pago`;
