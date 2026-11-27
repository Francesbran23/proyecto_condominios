# Práctica: normalización y álgebra relacional

## 1. Objetivo y alcance

Esta práctica estudia una decisión de normalización del sistema Bureau Manager y aplica operaciones del álgebra relacional sobre un conjunto pequeño de datos ficticios. El esquema de referencia es `database/neon-schema.sql`; los nombres simplificados y las filas de ejemplo que aparecen en la parte de RelaX son exclusivamente didácticos y no modifican el sistema de produccion actual de Neon.

Se cubren:

- Dependencias funcionales, claves candidatas, 1FN, 2FN, 3FN y FNBC.
- Selección, proyección, operaciones de conjuntos, producto cartesiano, reuniones, agrupación y división.
- Una consulta representativa en RelaX y su equivalente en SQL, con resultados esperados comparables.

## 2. Decisión de normalización: separar el recibo de sus entidades

Una primera propuesta podría guardar en una sola relación toda la información necesaria para imprimir un recibo:

```text
ReciboPlano(
  id_recibo, no_recibo,
  id_condominio, nombre_condominio, direccion_condominio,
  id_edificio, nombre_edificio,
  id_departamento, numero_departamento,
  id_inquilino, nombre_inquilino, apellidos_inquilino, correo_inquilino,
  id_administrador, nombre_administrador, correo_administrador,
  fecha, estado_pago, fecha_pago,
  id_concepto, descripcion_concepto,
  id_ordinaria, monto_ordinaria, descripcion_ordinaria,
  id_extraordinaria, monto_extraordinaria, descripcion_extraordinaria,
  id_penalizacion, monto_penalizacion, descripcion_penalizacion,
  id_reserva, monto_reserva, descripcion_reserva,
  id_adeudos, monto_adeudos, descripcion_adeudos,
  id_total, monto_total, pdf_storage_key
)
```

Esta forma repite los datos del condominio, edificio, departamento, inquilino y administrador en cada recibo. Por ejemplo, si cambia el correo de un inquilino habría que actualizar todos sus recibos. Si una fila se omite o se elimina, también se podrían perder datos que no pertenecen al recibo en sí. La decisión es guardar cada hecho en la relación que lo determina y conectar las relaciones mediante claves foráneas.

### 2.1 Dependencias funcionales consideradas

Una dependencia funcional `X → Y` significa que, para todas las filas válidas, dos filas que coinciden en `X` también deben coincidir en `Y`.

Las siguientes dependencias se apoyan en claves primarias y restricciones `UNIQUE` del esquema Neon:

```text
id_recibo → todos los demás atributos del recibo
(id_condominio, no_recibo) → todos los atributos del recibo

id_condominio → nombre_condominio, direccion_condominio
nombre_condominio → id_condominio, direccion_condominio

id_edificio → id_condominio, nombre_edificio
(id_condominio, nombre_edificio) → id_edificio

id_departamento → id_edificio, numero_departamento
(id_edificio, numero_departamento) → id_departamento

id_inquilino → id_departamento, nombre, apellidos, correo
id_administrador → nombre y apellidos del administrador, correo, contraseña
correo_administrador → id_administrador y los demás datos del administrador

id_concepto → descripcion_concepto
id_ordinaria → monto_ordinaria, descripcion_ordinaria
id_extraordinaria → monto_extraordinaria, descripcion_extraordinaria
id_penalizacion → monto_penalizacion, descripcion_penalizacion
id_reserva → monto_reserva, descripcion_reserva
id_adeudos → monto_adeudos, descripcion_adeudos
id_total → ids de sus componentes, monto_total
```

En `recibo`, además de `id_recibo` y la clave natural `(id_condominio, no_recibo)`, cada referencia a concepto, cuota y total está marcada `UNIQUE` y `NOT NULL`. Por tanto, en el esquema actual esas referencias también identifican como máximo un recibo y son claves candidatas de `recibo`. Es una decisión técnica del esquema existente; no implica que todo modelo de recibos deba imponer esa unicidad.

