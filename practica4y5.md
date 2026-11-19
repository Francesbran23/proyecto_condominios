Práctica 4 y 5 — Condominios
0. Resumen: qué quedó resuelto y qué falta
Ejercicio	Estado	Dónde
1.1 Tipos y dominios	Resuelto (tabla completa)	Sección 2.1 → DOMINIOS.MD
1.2 Restricciones de columna	Resuelto: 16 reglas CHECK/UNIQUE (piden ≥10) + DEFAULT/NOT NULL	Sección 2.2 + migración 001-DOMINIOS.SQL
1.3 Fuente de datos	Resuelto con justificación; repitan y documenten su búsqueda	Sección 2.3 → FUENTE.MD
1.4 Script de carga	Resuelto (Node + LOAD DATA); falta ejecutarlo y pegar salidas/tiempos	Sección 2.4 → POBLAR/
1.5 Pruebas de dominio	10 casos escritos; falta pegar mensajes reales	Sección 2.5 → PRUEBAS-DOMINIO.MD/.SQL
1.6 Usuarios y permisos	Resuelto (3 roles, matriz, pruebas, REVOKE); falta salida real	Sección 2.6 → PERMISOS.MD, 003-ROLES.SQL
1.7 Proyecto asignado	No resuelto (necesita su fork). Guía y plantillas	Sección 2.7
2.1-2.2 FK y acciones	Resuelto (20 FK, acción y justificación)	Sección 3.1 → REFERENCIAS.MD, 002-REFERENCIAS.SQL
2.3 Pruebas referenciales	Resuelto con valores esperados para los datos de este repo; falta salida real	Sección 3.2 + COMPROBACIONES-INTEGRIDAD.SQL
2.4 DML y transacciones	Resuelto (todos los incisos)	Sección 3.3 → EDICION-DE-VALORES.MD/.SQL
2.5 Almacén asignado	No resuelto (necesita su fork). Guía y plantillas	Sección 3.4
2.6 Trabajo individual	Plantilla + ejemplo; cada integrante hace el suyo	Sección 3.5
1. Qué debes cambiar en el repositorio (lista exacta)
Pediste que no cambiara nada y te dijera qué cambiar. Ningún archivo existente del proyecto fue modificado: todo lo nuevo son archivos adicionales. Estos son los cambios que sí tienes que hacer tú, en orden de importancia:

#	Prioridad	Dónde	Qué cambiar	Por qué
1	CRÍTICA	back/.env.example (líneas 6-7 y 14-16)	Reemplazar los valores reales por marcadores: DB_PASSWORD = <su contraseña>, SMTP_USER = <correo>, SMTP_PASSWORD = <app_password>. Revocar la contraseña de aplicación de Gmail que aparece ahí y cambiar la contraseña de MySQL root. Si el archivo ya se subió a GitHub, también limpiarlo del historial (git filter-repo o BFG), porque borrar el archivo no borra el historial.	El archivo contiene una contraseña de base de datos y una contraseña de aplicación de Gmail en texto claro. La práctica exige "sin credenciales adentro" y cualquiera con acceso al repo puede usarlas.
2	CRÍTICA	back/.conexionDataBase.js líneas 27-28	Quitar los valores por omisión: user: process.env.DB_USER y password: process.env.DB_PASSWORD (sin || 'root' ni || 'root12006@'), y que el programa termine con un mensaje si faltan.	La contraseña está incrustada en el código fuente.
3	Alta	back/.env local (no versionado)	Cambiar DB_USER = usr_app y poner la contraseña de usr_app (después de correr 003-ROLES.SQL).	Ej. 1.6.3: la aplicación no debe conectarse como administrador/root.
4	Alta	Repositorio	Crear la rama practica4-5, copiar las carpetas practica4/, practica5/, evidencias/ y compose.yaml de este paquete, y hacer commits por integrante en días distintos. Cerrar con Pull Request revisado por otro integrante.	Requisito de continuidad del entorno.
5	Alta	Orden de ejecución	database/bureau-manager.sql → 001-DOMINIOS.SQL → 002-referencias.sql → 003-ROLES.SQL (por crear crear-usuarios.sh). No aplicar database/migrations/001...006: el dump ya las incluye (ver nota abajo).	Evita errores por columnas/FK ya existentes.
6	Media	README.md	Agregar una sección "Práctica 4-5": cómo levantar compose.yaml, el comando único de carga, y la frase "los datos son sintéticos".	Lo pide el ejercicio 1.3.
7	Media	back/conexionDataBase.js (manejo de errores)	Donde hoy se responde 500, mapear los nuevos errores a mensajes claros: ER_CHECK_CONSTRAINT_VIOLATED (3819), ER_DUP_ENTRY en registrarCuenta, registrarCondominio, registrarEdificio, registrarDepartamento y registrarRecibo (folio repetido), ER_ROW_IS_REFERENCED_2 (1451).	Hoy solo registrarInquilino y actualizarInquilino manejan ER_DUP_ENTRY; con las nuevas restricciones el usuario vería "Error al registrar..." genérico.
8	Media	Tablas direccion_condominio y fecha_de_pago	Decidir: eliminarlas (DROP TABLE) o documentarlas como legado. Ninguna se usa en back/ ni src/; direccion_condominio no tiene FK al condominio y fecha_de_pago quedó huérfana desde la migración 002 original.	Una tabla sin relación ni uso es ruido en el modelo; si se conservan, cp_direccion debería ser CHAR(5) (un INT pierde el cero inicial: 01030 → 1030).
9	Baja	Borrado lógico (opcional)	Si adoptan recibo.estado_registro, agregar AND r.estado_registro = 'activo' a las consultas de receiptSelect (getRecibos, envío de correos, PDF masivo).	Si no, los recibos "cancelados" siguen apareciendo en la aplicación.
10	Info	Nombres de columnas	No renombrar apellino_paterno_inquilino, apellino_materno_inquilino, descripción_extraordinaria (errores de dedo): la API y el front los usan. Documentarlos como deuda técnica en dominios.md.	Renombrar rompería la aplicación.
Nota sobre la numeración de migraciones. El repositorio ya tiene database/migrations/001...006, pero database/bureau-manager.sql es un volcado consolidado que ya contiene todo eso (recibo con no_recibo, fecha, estado_pago; inquilino.id_departamento nullable con su UNIQUE; password_reset_tokens). Por eso las migraciones de estas prácticas empiezan de nuevo en practica4/migraciones/001-dominios.sql (como pide el PDF) y se aplican encima del volcado, no sobre las 001-006 antiguas. Si su docente prefiere una sola serie, renómbrenlas 007-..., 008-..., 009-....

