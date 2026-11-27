# Bureau Manager

Bureau Manager es una aplicacion web para administrar condominios, edificios,
departamentos, inquilinos y recibos de pago. Incluye autenticacion propia,
recuperacion de contrasena, carga privada de PDF, actualizacion en vivo y
asistente de IA.

## Arquitectura desplegada

| Componente | Servicio usado | Ejemplo |
|---|---|---|
| Base de datos PostgreSQL | Neon | Rama `production` |
| Backend Express y API | Render | `https://condominios-urs.onrender.com` |
| Frontend React | Vercel | `https://proyecto-condominios-g2jf.vercel.app` |
| Correos transaccionales | Resend | Recibos y restablecimiento de contrasena |
| Archivos PDF privados | Neon Object Storage | Bucket privado `receipts` |
| Datos de recibos en vivo | Neon Realtime | Consulta sellada |
| Documentacion SQL y normalizacion | [practicanomal.md](./practicanomal.md) | Ejercicios en RelaX y SQL |

El frontend de Vercel comunica con el backend de Render. El backend usa Neon
PostgreSQL mediante `DATABASE_URL`, no la API publica del navegador.

## Tecnologias

- React 18 y React Scripts.
- Node.js y Express.
- PostgreSQL con `pg`.
- Neon: PostgreSQL, Object Storage, Realtime e IA.
- Resend para correos por HTTPS.
- JWT y contrasenas con `scrypt`.
- PDF-Lib para generar recibos PDF.

## Base de datos Neon

La base principal corre en Neon y la estructura se declara en
`database/neon-schema.sql`. El archivo `neon.ts` declara los servicios y los
buckets usados por el proyecto.

No es necesario instalar PostgreSQL localmente para usar la infraestructura
actual. Neon proporciona el servidor PostgreSQL administrado. Solo se requiere
la URL de conexion de la rama `production`.

### Vincular el proyecto

Desde la raiz del proyecto:

```powershell
npm i -g neon@latest
neon --version
neon init -y --org-id org-fragrant-leaf-08009098 --project-id quiet-salad-56681958 --branch production --services postgres,auth,ai-gateway,object-storage,functions,realtime
neon deploy
```

Si el proceso requiere iniciar sesion:

```powershell
neon login
```

Completa el inicio de sesion en el navegador y vuelve a ejecutar
`neon init` o `neon deploy`.

`neon init` crea `.neon/` y `neon deploy` obtiene las variables de Neon.
`.env.local` y `.neon/` estan ignorados por Git.

### Aplicar el esquema

Instala las dependencias y aplica el esquema idempotente:

```powershell
npm ci
Push-Location back
npm ci
npm run db:migrate
Pop-Location
```

El comando lee `DATABASE_URL` desde el entorno, `.env.local` de la raiz o
`back/.env`. Ejecuta `database/neon-schema.sql` dentro de una transaccion.
Puede repetirse sin eliminar los datos existentes.

Puedes comprobar la conexion desde la API con:

```text
https://condominios-urs.onrender.com/healthz
```

Respuesta esperada:

```json
{"status":"ok","database":"connected"}
```

### Tabla de variables locales

Coloca las variables secretas en `.env.local` o `back/.env`. No las publiques en
GitHub.

La raiz `.env.local` se puede obtener con Neon:

```text
DATABASE_URL=postgresql://...
```

Para `back/.env`, usa como minimo:

```text
PORT=4001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
AUTH_JWT_SECRET=<cadena-secreta-de-al-menos-32-caracteres>
RESEND_API_KEY=<clave-secreta-de-Resend>
RESEND_FROM=Bureau Manager <no-reply@tudominio-verificado.com>
```

Valores de Neon adicionales que se obtienen segun los servicios declarados:

```text
NEON_REALTIME_URL
NEON_REALTIME_SECRET
NEON_AI_GATEWAY_BASE_URL
NEON_AI_GATEWAY_TOKEN
NEON_AI_MODEL
S3_ENDPOINT
S3_REGION
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
```

`back/.env.example` contiene una plantilla sin secretos.

## Ejecutar el sistema localmente

Requisitos:

- Node.js 18 o 24.
- Una cuenta Neon y `DATABASE_URL`.
- Cuenta de Google solo si vas a crear otro remitente SMTP; el despliegue
  actual usa Resend.
- Una cuenta Resend si vas a probar el envio de correos.

Instala las dependencias:

```powershell
npm ci
npm --prefix back ci
```

Aplica la base:

```powershell
npm --prefix back run db:migrate
```

Inicia frontend y backend con un solo comando:

```powershell
npm start
```

El launcher `scripts/start.js` inicia:

- React en `http://localhost:3000`.
- Express en `http://localhost:4001`.
- `FRONTEND_URL` local como `http://localhost:3000`.
- `REACT_APP_API_URL` local como `http://localhost:4001`.

Para iniciar los procesos por separado:

```powershell
npm --prefix back start
npm run client
```

Detener los procesos:

```powershell
Ctrl+C
```

Antes de usar recibos, registra al menos una cuenta administradora desde la
interfaz. Crear recibos exige un administrador existente.

## Desplegar la base en Neon

El despliegue de base usado por el proyecto sigue este orden:

1. Crear o seleccionar el proyecto Neon.
2. Vincular el proyecto y la rama `production`.
3. Declarar los servicios en `neon.ts`.
4. Ejecutar `neon deploy`.
5. Copiar `DATABASE_URL` a Render.
6. Ejecutar `npm run db:migrate` contra el entorno real.
7. Comprobar `/healthz`.