Las dependencias funcionales expresan reglas del dominio, no simples coincidencias de los datos de prueba. Por ejemplo, no se supone que `correo_inquilino` sea único: el esquema no tiene esa restricción.

### 2.2 Claves candidatas de la relación de recibos

Para la parte del recibo, el esquema declara estas claves:

- `id_recibo`: clave primaria y candidata.
- `(id_condominio, no_recibo)`: clave candidata natural, declarada `UNIQUE`.
- `id_concepto`, `id_ordinaria`, `id_extraordinaria`, `id_penalizacion`, `id_reserva`, `id_adeudos` e `id_total`: también candidatas en la tabla `recibo` actual por sus restricciones individuales `UNIQUE NOT NULL`.

Al añadir a la relación universal atributos descriptivos de entidades relacionadas, la clave de recibo determina esos atributos indirectamente mediante las claves foráneas. Por ejemplo:

```text
id_recibo → id_inquilino → nombre_inquilino, apellidos_inquilino, correo_inquilino
id_recibo → id_condominio → nombre_condominio, direccion_condominio
```

La unicidad de `nombre_condominio` y `correo_administrador` sí está declarada en el esquema. No se debe inferir unicidad para nombres de edificios fuera de su condominio ni para números de departamento fuera de su edificio.

### 2.3 Recorrido hasta 3FN

**Primera forma normal (1FN).** Cada atributo contiene un valor atómico y cada fila representa un solo recibo. No se guardan listas de inquilinos, cuotas o conceptos dentro de una celda.

**Segunda forma normal (2FN).** En la relación universal existe una clave candidata compuesta `(id_condominio, no_recibo)`. `nombre_condominio` y `direccion_condominio` dependen solamente de `id_condominio`, una parte propia de esa clave compuesta:

```text
id_condominio → nombre_condominio, direccion_condominio
```

Esta dependencia parcial motiva separar `condominio`. El identificador artificial `id_recibo` es otra clave candidata de un solo atributo; sin embargo, la existencia de esa clave no elimina la dependencia parcial respecto de la clave candidata compuesta.

**Tercera forma normal (3FN).** Una vez separada la información del condominio, quedan dependencias transitivas desde la clave de recibo:

```text
id_recibo → id_departamento → id_edificio, numero_departamento
id_recibo → id_edificio → id_condominio, nombre_edificio
id_recibo → id_inquilino → datos del inquilino
id_recibo → id_administrador → datos del administrador
id_recibo → id_concepto → descripcion_concepto
```

Se extraen las relaciones determinadas por cada identificador. El resultado relevante, alineado con `database/neon-schema.sql`, es:

```text
Condominio(id_condominio, nombre_condominio, direccion_condominio)
Edificio(id_edificio, id_condominio, nombre_edificio)
Departamento(id_departamento, id_edificio, numero_departamento)
Inquilino(id_inquilino, id_departamento, nombre, apellidos, correo)
Administrador(id_administrador, nombre, apellidos, correo, contraseña)
ConceptoPago(id_concepto, descripcion_concepto)
CuotaOrdinaria(id_ordinaria, monto_ordinaria, descripcion_ordinaria)
CuotaExtraordinaria(id_extraordinaria, monto_extraordinaria, descripcion_extraordinaria)
CuotaPenalizacion(id_penalizacion, monto_penalizacion, descripcion_penalizacion)
CuotaReserva(id_reserva, monto_reserva, descripcion_reserva)
Adeudos(id_adeudos, monto_adeudos, descripcion_adeudos)
TotalPagado(id_total, ids_componentes, monto_total)
Recibo(id_recibo, no_recibo, id_condominio, id_departamento, id_inquilino,
       fecha, estado_pago, fecha_pago, ids_de_concepto_y_cuotas,
       id_total, id_administrador, pdf_storage_key)
```

La descomposición conserva las dependencias descritas y es sin pérdida bajo las claves declaradas: al unir una relación hija con su padre por la clave foránea, el valor de la clave del padre determina una sola fila. No se copian nombres, correos o descripciones a cada recibo.