Comandos de Git sugeridos
bash
git checkout main && git pull
git checkout -b practica4-5
# cada integrante, en días distintos:
git add practica4/migraciones/001-dominios.sql && git commit -m "P4: dominios y restricciones CHECK/UNIQUE"
git add practica4/poblar && git commit -m "P4: script de carga repetible"
git add practica5 && git commit -m "P5: referencias, DML y transacciones"
git push -u origin practica4-5   # abrir Pull Request; otro integrante revisa y fusiona

# comprobar que no se sube nada secreto:
git ls-files | grep -E "\.env$"   # no debe imprimir nada
Cómo se levanta y se ejecuta todo (orden)
bash
export MYSQL_ROOT_PASSWORD='...'
docker compose up -d

# 1) migraciones (administrador)
mysql -h 127.0.0.1 -u root -p"$MYSQL_ROOT_PASSWORD" < practica4/migraciones/001-dominios.sql
mysql -h 127.0.0.1 -u root -p"$MYSQL_ROOT_PASSWORD" < practica4/migraciones/002-referencias.sql

# 2) roles y usuarios (contraseñas desde variables de entorno)
export APP_PASSWORD='...' CONSULTA_PASSWORD='...' ADMIN_PASSWORD='...'
bash practica4/migraciones/crear-usuarios.sh

# 3) carga con el rol de la aplicación
export DB_HOST=127.0.0.1 DB_NAME=bureau-manager DB_USER=usr_app DB_PASSWORD="$APP_PASSWORD" SEED_ADMIN_PASSWORD="..."
cd practica4/poblar && (cd ../../back && npm install) && node poblar.js   # 1a ejecución
node poblar.js
make comparar   # tiempo LOAD DATA vs INSERT por renglón
Práctica 4 — DDL, restricciones de dominio y permisos
1.1 dominios.md — tipo de dato elegido por columna (ejercicio 1.1)
Convención: los montos son DECIMAL (nunca DOUBLE), las fechas son DATE/DATETIME, los identificadores son INT AUTO_INCREMENT, y los textos tienen la longitud que ya valida la API (exceedsColumnLength).