Neon no debe recibir directamente las peticiones del navegador. El frontend
llama al backend de Render y el backend consulta Neon.

## Desplegar el backend en Render

Render aloja Express, no React.

Configuracion usada:

```text
Root Directory: back
Runtime: Node
Build Command: npm ci
Start Command: npm start
Branch: main
```

Variables de entorno obligatorias:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL pooled o de conexion directa de Neon |
| `AUTH_JWT_SECRET` | Cadena aleatoria de al menos 32 caracteres |
| `FRONTEND_URL` | URL exacta de Vercel, sin barra final |
| `PORT` | Usa el puerto que Render inyecta; no fijarlo manualmente |
| `RESEND_API_KEY` | Clave secreta de envio de Resend |
| `RESEND_FROM` | `Bureau Manager <no-reply@dominio-verificado.com>` |

Variables adicionales si se usan los servicios Neon:

```text
NEON_REALTIME_URL
NEON_REALTIME_SECRET
NEON_AI_GATEWAY_BASE_URL
NEON_AI_GATEWAY_TOKEN
NEON_AI_MODEL
S3_ENDPOINT
S3_REGION
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
```

Ejemplo:

```text
FRONTEND_URL=https://proyecto-condominios-g2jf.vercel.app
```

Despues de guardar las variables, crea un deploy. Comprueba:

```text
GET https://condominios-urs.onrender.com/healthz
```

La raiz de Render devuelve `Cannot GET /` si se abre en el navegador. Esto es
normal: Render sirve la API y no necesita presentar una pagina React.

## Desplegar el frontend en Vercel

Vercel aloja React.

Configuracion recomendada:

```text
Framework Preset: Create React App
Root Directory: /
Build Command: npm run build
Output Directory: build
Install Command: npm ci
```

Variable del frontend:

```text
REACT_APP_API_URL=https://condominios-urs.onrender.com
```

No pongas esa variable en el backend de Render. En CRA se incorpora al
JavaScript durante `npm run build`.

Despues de cambiarla, vuelve a desplegar Vercel. La URL desplegada puede
configurar el CORS mediante `FRONTEND_URL` en Render.

## Configurar correos con Resend

El proyecto ya usa Resend por HTTPS. SMTP no es necesario ni funciona en el plan
Free de Render para los puertos 465/587.

1. Entra a <https://resend.com/domains>.
2. Pulsa **Add Domain** y agrega el dominio o subdominio verificado.
3. Copia los registros DKIM, SPF y DMARC que muestra Resend.
4. Agrega los registros en el DNS administrado por Cloudflare u otro proveedor.
5. Deja los registros CNAME de correo sin proxy cuando el proveedor lo permita.
   En Cloudflare corresponde a **DNS only**, no a la nube naranja.
6. Espera a que Resend muestre **Verified** en DKIM y SPF.
7. Crea una clave en <https://resend.com/api-keys> con permiso
   **Sending access**.
8. En Render agrega:

```text
RESEND_API_KEY=<clave-nueva>
RESEND_FROM=Bureau Manager <no-reply@condommanagerbureau.online>
```

El remitente debe pertenecer al dominio ya verificado. No uses una direccion
Gmail como `RESEND_FROM`. Las claves expuestas deben revocarse y reemplazarse.

No es necesario configurar estas variables en Vercel.

## Seguridad antes de publicar

No se deben versionar:

```text
.env.local
back/.env
.neon/
node_modules/
build/
```

El repositorio incluye plantillas sin secretos:

```text
back/.env.example
```

Siempre revoca una clave o contrasena que haya aparecido en una captura,
terminal, log o chat.

## Verificacion

Ejecuta localmente:

```powershell
npm run build
node --check back/conexionDataBase.js
npm start
```

Prueba estas rutas:

```text
http://localhost:4001/healthz
http://localhost:3000
```

Prueba en produccion:

1. Login con una cuenta administradora registrada.
2. Crear condominio, edificio, departamento e inquilino.
3. Crear un recibo.
4. Descargar el PDF individual.
5. Descargar el PDF masivo.
6. Enviar un recibo por correo.
7. Solicitar restablecimiento de contrasena.
8. Verificar que el PDF adjunto abre correctamente.

## Solucion rapida de problemas

### El frontend no se comunica con la API

- Revisa `REACT_APP_API_URL` en Vercel.
- Revisa `FRONTEND_URL` en Render.
- Ambos valores deben representar el origen exacto, sin espacios ni barra final.
- Revisa que el backend este desplegado y que `/healthz` responda.

### React muestra una pagina en blanco

- Abre DevTools y revisa la consola.
- Vuelve a desplegar Vercel despues de cambiar variables o corregir el codigo.
- La vista de recibos normaliza fechas que pueden llegar como texto o `Date`.

### Resend rechaza el correo

- Confirma que el dominio aparezca como Verified.
- Confirma que `RESEND_FROM` use ese dominio.
- Cambia la clave si una clave anterior fue expuesta.
- Revisa el log de Render y los logs de Resend.

### No se puede conectar a Neon

- Confirma `DATABASE_URL` en Render.
- Ejecuta `npm --prefix back run db:migrate`.
- Comprueba `/healthz`.
- No uses credenciales MySQL antiguas con el esquema Neon.

## Scripts disponibles

Desde la raiz:

```text
npm start             Inicia frontend y backend localmente
npm run client        Inicia solo React
npm run server        Inicia solo Express
npm run build         Compila React para produccion
npm test              Ejecuta las pruebas de React
```

Desde `back/`:

```text
npm start             Inicia Express
npm run db:migrate    Aplica database/neon-schema.sql a Neon
```