### 2.4 Comprobación de FNBC

Una relación está en FNBC si, para toda dependencia funcional no trivial `X → Y`, `X` es una superclave.

Con las dependencias y restricciones declaradas:

- En `Condominio`, los determinantes no triviales son `id_condominio` y `nombre_condominio`; ambos son claves.
- En `Edificio`, los determinantes son `id_edificio` y `(id_condominio, nombre_edificio)`; ambos son claves.
- En `Departamento`, los determinantes son `id_departamento` y `(id_edificio, numero_departamento)`; ambos son claves.
- En `Administrador`, `id_administrador` y `correo_administrador` son claves.
- En tablas de conceptos, cuotas, adeudos y total, el identificador de cada fila es el determinante declarado.
- En `Recibo`, `id_recibo` y `(id_condominio, no_recibo)` son claves; las referencias individuales marcadas `UNIQUE NOT NULL` son también claves en el esquema actual.

Por ello, con este conjunto de dependencias, las relaciones quedan en FNBC y, por consecuencia, también en 3FN. La comprobación no inventa dependencias como `descripcion_concepto → id_concepto`, que el esquema no garantiza.

> Nota de alcance: `inquilino.id_departamento` admite `NULL`. En PostgreSQL, una restricción `UNIQUE` permite varias filas con `NULL`; por tanto, la restricción compuesta de identidad no garantiza una dependencia funcional ordinaria para inquilinos sin departamento asignado. El identificador `id_inquilino` sí sigue siendo clave.

## 3. Conjunto imaginario para RelaX

RelaX evalúa álgebra relacional sobre relaciones cargadas. El siguiente conjunto es pequeño y ficticio; usa nombres de columnas simples para facilitar las expresiones. Se puede cargar como un grupo de datos de RelaX o introducir sus relaciones en su editor de datos.

```text
Condominio = {id_condominio, nombre_condominio
  1, 'Alameda'
  2, 'Robles'
}

Departamento = {id_departamento, id_condominio, numero_departamento
  11, 1, '101'
  12, 1, '102'
  21, 2, '201'
  22, 2, '202'
}

Inquilino = {id_inquilino, id_departamento, nombre_inquilino, correo
  101, 11, 'Ana Ruiz', 'ana@example.test'
  102, 12, 'Luis Soto', 'luis@example.test'
  201, 21, 'Marta Leon', 'marta@example.test'
  202, 22, 'Omar Cruz', 'omar@example.test'
}

Recibo = {id_recibo, id_condominio, id_departamento, id_inquilino, no_recibo, fecha, estado_pago, total_pagar, concepto_pago
  501, 1, 11, 101, 'A-01', 2026-02-01, 'pagado', 1200, 'Renta'
  502, 1, 12, 102, 'A-02', 2026-02-03, 'pendiente', 1500, 'Renta'
  503, 1, 21, 201, 'A-03', 2026-02-04, 'pendiente', 300, 'Limpieza'
  504, 2, 22, 202, 'R-01', 2026-02-05, 'pendiente', 1800, 'Renta'
  505, 2, 22, 202, 'R-02', 2026-02-07, 'pagado', 200, 'Limpieza'
  506, 2, 22, 202, 'R-03', 2026-02-08, 'pagado', 100, 'Reserva'
  507, 2, 22, 202, 'R-04', 2026-02-09, 'pagado', 1000, 'Renta'
}

Requeridos = {concepto_pago
  'Renta'
  'Limpieza'
}
```



Las expresiones siguientes usan la sintaxis textual de RelaX (`sigma`, `pi`, `union`, `intersect`, `except`, `x`, `join`, `gamma` y `/`). En el resultado matemático de las operaciones de conjuntos, las filas duplicadas se eliminan.

## 4. Ejercicios de álgebra relacional y SQL

### 4.1 Selección

**Enunciado:** obtener los recibos pendientes.

```text
RelaX:
sigma estado_pago = 'pendiente' Recibo

SQL:
SELECT *
FROM Recibo
WHERE estado_pago = 'pendiente';
```

