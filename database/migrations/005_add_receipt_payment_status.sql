USE `bureau-manager`;

ALTER TABLE `recibo`
  ADD COLUMN `estado_pago` enum('pendiente','pagado') NOT NULL DEFAULT 'pendiente'
    AFTER `fecha`,
  ADD COLUMN `fecha_pago` datetime DEFAULT NULL AFTER `estado_pago`;
