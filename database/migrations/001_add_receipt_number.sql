USE `bureau-manager`;

ALTER TABLE `recibo`
  ADD COLUMN `no_recibo` varchar(20) NOT NULL DEFAULT '';

CREATE INDEX `no_recibo_idx` ON `recibo` (`no_recibo`);

ALTER TABLE `cuota ordinaria`
  ADD COLUMN `descripcion_ordinaria` varchar(45) NOT NULL DEFAULT '';

ALTER TABLE `cuota de penalización`
  ADD COLUMN `descripcion_penalizacion` varchar(45) NOT NULL DEFAULT '';