Resultado : `A-02`, `A-03` y `R-01` (3 filas).

### 4.2 Proyección

**Enunciado:** listar sin duplicados los inquilinos que aparecen en recibos pendientes.

```text
RelaX:
pi id_inquilino (sigma estado_pago = 'pendiente' Recibo)

SQL:
SELECT DISTINCT id_inquilino
FROM Recibo
WHERE estado_pago = 'pendiente';
```

Resultado : `{102, 201, 202}`.

### 4.3 Unión, intersección y diferencia

Primero definimos las relaciones auxiliares de inquilinos con recibos pagados y pendientes:

```text
Pagados = pi id_inquilino (sigma estado_pago = 'pagado' Recibo)
Pendientes = pi id_inquilino (sigma estado_pago = 'pendiente' Recibo)
```

Ambas relaciones tienen el mismo esquema (`id_inquilino`), requisito para las operaciones de conjuntos.

**Unión:** inquilinos que tienen recibos pagados o pendientes.

```text
Pagados union Pendientes
```

```sql
SELECT id_inquilino FROM Recibo WHERE estado_pago = 'pagado'
UNION
SELECT id_inquilino FROM Recibo WHERE estado_pago = 'pendiente';
```

Resultado: `{101, 102, 201, 202}`.

**Intersección:** inquilinos con al menos un recibo pagado y otro pendiente.

```text
Pagados intersect Pendientes
```

```sql
SELECT id_inquilino FROM Recibo WHERE estado_pago = 'pagado'
INTERSECT
SELECT id_inquilino FROM Recibo WHERE estado_pago = 'pendiente';
```

Resultado: `{202}`.

**Diferencia:** inquilinos que tienen pagos, pero no tienen recibos pendientes.

```text
Pagados except Pendientes
```

```sql
SELECT id_inquilino FROM Recibo WHERE estado_pago = 'pagado'
EXCEPT
SELECT id_inquilino FROM Recibo WHERE estado_pago = 'pendiente';
```

Resultado: `{101}`.

### 4.4 Producto cartesiano

**Enunciado:** formar todos los pares posibles entre condominios y conceptos registrados en los recibos.

```text
Conceptos = pi concepto_pago Recibo
Condominio x Conceptos
```

```sql
WITH Conceptos AS (
  SELECT DISTINCT concepto_pago
  FROM Recibo
)
SELECT c.id_condominio, c.nombre_condominio, p.concepto_pago
FROM Condominio AS c
CROSS JOIN Conceptos AS p;
```

Hay `2 × 3 = 6` filas: dos condominios y tres conceptos (`Renta`, `Limpieza`, `Reserva`).

### 4.5 Reuniones (joins)

**Enunciado:** asociar cada recibo con el nombre de su condominio e inquilino.

```text
RelaX (reunión natural por id_condominio e id_inquilino):
Condominio natural join Recibo natural join Inquilino
```

```sql
SELECT c.nombre_condominio, i.nombre_inquilino, r.no_recibo, r.estado_pago
FROM Recibo AS r
JOIN Condominio AS c ON c.id_condominio = r.id_condominio
JOIN Inquilino AS i ON i.id_inquilino = r.id_inquilino;
```

La reunión natural en RelaX empareja atributos con el mismo nombre. En SQL se escriben explícitamente las condiciones `ON`, que hacen más visible qué claves se usan.

También se puede expresar una reunión theta en RelaX como:

```text
Condominio join Condominio.id_condominio = Recibo.id_condominio Recibo
```

### 4.6 Agrupación

**Enunciado:** calcular por condominio la cantidad y el importe total de recibos pendientes.

```text
RelaX:
gamma id_condominio ; cantidad <- count(id_recibo), monto <- sum(total_pagar)
  (sigma estado_pago = 'pendiente' Recibo)

SQL:
SELECT id_condominio,
       COUNT(id_recibo) AS cantidad,
       SUM(total_pagar) AS monto
FROM Recibo
WHERE estado_pago = 'pendiente'
GROUP BY id_condominio;
```