Tabla	Columna	Tipo final	Por qué
condominio	id_condominio	INT AUTO_INCREMENT	Clave sustituta; 2³¹ valores sobran.
nombre_condominio	VARCHAR(45) NOT NULL UNIQUE	Nombre comercial; la API limita a 45.
direccion_condominio	VARCHAR(100) NOT NULL	Dirección en una línea; la API limita a 100.
edificio	id_edificio / id_condominio	INT / INT NOT NULL	PK y FK (un edificio siempre pertenece a un condominio).
nombre_edificio	VARCHAR(20) NOT NULL	"Torre A", "Edificio 3"; la API limita a 20.
departamento	id_departamento / id_edificio	INT / INT NOT NULL	PK y FK.
numero_departamento	VARCHAR(10) NOT NULL	Texto, no número: "101", "PH-2", "A-04". No se hace aritmética con él.
inquilino	id_departamento	INT NULL	Opcional: un inquilino puede estar liberado (migración 004).
nombre / apellidos	VARCHAR(45) NOT NULL	Nombres propios; longitud ya validada en la API.
correo_inquilino	VARCHAR(45) NOT NULL	La API lo limita a 45 (RFC 5321 permite 254; ampliar a 100 es mejora futura).
administrador	correo_administrador	VARCHAR(45) NOT NULL UNIQUE	Identifica la cuenta para login y recuperación.
contraseña_administrador	VARCHAR(255) NOT NULL	Guarda el hash scrypt$salt$hash (168 caracteres), nunca la contraseña.
recibo	no_recibo	VARCHAR(20) NOT NULL	Folio alfanumérico (ej. C01-202609-0042); límite de la API.
fecha	DATE NOT NULL DEFAULT (CURRENT_DATE)	Solo día de emisión; sin hora ni zona.
estado_pago	ENUM('pendiente', 'pagado') DEFAULT 'pendiente'	Lista cerrada de 2 valores; ocupa 1 byte.
fecha_pago	DATETIME NULL	Momento exacto del pago; NULL mientras esté pendiente.
estado_registro	ENUM('activo', 'cancelado') DEFAULT 'activo'	Borrado lógico (migración 002).
cuota_ordinaria / extraordinaria / penalización / fondo_de_reserva / adeudos_anteriores	monto_*	DECIMAL(10,2) NOT NULL DEFAULT 0.00	Antes DOUBLE. El punto flotante binario no representa 0.10 ni 0.20 exactamente (0.1+0.2 ≠ 0.3); en dinero se usa decimal exacto con 2 decimales, hasta $99,999,999.99.
descripción_*	VARCHAR(45) NOT NULL	Texto corto de concepto; límite de la API.
total_pagado	monto_total	DECIMAL(12,2) NOT NULL DEFAULT 0.00	Suma de cinco montos: se deja holgura de 2 dígitos.
concepto_de_pago	descripción_concepto	VARCHAR(45) NOT NULL	Texto corto.
password_reset_tokens	token_hash	CHAR(64) NOT NULL UNIQUE	SHA-256 en hexadecimal: longitud fija de 64 → CHAR.
expires_at / created_at	DATETIME / TIMESTAMP DEFAULT CURRENT_TIMESTAMP	Vigencia del token y fecha de creación automática.
direccion_condominio (legado)	cp_direccion	INT → debería ser CHAR(5)	El código postal es un identificador, no un número: INT pierde el cero inicial (01030 → 1030). Tabla sin uso (ver sección 1, #8).
fecha_de_pago (legado)	dia_fecha, mes_fecha, año_fecha	INT, VARCHAR(15), INT	Fecha partida en tres columnas: reemplazada por recibo.fecha DATE. Se recomienda eliminar la tabla.
CREATE DOMAIN. MySQL no lo soporta (es de PostgreSQL). Lo que se hace en su lugar: ENUM para listas cerradas (estado_pago, estado_registro), una convención única DECIMAL(10,2) para todos los montos, y la misma expresión CHECK repetida para el formato de correo (administrador e inquilino). Lo que se pierde frente a CREATE DOMAIN: cambiar la regla del correo exige modificar dos restricciones en vez de una. Si migraran a PostgreSQL, CREATE DOMAIN correo AS VARCHAR(45) CHECK (...) centralizaría la regla.

1.2 Restricciones de columna (ejercicio 1.2) — migración 001-dominios.sql
Id	Restricción	Tabla.columna	Regla del dominio (una línea)
R1	CHECK >= 0	cuota_ordinaria / extraordinaria / penalización / reserva / adeudos	Una cuota nunca es negativa (la API ya rechaza negativos; ahora lo garantiza el gestor).
R2	CHECK >= 0	total_pagado.monto_total	El total de un recibo no puede ser negativo.
R3	UNIQUE	administrador.correo_administrador	Un correo identifica una sola cuenta (login y recuperación).
R4	CHECK regexp	administrador.correo_administrador	El correo tiene forma algo@dominio.ext (misma regla que la API).
R5	CHECK longitud >= 8	administrador.contraseña_administrador	Mínimo 8 caracteres (el hash scrypt mide 168).
R6	CHECK no vacío	administrador.nombre_administrador	El nombre no puede ser solo espacios.
R7	CHECK regexp	inquilino.correo_inquilino	El recibo se envía por correo: debe tener formato válido.
R8	UNIQUE	condominio.nombre_condominio	No hay dos condominios con el mismo nombre.
R9	UNIQUE compuesta	edificio (id_condominio, nombre_edificio)	Dos edificios del mismo condominio no se llaman igual.
R10	UNIQUE compuesta	departamento (id_edificio, numero_departamento)	Un número de departamento aparece una vez por edificio.
R11	UNIQUE compuesta	recibo (id_condominio, no_recibo)	El folio no se repite dentro de un condominio.
R12	CHECK no vacío	recibo.no_recibo	El folio no puede estar en blanco.
R13	CHECK entre columnas	recibo (estado_pago, fecha_pago)	Un recibo está pagado si y solo si tiene fecha de pago (coincide con marcar Recibo Pagado).
R14	CHECK entre columnas	recibo (fecha_pago, fecha)	No se puede pagar antes de la fecha de emisión.
R15	CHECK regexp	password_reset_tokens.token_hash	Es un SHA-256 en hexadecimal (64 caracteres 0-9a-f).
R16	7 × UNIQUE	recibo.id_total, id_ordinaria, id_extraordinaria, id_penalizacion, id_reserva, id_adeudos, id_concepto	Cada recibo tiene sus propias cuotas (1:1): evita que dos recibos compartan una fila y que un UPDATE de penalización altere recibos ajenos.
NOT NULL: ya está declarado en todas las columnas obligatorias del volcado, incluidas las FK de cardinalidad mínima 1 (edificio.id_condominio, departamento.id_edificio, las 11 FK de recibo, las 5 de total_pagado). La única FK que admite NULL es inquilino.id_departamento (relación opcional).

DEFAULT: monto_* = 0.00 (nuevo), recibo.fecha = CURRENT_DATE (nuevo), estado_pago = 'pendiente', estado_registro = 'activo', created_at = CURRENT_TIMESTAMP, descripcion_ordinaria/penalizacion = '' (ya existían).

Son 16 reglas (se piden ≥10). Un CHECK no se puso sobre columnas id_*: MySQL lo prohíbe en columnas con FK que tengan acción referencial (error 3823), y no tendría sentido.

Requisito: MySQL ≥ 8.0.16 (antes de esa versión MySQL acepta pero ignora los CHECK). El volcado indica 8.0.28, y compose.yaml usa mysql:8.0.

1.3 fuente.md — fuente de datos (ejercicio 1.3)
Conclusión: no encontré un conjunto público de recibos de mantenimiento, cuotas e inquilinos de condominios, por lo que se generan datos sintéticos. Registro de búsqueda (18-nov-2026):

Término buscado	Dónde	Qué apareció	Por qué no sirve
datos abiertos CDMX condominios cuotas de mantenimiento recibos conjunto de datos	Buscador web → portal datos.cdmx.gob.mx y sitios relacionados	Un estudio privado de morosidad en 100 condominios de la CDMX (ComunidadFeliz, nota de prensa de 2021), una solicitud de información pública sobre cuántos condominios verticales/horizontales existen (INFOCDMX.RR.IP.1695/2021) y notas sobre presupuesto a unidades habitacionales.	Son agregados o noticias; ninguno publica renglones de cuotas, recibos ni inquilinos.
Catálogo Nacional de Códigos Postales Correos de México descarga datos abiertos	Correos de México (SEPOMEX) / datos.gob.mx	Catálogo de códigos postales y colonias, gratuito para uso particular y con prohibición de comercializarlo.	Sirve para direcciones, pero el esquema guarda la dirección como un solo texto (direccion_condominio); no aporta cuotas ni recibos.
Razón de fondo: los cobros de cuotas y los datos de inquilinos son información financiera y personal de personas físicas, que las administradoras no publican. Pendiente para ustedes: dos búsquedas no bastan; repitan con sus propios términos (por ejemplo "unidades habitacionales", "cuotas de mantenimiento", "régimen de propiedad en condominio") en datos.cdmx.gob.mx, datos.gob.mx e INEGI, añadan la fecha y el resultado a esta tabla, y consideren preguntar a quien planteó el caso de estudio si puede compartir datos reales anonimizados. Si aparece algo, hay que agregar la referencia APA 7 y la tabla de correspondencia campo-columna.

Cómo se generan los datos sintéticos (reproducibles)
Tabla	Renglones	Cómo se genera
condominio / edificio / departamento	12 / 36 / 216	12 condominios × 3 torres × 6 departamentos. Nombres inventados; alcaldías reales de la CDMX; números de departamento tipo "101".
inquilino	216 (12 sin departamento)	Un inquilino por departamento; ~5 % queda sin departamento asignado para ejercitar la relación opcional. Nombres y apellidos comunes en México; correos @correo_example (dominio reservado, no existe).
recibo + 7 tablas de cuotas	612 por tabla	3 meses (jul-15 sep 2026) × 204 inquilinos asignados. Cuota base de $850-$2,200; ~15 % con cuota extraordinaria; 70 % pagados; penalización a parte de los pendientes; total = suma exacta de las cinco cuotas.
administrador	3	admin1.3@condominios_example; la contraseña sale de SEED_ADMIN_PASSWORDS y se guarda con script, igual que la API.
Semilla fija (20261105): cada ejecución del generador produce los mismos archivos. Cumple "≥200 renglones en cada tabla principal" (departamento 216, inquilino 216, recibo 612). condominio (12) y edificio (36) son catálogos pequeños por naturaleza; si el docente exige 200 en todas, suban NC en generar-datos.js. En el README debe decir "datos sintéticos". Verificación hecha: python3 validar-datos.py → 0 errores (longitudes, FK, unicidad, formato de correo, R13/R14, totales = suma, inquilino-departamento-condominio coherentes).

1.4 El script de carga (ejercicio 1.4) — practica4/poblar
Requisito	Cómo se cumple en poblar.js
Repetible	Por tabla cuenta los renglones con id dentro del rango del CSV: si son todos, los omite (0 insertados); si son cero, carga; si hay carga parcial, aborta y pide make limpia. Los administradores se buscan por correo antes de insertar.
Ordenado	Arreglo TABLAS: condominio → edificio → departamento → inquilino → concepto → 5 cuotas → total_pagado → recibo (padres antes que hijos).
Todo o nada	Una sola transacción. Ante cualquier error hace ROLLBACK y reporta tabla, archivo, código y mensaje de MySQL; además repite la tabla renglón por renglón para señalar cuál renglón falla (hasta 10).
Con cuentas	Al final imprime por tabla: insertados, omitidos y rechazados, más el tiempo total.
Sin credenciales	Solo variables de entorno (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORDS, SEED_ADMIN_PASSWORDS); si falta alguna, no arranca. Se conecta con usr_app.
Eficiente	Modo por omisión LOAD DATA LOCAL FILE (requiere local_infile=1, ya puesto en compose.yaml). --modo=filas hace un INSERT por renglón; make comparar limpia y mide ambos.
Pendiente (ustedes): ejecutar node poblar.js dos veces y pegar las dos salidas en evidencias/, y correr make comparar para reportar la diferencia de tiempo (no la puedo medir aquí). Referencia del formato esperado de la salida: 1ª ejecución → administrador 3 insertados, condominio 12, edificio 36, departamento 216, inquilino 216, concepto_de_pago / cuota_* / adeudos / total_pagado / recibo 612 cada una, 0 omitidos, 0 rechazados. 2ª ejecución → 0 insertados y los mismos números en "omitidos".

Lo que rechazaron las restricciones
Como los datos son sintéticos y se generaron respetando las reglas, la carga principal rechaza 0 renglones. Para demostrar el mecanismo con datos "sucios" se incluye datos/sucio/inquilino_sucio.csv y el modo node poblar.js --demo-sucio (siempre termina en ROLLBACK). Resultado esperado y decisión caso por caso:

Caso en inquilino_sucio.csv	Restricción que lo rechaza	Error esperado de MySQL	Decisión
Correo con formato inválido	R7 (CHECK regexp correo_inquilino)	ER_CHECK_CONSTRAINT_VIOLATED (3819)	Rechazar el renglón; el generador debe producir correos válidos
id_departamento inexistente	FK a departamento	ER_NO_REFERENCED_ROW_2 (1452)	Rechazar; corregir el CSV de origen
id_departamento duplicado	UNIQUE de inquilino.id_departamento	ER_DUP_ENTRY (1062)	Rechazar; un departamento tiene un inquilino
Nombre o apellidos vacíos	NOT NULL / CHECK no vacío	ER_BAD_NULL_ERROR (1048) / 3819	Rechazar; validar en el generador
Longitud > 45 en texto	VARCHAR(45)	ER_DATA_TOO_LONG (1406)	Rechazar; truncar o corregir en origen


1.5 pruebas-dominio.md — diez intentos de violar restricciones (ejercicio 1.5)
Archivo ejecutable: practica4/pruebas-dominio.sql (mysql ... -force para ver todos los errores). La columna de mensaje es lo esperado; reemplácenla con la salida real.

#	Operación intentada	Resultado esperado	Mensaje esperado de MySQL	Regla protegida
1	INSERT INTO condominio con nombre_condominio = NULL	Rechazado (NOT NULL)	ERROR 1048: Column 'nombre_condominio' cannot be null	Todo condominio tiene nombre.
2	INSERT INTO edificio (id_condominio) sin nombre	Rechazado (NOT NULL sin DEFAULT)	ERROR 1364: Field 'nombre_edificio' doesn't have a default value	Todo edificio tiene nombre.
3	INSERT INTO cuota_ordinaria (descripción) sin monto	Aceptado; monto = 0.00	(sin error) SELECT devuelve 0.00	DEFAULT: cuota inicial en cero.
4	Administrador con correo ya existente	Rechazado (UNIQUE)	ERROR 1062: Duplicate entry '1-101' for key 'admin1@condominios.example' for key 'administrador.uq_administrador_correo'	Un correo = una cuenta.
5	Departamento con mismo número en el mismo edificio	Rechazado (UNIQUE compuesta)	ERROR 1062: Duplicate entry '1-1101' for key 'departamento.uq_departamento_numero_edificio'	Número único por edificio.
6	monto_ordinaria = -50.00	Rechazado (CHECK rango)	ERROR 3819: Check constraint 'ck_ordinaria_monto' is violated.	Cuotas no negativas.
7	Inquilino con correo correo-sin-arroba	Rechazado (CHECK formato)	ERROR 3819: Check constraint 'ck_inquilino_correo' is violated.	Correo con formato válido.
8	UPDATE recibo SET estado_pago='pagado', fecha_pago=NULL	Rechazado (CHECK entre columnas)	ERROR 3819: Check constraint 'ck_recibo_pago_coherente' is violated.	Pagado ⇔ tiene fecha de pago.
9	fecha_pago = 2000-01-01 en recibo de 2026	Rechazado (CHECK entre columnas)	ERROR 3819: Check constraint 'ck_recibo_pago_posterior' is violated.	No se paga antes de emitir.
10	estado_pago = 'cancelado'	Rechazado (ENUM, lista de valores)	ERROR 1265: Data truncated for column 'estado_pago' at row 1	Solo 'pendiente' o 'pagado'.
1.6 permisos.md — roles y usuarios (ejercicio 1.6)
Rol / usuario	Para qué existe	Privilegios (mínimo necesario)
rol_app / usr_app	Lo usa el backend (conexionDataBase.js) y el script de carga.	SELECT/INSERT/UPDATE en condominio, edificio, departamento, inquilino, recibo y administrador; SELECT/INSERT en concepto, las 5 cuotas y total_pagado; SELECT/INSERT/UPDATE/DELETE solo en password_reset_tokens. Sin DELETE en el resto (la API nunca borra) y sin DDL. Se derivó de las sentencias reales del backend.
rol_consulta / usr_consulta	Reportes y análisis (prácticas 9-12): solo lectura.	SELECT en las 12 tablas de negocio. No ve administrador ni password_reset_tokens (credenciales).
rol_admin / usr_admin	Administración y migraciones.	ALL PRIVILEGES solo sobre bureau-manager.* (no sobre todo el servidor ni otras bases).
Las contraseñas no están en el repositorio: crear-usuarios.sh usa envsubst sobre 003-roles.sql con APP_PASSWORD, CONSULTA_PASSWORD y ADMIN_PASSWORD. Se usa SET DEFAULT ROLE ALL para que el rol esté activo al conectarse (sin eso, el usuario se conecta sin privilegios).

Matriz de permisos (S=SELECT, I=INSERT, U=UPDATE, D=DELETE)
Tabla	rol_app	rol_consulta	rol_admin
condominio, edificio, departamento, inquilino, recibo	S I U	S	todo
concepto_de_pago, cuota_ordinaria, cuota_extraordinaria, cuota_de_penalización, cuota_de_fondo_de_reserva, adeudos_anteriores, total_pagado	S I	S	todo
administrador	S I U	—	todo
password_reset_tokens	S I U D	—	todo
direccion_condominio, fecha_de_pago (legado, sin uso)	—	—	todo
Pruebas (permitida / negada) — archivo permisos-pruebas.sql
Usuario	Operación	Resultado esperado	Mensaje esperado
usr_app	SELECT COUNT(*) FROM recibo	Permitida	—
usr_app	DELETE FROM recibo WHERE id_recibo = 1	Negada	ERROR 1142: DELETE command denied to user 'usr_app'@'...' for table 'recibo'
usr_consulta	SELECT COUNT(*) FROM inquilino	Permitida	—
usr_consulta	INSERT INTO condominio ...	Negada	ERROR 1142: INSERT command denied to user 'usr_consulta'@'...' for table 'condominio'
usr_consulta	SELECT * FROM administrador	Negada	ERROR 1142: SELECT command denied ... for table 'administrador'
usr_admin	CREATE TABLE tmp_prueba (id INT)	Permitida	—
usr_admin	CREATE DATABASE otra_base	Negada	ERROR 1044: Access denied for user 'usr_admin'@'...' to database 'otra_base'
usr_app tras REVOKE INSERT ON inquilino FROM rol_app	INSERT INTO inquilino ... (después de reconectar)	Negada	ERROR 1142: INSERT command denied ... for table 'inquilino'
Los privilegios de un rol se leen cuando la sesión lo activa: después del REVOKE, vuelvan a conectar usr_app antes de probar. Restauren con GRANT INSERT ... TO rol_app.

Práctica 5 — DML e integridad referencial
2.1 referencias.md — claves foráneas y acciones referenciales (ejercicios 2.1 y 2.2)
El volcado tiene 20 claves foráneas; todas con ON UPDATE CASCADE y sin ON DELETE explícito (queda en el valor por omisión). La migración 002-referencias.sql declara las 20 de forma explícita. Todas se renombran a fk_<hija>_<padre> (las originales se llamaban condominio, departamento, total..., nombres ambiguos).

#	FK (hija.columna → padre)	Relación del modelo	NULL	ON DELETE / ON UPDATE	Justificación (regla del dominio)
1	edificio.id_condominio → condominio	Condominio 1:N Edificio	No (mín. 1)	RESTRICT / CASCADE	Un condominio con edificios no desaparece; borrarlo en cascada arrastraría departamentos y recibos.
2	departamento.id_edificio → edificio	Edificio 1:N Departamento	No	RESTRICT / CASCADE	Igual: no se borra un edificio con departamentos.
3	inquilino.id_departamento → departamento	Departamento 1:N Inquilino	Sí (mín. 0, migr. 004)	SET NULL / CASCADE	El inquilino sobrevive sin departamento (la API ya lo "libera" con id_departamento = NULL); conserva su historial de recibos.
4-14	recibo.id_condominio, id_departamento, id_inquilino, id_concepto, id_ordinaria, id_extraordinaria, id_penalizacion, id_reserva, id_adeudos, id_total, id_administrador	Recibo N:1 a cada padre; Recibo 1:1 con sus cuotas y su total	No (mín. 1)	RESTRICT / CASCADE	El recibo es historial contable: no debe desaparecer ni quedar sin su inquilino, cuotas o administrador. Si cambia una clave, los recibos la siguen.
15-19	total_pagado.id_ordinaria, id_extraordinaria, id_penalizacion, id_reserva, id_adeudos → cada cuota	Total 1:1 con cada cuota	No	RESTRICT / CASCADE	Un total sin sus componentes carece de sentido y viceversa; no se borra una cuota que respalda un total.
20	password_reset_tokens.id_administrador → administrador	Administrador 1:0..1 Token (entidad débil)	No (es PK)	CASCADE	El token no tiene sentido sin su administrador (ya existía; se añade ON UPDATE).
Relaciones del modelo sin FK: direccion_condominio → condominio (la tabla no tiene columna que apunte a condominio; la dirección real vive en condominio.direccion_condominio) → tabla de legado. Y la redundancia recibo.id_condominio/id_departamento/id_inquilino (el condominio y el departamento se pueden deducir del inquilino): ninguna FK garantiza que coincidan; hoy lo valida la API (registrarRecibo) y la consulta D de comprobaciones-integridad.sql lo audita. Una mejora futura es quitar la redundancia o añadir un trigger.

Asimetría a notar: recibo apunta a las cuotas (no al revés), así que borrar un recibo deja filas de cuota sin recibo. Es una de las razones para preferir el borrado lógico (2.4.3b).

2.3 pruebas-referenciales.md y comprobaciones (ejercicio 2.3)
#	Acción	Sentencia DML	Antes	Resultado esperado	Después
1	RESTRICT	DELETE FROM condominio WHERE id_condominio = 1	12 condominios, 36 edificios	ERROR 1451: Cannot delete or update a parent row: a foreign key constraint fails (bureau-manager.edificio, CONSTRAINT id_condominio ...)	12 y 36 (sin cambio)
2	SET NULL	Departamento de prueba (sin recibos) con un inquilino; DELETE FROM departamento WHERE id_departamento = @dep	+1 departamento, +1 inquilino	Borra 1 departamento; el inquilino sobrevive con id_departamento = NULL	Inquilinos: 217 → 217
3	CASCADE	Administrador temporal (sin recibos) con 1 token; DELETE FROM administrador WHERE id_administrador = @adm	1 admin extra, 1 token	Borra el administrador y su token	Tokens: 1 → 0
4	ON UPDATE CASCADE	UPDATE condominio SET id_condominio = 1201 WHERE id_condominio = 1	3 edificios y 48 recibos con id_condominio = 1	Éxito: hijos siguen la nueva clave	3 edificios y 48 recibos con id_condominio = 1201
5	FK inexistente	INSERT INTO condominio (id_condominio, nombre_edificio) VALUES (99999, 'Fantasma')	36 edificios	ERROR 1452: Cannot add or update a child row: a foreign key constraint fails	36 (sin cambio)
6	Orden de carga	INSERT INTO departamento (id_edificio, ...) VALUES (777777, '101') (hija antes que padre)	216 departamentos	ERROR 1452 (el edificio aún no existe)	216 (sin cambio)
Orden de carga y cómo se resuelve. Si poblar.js intentara departamento antes que edificio, MySQL rechazaría el primer renglón con el error 1452 y la transacción se revertiría completa. Se resuelve cargando padres antes que hijos (el arreglo TABLAS), no con SET FOREIGN_KEY_CHECKS = 0, que apaga la protección y permite dejar huérfanos sin aviso.

2.4 edicion-de-valores.md — DML y transacciones (ejercicio 2.4)
Archivo ejecutable completo: practica5/sql/edicion-de-valores.sql (también en el apéndice E). Todos parten de situaciones reales del dominio:

Inciso	Situación real	Técnica	Resultado esperado (datos de este paquete)
2.4.1a	Los recibos de septiembre que siguen pendientes generan un adeudo anterior para el siguiente periodo.	INSERT ... SELECT (con JOIN a total_pagado)	64 filas insertadas en adeudos_anteriores.
2.4.1b	Registrar un condominio que ya existe actualiza su dirección en lugar de fallar.	INSERT ... ON DUPLICATE KEY UPDATE (usa uq_condominio_nombre)	ROW_COUNT() = 2 (actualizó). Si no existiera, = 1.
2.4.2a	Penalización del 5 % de la cuota ordinaria a recibos pendientes de jul-ago, y recálculo del total.	UPDATE ... JOIN de 3 tablas	82 penalizaciones aplicadas; luego los totales siguen sumando.
2.4.2b	Clasificar el adeudo como leve / moderado / grave / sin adeudos.	UPDATE ... SET col = CASE ...	Todas las descripciones quedan en 4 categorías.
2.4.3a	Eliminar inquilinos liberados que nunca tuvieron recibos.	DELETE ... WHERE NOT EXISTS (subconsulta)	12 borrados (216 → 204).
2.4.3b	Cancelar el recibo C01-202607-0001 sin perder el historial.	Borrado lógico: estado_registro = 'cancelado'	Activos: 611 de 612.
2.4.4	Emitir el recibo de octubre del inquilino 1 (7 INSERT en 7 tablas) y registrar su pago.	Transacción + SAVEPOINT + ROLLBACK TO SAVEPOINT + COMMIT	Una captura equivocada (monto_total = 0) se deshace con la reversión parcial; el recibo y su pago quedan confirmados.
2.4.5	Falla a la mitad: se inserta una cuota válida y luego una reserva de -1.00.	ROLLBACK explícito	ERROR 3819 (ck_reserva_monto); filas_de_mas = 0.
¿Borrado físico o lógico? Qué se pierde
Físico (DELETE) conviene para datos sin historia ni dependientes: un inquilino liberado sin recibos, un token vencido. Se pierde la fila para siempre, y las acciones referenciales deciden el daño: con RESTRICT el gestor lo impide si algo depende de ella; con CASCADE arrastra a los hijos; con SET NULL los deja huérfanos de padre pero vivos.

Lógico (estado_registro = 'cancelado') conviene para información contable/legal (recibos): se conserva el rastro, los totales históricos y la auditoría, y no quedan cuotas huérfanas. Su costo: todas las consultas deben filtrar estado_registro = 'activo', y los UNIQUE siguen "ocupados" por el recibo cancelado (el folio no se puede reutilizar).

En este dominio: recibos → lógico; catálogos sin uso (tokens vencidos, inquilinos sin recibos) → físico.

Detalle importante de MySQL (2.4.5). Un error dentro de una transacción solo deshace la sentencia que falló; la transacción sigue abierta con lo anterior ya aplicado. Por eso es obligatorio ejecutar ROLLBACK (la API lo hace en su bloque catch, igual que registrarRecibo). El contador AUTO_INCREMENT sí avanza aunque se revierta: los huecos en los ids son normales.



