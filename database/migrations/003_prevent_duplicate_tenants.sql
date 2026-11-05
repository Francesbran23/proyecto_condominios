USE `bureau-manager`;

ALTER TABLE `inquilino`
  ADD UNIQUE KEY `uq_inquilino_departamento_identidad`
    (`id_departamento`, `nombre_inquilino`, `apellino_paterno_inquilino`,
     `apellino_materno_inquilino`, `correo_inquilino`);