Resultado :

| id_condominio | cantidad | monto |
|---:|---:|---:|
| 1 | 2 | 1800 |
| 2 | 1 | 1800 |

### 4.7 División

**Enunciado:** encontrar inquilinos que ya pagaron todos los conceptos requeridos (`Renta` y `Limpieza`).

```text
PagadoConcepto =
  pi id_inquilino, concepto_pago
    (sigma estado_pago = 'pagado' Recibo)

PagadoConcepto / Requeridos
```

El divisor `Requeridos` solo contiene `concepto_pago`. El resultado contiene el atributo restante `id_inquilino`.

```sql
WITH Requeridos(concepto_pago) AS (
  VALUES ('Renta'), ('Limpieza')
)
SELECT DISTINCT p.id_inquilino
FROM Recibo AS p
WHERE p.estado_pago = 'pagado'
  AND NOT EXISTS (
    SELECT 1
    FROM Requeridos AS req
    WHERE NOT EXISTS (
      SELECT 1
      FROM Recibo AS p2
      WHERE p2.id_inquilino = p.id_inquilino
        AND p2.estado_pago = 'pagado'
        AND p2.concepto_pago = req.concepto_pago
    )
  );
```

Resultado esperado: `{202}`. El inquilino 202 tiene pagos de `Renta` y `Limpieza`; los demás no satisfacen ambos requisitos.

## 5. Consulta representativa: recibos pendientes de Alameda

La consulta combina selección, reuniones y proyección.

### Expresión en RelaX

```text
pi nombre_inquilino, correo, no_recibo, total_pagar
  (sigma nombre_condominio = 'Alameda' and estado_pago = 'pendiente'
    (Condominio natural join Recibo natural join Inquilino))
```

### SQL equivalente

```sql
SELECT i.nombre_inquilino,
       i.correo,
       r.no_recibo,
       r.total_pagar
FROM Recibo AS r
JOIN Condominio AS c
  ON c.id_condominio = r.id_condominio
JOIN Inquilino AS i
  ON i.id_inquilino = r.id_inquilino
WHERE c.nombre_condominio = 'Alameda'
  AND r.estado_pago = 'pendiente';
```

### Comparación de resultados

Con el conjunto de datos de la sección 3, ambas expresiones deben producir las mismas dos tuplas (el orden no está garantizado):

| nombre_inquilino | correo | no_recibo | total_pagar |
|---|---|---|---:|
| Luis Soto | luis@example.test | A-02 | 1500 |
| Marta Leon | marta@example.test | A-03 | 300 |

La selección limita las filas a Alameda y estado pendiente; las reuniones recuperan el nombre del condominio y los datos del inquilino; la proyección conserva solo las cuatro columnas solicitadas. Si RelaX y SQL usan exactamente las relaciones de ejemplo, sus resultados deben coincidir en valores y número de filas.

## 6. Cómo ejecutar la base de datos para esta práctica

La práctica puede ejecutarse de dos maneras. La opción usada por el proyecto
en producción es Neon; Docker solo se recomienda para reproducir el esquema en
una computadora local sin crear recursos en la nube.

### 6.1 Ejecución real del proyecto en Neon

Neon proporciona PostgreSQL administrado. En este proyecto la base no corre
dentro de un contenedor creado manualmente en Windows; Neon ejecuta PostgreSQL
en su infraestructura y expone una URL de conexión.

Los pasos seguidos fueron:

1. Instalar la CLI desde PowerShell:

   ```powershell
   npm i -g neon@latest
   neon --version
   ```

2. Iniciar sesión si Neon lo solicita:

   ```powershell
   neon login
   ```

3. Vincular el proyecto y la rama `production`:

   ```powershell
   neon init -y --org-id org-fragrant-leaf-08009098 --project-id quiet-salad-56681958 --branch production --services postgres,auth,ai-gateway,object-storage,functions,realtime
   ```

4. Crear o actualizar los recursos declarados:

   ```powershell
   neon deploy
   ```

