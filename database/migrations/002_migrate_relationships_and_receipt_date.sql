USE `bureau-manager`;

ALTER TABLE `inquilino`
  ADD COLUMN `id_departamento` int NULL AFTER `id_inquilino`;

UPDATE `inquilino` i
JOIN `departamento` d ON d.`id_inquilino` = i.`id_inquilino`
SET i.`id_departamento` = d.`id_departamento`;

ALTER TABLE `inquilino`
  MODIFY COLUMN `id_departamento` int NOT NULL,
  ADD KEY `id_departamento_idx` (`id_departamento`),
  ADD CONSTRAINT `id_departamento` FOREIGN KEY (`id_departamento`)
    REFERENCES `departamento` (`id_departamento`) ON UPDATE CASCADE;

ALTER TABLE `departamento`
  DROP FOREIGN KEY `id_inquilino`,
  DROP INDEX `id_inquilino_idx`,
  DROP COLUMN `id_inquilino`;

ALTER TABLE `recibo`
  ADD COLUMN `fecha` date NULL AFTER `id_inquilino`;

UPDATE `recibo` r
JOIN `fecha de pago` f ON f.`id_fecha` = r.`id_fecha`
SET r.`fecha` = STR_TO_DATE(
  CONCAT(
    f.`año_fecha`, '-',
    CASE LOWER(f.`mes_fecha`)
      WHEN 'enero' THEN '01'
      WHEN 'febrero' THEN '02'
      WHEN 'marzo' THEN '03'
      WHEN 'abril' THEN '04'
      WHEN 'mayo' THEN '05'
      WHEN 'junio' THEN '06'
      WHEN 'julio' THEN '07'
      WHEN 'agosto' THEN '08'
      WHEN 'septiembre' THEN '09'
      WHEN 'octubre' THEN '10'
      WHEN 'noviembre' THEN '11'
      WHEN 'diciembre' THEN '12'
      ELSE NULL
    END,
    '-',
    LPAD(f.`dia_fecha`, 2, '0')
  ),
  '%Y-%m-%d'
);

ALTER TABLE `recibo`
  MODIFY COLUMN `fecha` date NOT NULL,
  DROP FOREIGN KEY `fecha`,
  DROP INDEX `id_fecha_idx`,
  DROP COLUMN `id_fecha`;