5. Confirmar que `DATABASE_URL` quedó disponible en `.env.local` o en el
   entorno del sistema. No compartir ni subir esta URL.

6. Desde la raíz, instalar dependencias y aplicar el esquema:

   ```powershell
   npm ci
   npm --prefix back ci
   npm --prefix back run db:migrate
   ```

7. El migrador lee `database/neon-schema.sql`, abre una transacción y crea las
   tablas si no existen. El esquema puede aplicarse otra vez sin eliminar
   datos.

8. Iniciar el backend y comprobar Neon:

   ```powershell
   npm --prefix back start
   ```

   En otra terminal abre:

   ```text
   http://localhost:4001/healthz
   ```

   Resultado esperado:

   ```json
   {"status":"ok","database":"connected"}
   ```

9. Para producción, colocar `DATABASE_URL` en Render junto con
   `AUTH_JWT_SECRET`, `FRONTEND_URL`, `RESEND_API_KEY` y `RESEND_FROM`.
   Render ejecuta el backend y Vercel ejecuta el frontend.

### 6.2 Ejecutar un contenedor PostgreSQL local con Docker

Esta opción no reemplaza Neon; sirve para practicar con una base local o
probar `database/neon-schema.sql` sin conectarse a la nube. Se ejecuta en
Docker Desktop sobre Windows y el contenedor usa PostgreSQL Linux.

Ejemplo desde PowerShell:

```powershell
docker run --name bureau-postgres `
  -e POSTGRES_DB=bureau-manager `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=cambia-esta-clave `
  -p 5432:5432 `
  -d postgres:16
```

Configura una URL local en `back/.env`:

```text
DATABASE_URL=postgresql://postgres:cambia-esta-clave@localhost:5432/bureau-manager
PORT=4001
FRONTEND_URL=http://localhost:3000
AUTH_JWT_SECRET=<cadena-secreta-de-al-menos-32-caracteres>
RESEND_API_KEY=
RESEND_FROM=Bureau Manager <no-reply@tudominio-verificado.com>
```

Aplica el esquema:

```powershell
npm --prefix back run db:migrate
npm start
```

Comandos útiles:

```powershell
docker ps
docker logs bureau-postgres
docker start bureau-postgres
docker stop bureau-postgres
docker rm bureau-postgres
```

`docker rm` elimina el contenedor, pero no elimina por sí mismo una base con
volumen persistente. Para conservar datos locales, crea un volumen:

```powershell
docker volume create bureau-postgres-data
docker run --name bureau-postgres `
  -e POSTGRES_DB=bureau-manager `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=cambia-esta-clave `
  -p 5432:5432 `
  -v bureau-postgres-data:/var/lib/postgresql/data `
  -d postgres:16
```

No uses el contenedor local ni Neon como si fueran datos compartidos: para
trabajar en otro equipo, cada usuario debe iniciar su contenedor y ejecutar el
migrador; para compartir datos reales, conserva Neon como base central.

### 6.3 Dónde corre cada parte

| Parte | Sistema de ejecución | URL o puerto |
|---|---|---|
| Base Neon | Servicio administrado en la nube | Acceso mediante `DATABASE_URL` |
| Backend Express local | Node.js en Windows | `http://localhost:4001` |
| Frontend local | React Scripts en Windows | `http://localhost:3000` |
| Backend en producción | Render, Linux administrado | `https://condominios-urs.onrender.com` |
| Frontend en producción | Vercel | `https://proyecto-condominios-g2jf.vercel.app` |
| PostgreSQL Docker opcional | Contenedor Linux dentro de Docker Desktop | `localhost:5432` |
| RelaX | Navegador | <https://dbis-uibk.github.io/relax/> |

## 7. Referencias

- Esquema PostgreSQL del proyecto: `database/neon-schema.sql`.
- RelaX, calculadora de álgebra relacional: <https://dbis-uibk.github.io/relax/>.
- Formato de grupos y relaciones de RelaX: <https://github.com/dbis-uibk/relax#features>.
