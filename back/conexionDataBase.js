const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const app = express();
const scrypt = promisify(crypto.scrypt);
const { connection, database } = require('./neonDatabase');
const { getReceiptPdf, saveReceiptPdf } = require('./storage');
const { createRealtime, rawSql } = require('@neon/realtime/server');
const jwtSecret = process.env.AUTH_JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('AUTH_JWT_SECRET must contain at least 32 characters and remain server-side.');
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uniqueConstraintMessages = {
  uq_administrador_correo: 'Ya existe una cuenta con ese correo electrónico.',
  uq_condominio_nombre: 'Ya existe un condominio con ese nombre.',
  uq_edificio_condominio_nombre: 'Ya existe un edificio con ese nombre en el condominio seleccionado.',
  uq_edificio_nombre_condominio: 'Ya existe un edificio con ese nombre en el condominio seleccionado.',
  uq_departamento_edificio_numero: 'Ya existe ese número de departamento en el edificio seleccionado.',
  uq_departamento_numero_edificio: 'Ya existe ese número de departamento en el edificio seleccionado.',
  uq_recibo_condominio_numero: 'Ya existe ese número de recibo en el condominio seleccionado.',
};

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
  if (!storedPassword.startsWith('scrypt$')) {
    const provided = Buffer.from(password, 'utf8');
    const stored = Buffer.from(storedPassword, 'utf8');
    return provided.length === stored.length && crypto.timingSafeEqual(provided, stored);
  }

  const [, saltHex, hashHex, ...extra] = storedPassword.split('$');
  if (
    extra.length ||
    !/^[a-f0-9]{32}$/i.test(saltHex || '') ||
    !/^[a-f0-9]{128}$/i.test(hashHex || '')
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createMailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

function respondWithDatabaseError(res, error, message) {
  console.error(message, error);
  if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
    const constraintMessage = Object.entries(uniqueConstraintMessages)
      .find(([constraint]) => error.constraint === constraint || error.message.includes(constraint));
    if (constraintMessage) {
      return res.status(409).json({ error: constraintMessage[1] });
    }
    return res.status(409).json({ error: 'El registro ya existe y debe ser único.' });
  }
  if (error.code === '23514' || error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({ error: 'Los datos no cumplen las reglas de validación del sistema.' });
  }
  if (error.code === '23503' || error.code === '23502') {
    return res.status(400).json({ error: 'Los datos hacen referencia a un registro que no existe o incumplen un campo obligatorio.' });
  }
  return res.status(500).json({ error: message });
}

function isDuplicateEntry(error) {
  return error.code === '23505' || error.code === 'ER_DUP_ENTRY';
}

function isValidEmail(value) {
  return emailPattern.test(String(value || '').trim());
}

function exceedsColumnLength(value, maxLength) {
  return String(value || '').length > maxLength;
}

async function tenantIdentityExists(departmentId, tenant, excludedTenantId = null) {
  const values = [
    departmentId,
    String(tenant.nombre_inquilino).trim(),
    String(tenant.apellino_paterno_inquilino).trim(),
    String(tenant.apellino_materno_inquilino).trim(),
    String(tenant.correo_inquilino).trim(),
  ];
  const exclusion = excludedTenantId ? ' AND id_inquilino <> ?' : '';
  if (excludedTenantId) values.push(excludedTenantId);

  const [matches] = await database.query(
    `SELECT id_inquilino FROM inquilino
     WHERE id_departamento = ? AND nombre_inquilino = ?
       AND apellino_paterno_inquilino = ? AND apellino_materno_inquilino = ?
       AND correo_inquilino = ?${exclusion}
     LIMIT 1`,
    values
  );
  return matches.length > 0;
}

connection.getConnection((error, dbConnection) => {
  if (error) {
    console.error('No se pudo conectar a Neon PostgreSQL:', error.message);
    return;
  }

  dbConnection.release();
  console.log('Conexión a Neon PostgreSQL establecida');
});

// Configurar body-parser para manejar solicitudes POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const publicApiRoutes = new Set([
  'POST /registrarCuenta',
  'POST /getAdmin',
  'POST /solicitarRestablecimiento',
  'POST /restablecerContrasena',
]);

app.use('/api', (req, res, next) => {
  if (publicApiRoutes.has(`${req.method} ${req.path}`)) return next();

  const match = /^Bearer\s+(.+)$/i.exec(req.get('Authorization') || '');
  if (!match) return res.status(401).json({ error: 'Inicia sesión para continuar.' });

  try {
    const payload = jwt.verify(match[1], jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'bureau-manager',
      audience: 'bureau-manager-web',
    });
    const administratorId = Number(payload.sub);
    if (!Number.isSafeInteger(administratorId) || administratorId < 1) {
      return res.status(401).json({ error: 'La sesión no es válida. Inicia sesión de nuevo.' });
    }
    req.authAdminId = administratorId;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'La sesión venció o no es válida. Inicia sesión de nuevo.' });
  }
});

const { crearPDF, crearPDFMultiple } = require('./reciboPdf');
const databaseName = decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1));
const realtime = process.env.NEON_REALTIME_SECRET
  ? createRealtime({ secret: process.env.NEON_REALTIME_SECRET, db: databaseName })
  : null;

// Endpoint para manejar solicitudes POST
//███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
app.post('/api/registrarCuenta', async (req, res) => {
  const {
    nombre_administrador,
    apellido_paterno_administrador,
    apellido_materno_administrador,
    correo_administrador,
    contraseña_administrador,
  } = req.body;

  const normalizedEmail = String(correo_administrador || '').trim();
  const password = String(contraseña_administrador || '');
  const normalizedName = String(nombre_administrador || '').trim();
  const normalizedPaternalSurname = String(apellido_paterno_administrador || '').trim();
  const normalizedMaternalSurname = String(apellido_materno_administrador || '').trim();
  if (!normalizedName || !normalizedPaternalSurname || !normalizedMaternalSurname) {
    return res.status(400).json({ error: 'El nombre y ambos apellidos son obligatorios.' });
  }
  if ([normalizedName, normalizedPaternalSurname, normalizedMaternalSurname].some(value => value.length > 30)) {
    return res.status(400).json({ error: 'El nombre y los apellidos no pueden superar 30 caracteres.' });
  }
  if (!isValidEmail(normalizedEmail) || normalizedEmail.length > 45) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  }

  try {
    await database.query(
      `INSERT INTO administrador
        (nombre_administrador, apellido_paterno_administrador, apellido_materno_administrador,
         correo_administrador, contraseña_administrador)
       VALUES (?, ?, ?, ?, ?)`,
      [normalizedName, normalizedPaternalSurname, normalizedMaternalSurname,
        normalizedEmail, await hashPassword(password)]
    );
    return res.json(200);
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al registrar la cuenta');
  }
});

app.post('/api/registrarDepartamento', async (req, res) => {
  const { id_edificio, numero_departamento } = req.body;
  if (!id_edificio || !String(numero_departamento || '').trim()) {
    return res.status(400).json({ error: 'Selecciona un edificio e indica el número de departamento.' });
  }
  if (exceedsColumnLength(numero_departamento, 10)) {
    return res.status(400).json({ error: 'El número de departamento no puede superar 10 caracteres.' });
  }

  try {
    await database.query(
      'INSERT INTO departamento (id_edificio, numero_departamento) VALUES (?, ?)',
      [id_edificio, String(numero_departamento).trim()]
    );
    return res.json(200);
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al registrar el departamento');
  }
});

app.post('/api/registrarCondominio', async (req, res) => {
  const { nombre_condominio, direccion_condominio } = req.body;
  if (!String(nombre_condominio || '').trim() || !String(direccion_condominio || '').trim()) {
    return res.status(400).json({ error: 'El nombre y la dirección del condominio son obligatorios.' });
  }
  if (exceedsColumnLength(nombre_condominio, 45) || exceedsColumnLength(direccion_condominio, 100)) {
    return res.status(400).json({ error: 'El nombre admite hasta 45 caracteres y la dirección hasta 100.' });
  }

  try {
    await database.query(
      'INSERT INTO condominio (nombre_condominio, direccion_condominio) VALUES (?, ?)',
      [String(nombre_condominio).trim(), String(direccion_condominio).trim()]
    );
    return res.json(200);
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al registrar el condominio');
  }
});

app.post('/api/registrarEdificio', async (req, res) => {
  const { id_condominio, nombre_edificio } = req.body;
  if (!id_condominio || !String(nombre_edificio || '').trim()) {
    return res.status(400).json({ error: 'Selecciona un condominio e indica el nombre del edificio.' });
  }
  if (exceedsColumnLength(nombre_edificio, 20)) {
    return res.status(400).json({ error: 'El nombre del edificio no puede superar 20 caracteres.' });
  }

  try {
    await database.query(
      'INSERT INTO edificio (id_condominio, nombre_edificio) VALUES (?, ?)',
      [id_condominio, String(nombre_edificio).trim()]
    );
    return res.json(200);
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al registrar el edificio');
  }
});

app.post('/api/registrarInquilino', async (req, res) => {
  const {
    id_departamento,
    nombre_inquilino,
    apellino_paterno_inquilino,
    apellino_materno_inquilino,
    correo_inquilino,
  } = req.body;
  if (
    !id_departamento ||
    !String(nombre_inquilino || '').trim() ||
    !String(apellino_paterno_inquilino || '').trim() ||
    !String(apellino_materno_inquilino || '').trim() ||
    !String(correo_inquilino || '').trim()
  ) {
    return res.status(400).json({ error: 'Completa todos los datos del inquilino y selecciona un departamento.' });
  }
  if (
    exceedsColumnLength(nombre_inquilino, 45) ||
    exceedsColumnLength(apellino_paterno_inquilino, 45) ||
    exceedsColumnLength(apellino_materno_inquilino, 45) ||
    exceedsColumnLength(correo_inquilino, 45)
  ) {
    return res.status(400).json({ error: 'Los datos del inquilino no pueden superar 45 caracteres cada uno.' });
  }
  if (!isValidEmail(correo_inquilino)) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido para el inquilino.' });
  }

  try {
    if (await tenantIdentityExists(id_departamento, req.body)) {
      return res.status(409).json({ error: 'Ya existe este inquilino en el departamento seleccionado.' });
    }
    await database.query(
      `INSERT INTO inquilino
        (id_departamento, nombre_inquilino, apellino_paterno_inquilino,
         apellino_materno_inquilino, correo_inquilino)
       VALUES (?, ?, ?, ?, ?)`,
      [id_departamento, String(nombre_inquilino).trim(), String(apellino_paterno_inquilino).trim(),
        String(apellino_materno_inquilino).trim(), String(correo_inquilino).trim()]
    );
    return res.json(200);
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return res.status(409).json({ error: 'Ya existe este inquilino en el departamento seleccionado.' });
    }
    return respondWithDatabaseError(res, error, 'Error al registrar el inquilino');
  }
});

const receiptSelect = `
  SELECT r.id_recibo, r.no_recibo, r.id_condominio, r.id_departamento, r.id_inquilino,
    r.estado_pago, r.fecha_pago,
    CONCAT_WS(' ', i.nombre_inquilino, i.apellino_paterno_inquilino, i.apellino_materno_inquilino)
      AS nombre_completo_inquilino,
    r.fecha, cp.descripcion_concepto AS concepto_pago,
    qo.monto_ordinaria AS cuota_ordinaria, qo.descripcion_ordinaria AS concepto_cuota_ordinaria,
    qp.monto_penalizacion AS cuota_penalizacion, qp.descripcion_penalizacion AS concepto_cuota_penalizacion,
    qe.monto_extraordinaria AS cuota_extraordinaria,
    qe.descrpicion_extraordinaria AS concepto_cuota_extraordinaria,
    qr.monto_reserva AS cuota_reserva, qr.descripcion_reserva AS concepto_cuota_reserva,
    qa.monto_adeudos AS cuota_adeudos, qa.descripcion_adeudos AS concepto_cuota_adeudos,
    tp.monto_total AS total_pagar, i.correo_inquilino, r.pdf_storage_key
  FROM recibo r
  JOIN inquilino i ON i.id_inquilino = r.id_inquilino
  JOIN \`concepto de pago\` cp ON cp.id_concepto = r.id_concepto
  JOIN \`cuota ordinaria\` qo ON qo.id_ordinaria = r.id_ordinaria
  JOIN \`cuota de penalización\` qp ON qp.id_penalizacion = r.id_penalizacion
  JOIN \`cuota extraordinaria\` qe ON qe.id_extraordinaria = r.id_extraordinaria
  JOIN \`cuota de fondo de reserva\` qr ON qr.id_reserva = r.id_reserva
  JOIN \`adeudos anteriores\` qa ON qa.id_adeudos = r.id_adeudos
  JOIN \`total pagado\` tp ON tp.id_total = r.id_total`;

app.post('/api/registrarRecibo', async (req, res) => {
  const {
    id_condominio,
    id_departamento,
    id_inquilino,
    no_recibo,
    fecha,
    concepto_pago,
    cuota_ordinaria,
    concepto_cuota_ordinaria,
    concepto_cuota_penalizacion,
    cuota_penalizacion,
    cuota_extraordinaria,
    concepto_cuota_extraordinaria,
    cuota_reserva,
    concepto_cuota_reserva,
    cuota_adeudos,
    concepto_cuota_adeudos,
  } = req.body;

  const amounts = [
    cuota_ordinaria,
    cuota_penalizacion,
    cuota_extraordinaria,
    cuota_reserva,
    cuota_adeudos,
  ].map(value => Number(value || 0));
  const receiptNumber = String(no_recibo || '').trim();
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (
    !id_condominio || !id_departamento || !id_inquilino ||
    !receiptNumber || !fecha || !String(concepto_pago || '').trim() ||
    amounts.some(value => !Number.isFinite(value) || value < 0) ||
    !Number.isFinite(total)
  ) {
    return res.status(400).json({ error: 'Completa los datos del recibo y verifica sus importes.' });
  }
  if (
    exceedsColumnLength(receiptNumber, 20) ||
    [
      concepto_pago,
      concepto_cuota_ordinaria,
      concepto_cuota_penalizacion,
      concepto_cuota_extraordinaria,
      concepto_cuota_reserva,
      concepto_cuota_adeudos,
    ].some(value => exceedsColumnLength(value, 45))
  ) {
    return res.status(400).json({ error: 'El número de recibo admite 20 caracteres; cada concepto admite 45.' });
  }

  let dbConnection;
  let transactionStarted = false;
  try {
    dbConnection = await database.getConnection();
    await dbConnection.beginTransaction();
    transactionStarted = true;

    const [matches] = await dbConnection.query(
      `SELECT d.id_departamento
       FROM departamento d
       JOIN edificio e ON e.id_edificio = d.id_edificio
       JOIN inquilino i ON i.id_departamento = d.id_departamento
       WHERE d.id_departamento = ? AND e.id_condominio = ? AND i.id_inquilino = ?`,
      [id_departamento, id_condominio, id_inquilino]
    );
    if (matches.length === 0) {
      await dbConnection.rollback();
      transactionStarted = false;
      return res.status(400).json({ error: 'El condominio, departamento e inquilino seleccionados no coinciden.' });
    }

    const [duplicateReceipts] = await dbConnection.query(
      'SELECT id_recibo FROM recibo WHERE id_condominio = ? AND no_recibo = ? LIMIT 1',
      [id_condominio, receiptNumber]
    );
    if (duplicateReceipts.length > 0) {
      await dbConnection.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: 'Ya existe ese número de recibo en el condominio seleccionado.' });
    }

    const [[administrator]] = await dbConnection.query(
      'SELECT id_administrador FROM administrador ORDER BY id_administrador LIMIT 1'
    );
    if (!administrator) {
      await dbConnection.rollback();
      transactionStarted = false;
      return res.status(400).json({ error: 'Registra una cuenta administradora antes de crear recibos.' });
    }

    const [ordinary] = await dbConnection.query(
      'INSERT INTO `cuota ordinaria` (monto_ordinaria, descripcion_ordinaria) VALUES (?, ?)',
      [amounts[0], concepto_cuota_ordinaria || '']
    );
    const [penalty] = await dbConnection.query(
      'INSERT INTO `cuota de penalización` (monto_penalizacion, descripcion_penalizacion) VALUES (?, ?)',
      [amounts[1], concepto_cuota_penalizacion || '']
    );
    const [extraordinary] = await dbConnection.query(
      'INSERT INTO `cuota extraordinaria` (monto_extraordinaria, descrpicion_extraordinaria) VALUES (?, ?)',
      [amounts[2], concepto_cuota_extraordinaria || '']
    );
    const [reserve] = await dbConnection.query(
      'INSERT INTO `cuota de fondo de reserva` (monto_reserva, descripcion_reserva) VALUES (?, ?)',
      [amounts[3], concepto_cuota_reserva || '']
    );
    const [arrears] = await dbConnection.query(
      'INSERT INTO `adeudos anteriores` (monto_adeudos, descripcion_adeudos) VALUES (?, ?)',
      [amounts[4], concepto_cuota_adeudos || '']
    );
    const [concept] = await dbConnection.query(
      'INSERT INTO `concepto de pago` (descripcion_concepto) VALUES (?)',
      [String(concepto_pago).trim()]
    );

    const [totalRow] = await dbConnection.query(
      `INSERT INTO \`total pagado\`
        (id_ordinaria, id_extraordinaria, id_penalizacion, id_reserva, id_adeudos, monto_total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ordinary.insertId, extraordinary.insertId, penalty.insertId, reserve.insertId, arrears.insertId, total]
    );
    await dbConnection.query(
      `INSERT INTO recibo
        (no_recibo, id_condominio, id_departamento, id_inquilino, fecha, id_concepto,
         id_ordinaria, id_extraordinaria, id_penalizacion, id_reserva, id_adeudos, id_total, id_administrador)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [receiptNumber, id_condominio, id_departamento, id_inquilino, fecha, concept.insertId,
        ordinary.insertId, extraordinary.insertId, penalty.insertId, reserve.insertId, arrears.insertId,
        totalRow.insertId, administrator.id_administrador]
    );

    await dbConnection.commit();
    transactionStarted = false;
    return res.json(200);
  } catch (error) {
    if (transactionStarted) {
      try {
        await dbConnection.rollback();
      } catch (rollbackError) {
        console.error('Error al revertir el registro del recibo', rollbackError);
      }
    }
    return respondWithDatabaseError(res, error, 'Error al registrar el recibo');
  } finally {
    if (dbConnection) dbConnection.release();
  }
});

app.post('/api/marcarReciboPagado', async (req, res) => {
  const { id_recibo } = req.body;
  if (!Number.isInteger(Number(id_recibo)) || Number(id_recibo) <= 0) {
    return res.status(400).json({ error: 'Selecciona un recibo válido.' });
  }

  try {
    const [result] = await database.query(
      `UPDATE recibo
       SET estado_pago = 'pagado', fecha_pago = CURRENT_TIMESTAMP
       WHERE id_recibo = ? AND estado_pago = 'pendiente' AND fecha <= CURRENT_DATE`,
      [id_recibo]
    );
    if (result.affectedRows === 0) {
      const [receipts] = await database.query(
        'SELECT estado_pago, fecha > CURRENT_DATE AS fecha_futura FROM recibo WHERE id_recibo = ?',
        [id_recibo]
      );
      if (receipts.length === 0) {
        return res.status(404).json({ error: 'No se encontró el recibo seleccionado.' });
      }
      if (receipts[0].estado_pago === 'pendiente' && receipts[0].fecha_futura) {
        return res.status(409).json({ error: 'No se puede marcar como pagado un recibo antes de su fecha de emisión.' });
      }
      return res.status(409).json({ error: 'Este recibo ya está marcado como pagado.' });
    }

    const [receipts] = await database.query(
      `SELECT estado_pago, TO_CHAR(fecha_pago, 'YYYY-MM-DD HH24:MI:SS') AS fecha_pago
       FROM recibo WHERE id_recibo = ?`,
      [id_recibo]
    );
    return res.json(receipts[0]);
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al marcar el recibo como pagado');
  }
});

app.post('/api/enviarRecibosCorreoElectronico', async (req, res) => {
  const ids = req.body;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return res.status(503).json({ error: 'Configura SMTP_HOST, SMTP_USER y SMTP_PASSWORD en back/.env para enviar correos.' });
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos un recibo.' });
  }

  let receipts;
  try {
    [receipts] = await database.query(
      `${receiptSelect} WHERE r.id_recibo IN (?) ORDER BY r.id_recibo`,
      [ids]
    );
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al consultar los recibos para enviar');
  }
  if (receipts.length !== new Set(ids).size) {
    return res.status(404).json({ error: 'No se encontraron todos los recibos seleccionados.' });
  }

  const invalidReceipt = receipts.find(receipt =>
    !receipt.correo_inquilino ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receipt.correo_inquilino.trim())
  );
  if (invalidReceipt) {
    return res.status(422).json({
      error: `El inquilino del recibo ${invalidReceipt.no_recibo} no tiene un correo válido registrado.`,
    });
  }

  let sentCount = 0;
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    await transporter.verify();

    for (const receipt of receipts) {
      const pdfBytes = await crearPDF(receipt);
      await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: receipt.correo_inquilino,
        subject: `Recibo de pago ${receipt.no_recibo}`,
        text: 'Adjuntamos su recibo de pago.',
        attachments: [{ filename: `recibo-${receipt.no_recibo}.pdf`, content: pdfBytes }],
      });
      sentCount += 1;
    }
    return res.json({ sent: sentCount });
  } catch (error) {
    console.error('Error al enviar los recibos por correo', error);
    if (sentCount > 0) {
      return res.status(502).json({
        error: `Se enviaron ${sentCount} de ${receipts.length} recibos. Falló el envío siguiente; revisa la configuración SMTP.`,
      });
    }
    if (error.code === 'EAUTH') {
      return res.status(502).json({
        error: 'Gmail rechazó la autenticación. Configura SMTP_USER con tu cuenta y SMTP_PASSWORD con una contraseña de aplicación de Google.',
      });
    }
    return res.status(502).json({
      error: 'No se pudo conectar con Gmail. Revisa SMTP_HOST, SMTP_PORT y la conexión a internet.',
    });
  }
});

app.post('/api/solicitarRestablecimiento', async (req, res) => {
  const email = String(req.body.correo_administrador || '').trim();
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }

  const transporter = createMailTransporter();
  if (!transporter) {
    return res.status(503).json({
      error: 'El envío de correo no está configurado. Contacta al administrador del sistema.',
    });
  }

  try {
    await transporter.verify();
  } catch (error) {
    console.error('No se pudo verificar el servicio de correo para restablecimiento:', error);
    return res.status(502).json({ error: 'No se pudo enviar el correo. Inténtalo más tarde.' });
  }

  let administrators;
  try {
    [administrators] = await database.query(
      `SELECT id_administrador, correo_administrador
       FROM administrador WHERE correo_administrador = ? LIMIT 1`,
      [email]
    );
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al buscar la cuenta para restablecimiento');
  }

  const genericResponse = {
    message: 'Si el correo está asociado a una cuenta, recibirás un enlace para restablecer la contraseña.',
  };
  if (administrators.length === 0) {
    return res.json(genericResponse);
  }

  const administrator = administrators[0];
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  try {
    await database.query(
      `INSERT INTO password_reset_tokens (id_administrador, token_hash, expires_at)
       VALUES (?, ?, CURRENT_TIMESTAMP + INTERVAL '1 hour')
       ON CONFLICT (id_administrador) DO UPDATE SET token_hash = EXCLUDED.token_hash,
         expires_at = EXCLUDED.expires_at, created_at = CURRENT_TIMESTAMP`,
      [administrator.id_administrador, tokenHash]
    );
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al crear el enlace de restablecimiento');
  }

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const resetUrl = `${frontendUrl}/RestablecerContrasena?token=${encodeURIComponent(token)}`;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: administrator.correo_administrador,
      subject: 'Restablece tu contraseña de Bureau-Manager',
      text: `Recibimos una solicitud para restablecer la contraseña de tu cuenta. Abre este enlace dentro de la próxima hora para elegir una nueva contraseña:\n\n${resetUrl}\n\nSi no solicitaste este cambio, puedes ignorar este correo.`,
    });
    return res.json(genericResponse);
  } catch (error) {
    console.error('Error al enviar el correo de restablecimiento:', error);
    try {
      await database.query(
        'DELETE FROM password_reset_tokens WHERE id_administrador = ? AND token_hash = ?',
        [administrator.id_administrador, tokenHash]
      );
    } catch (cleanupError) {
      console.error('No se pudo invalidar el enlace de restablecimiento no enviado:', cleanupError);
    }
    return res.status(502).json({ error: 'No se pudo enviar el correo. Inténtalo más tarde.' });
  }
});

app.post('/api/restablecerContrasena', async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.contraseña_administrador || '');
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ error: 'El enlace no es válido o ya venció. Solicita uno nuevo.' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  }

  let dbConnection;
  try {
    dbConnection = await database.getConnection();
    await dbConnection.beginTransaction();

    const [tokens] = await dbConnection.query(
      `SELECT id_administrador FROM password_reset_tokens
       WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP FOR UPDATE`,
      [hashResetToken(token)]
    );
    if (tokens.length === 0) {
      await dbConnection.rollback();
      return res.status(400).json({ error: 'El enlace no es válido o ya venció. Solicita uno nuevo.' });
    }

    await dbConnection.query(
      'UPDATE administrador SET contraseña_administrador = ? WHERE id_administrador = ?',
      [await hashPassword(password), tokens[0].id_administrador]
    );
    await dbConnection.query(
      'DELETE FROM password_reset_tokens WHERE id_administrador = ?',
      [tokens[0].id_administrador]
    );
    await dbConnection.commit();
    return res.json({ message: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.' });
  } catch (error) {
    if (dbConnection) {
      try {
        await dbConnection.rollback();
      } catch (rollbackError) {
        console.error('Error al revertir el restablecimiento de contraseña:', rollbackError);
      }
    }
    return respondWithDatabaseError(res, error, 'Error al restablecer la contraseña');
  } finally {
    if (dbConnection) dbConnection.release();
  }
});

app.post('/api/generarPDFMasivo', async (req, res) => {
  try {
    const lista = req.body;
    if (!Array.isArray(lista) || lista.length === 0) {
      return res.status(400).json({ error: 'Selecciona al menos un recibo.' });
    }

    const [receipts] = await database.query(
      `${receiptSelect} WHERE r.id_recibo IN (?) ORDER BY r.id_recibo`,
      [lista]
    );
    if (receipts.length !== new Set(lista).size) {
      return res.status(404).json({ error: 'No se encontraron todos los recibos seleccionados.' });
    }

    const pdfBytes = await crearPDFMultiple(receipts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="recibos.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al generar los recibos en PDF');
  }
});


//███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████

app.post('/api/actualizarCondominio', (req, res) => {
  const { id_condominio, nombre_condominio, direccion_condominio } = req.body;
  if (!id_condominio || !String(nombre_condominio || '').trim() || !String(direccion_condominio || '').trim()) {
    return res.status(400).json({ error: 'Selecciona un condominio y completa su nombre y dirección.' });
  }
  if (exceedsColumnLength(nombre_condominio, 45) || exceedsColumnLength(direccion_condominio, 100)) {
    return res.status(400).json({ error: 'El nombre admite hasta 45 caracteres y la dirección hasta 100.' });
  }
  database.query(
    'UPDATE condominio SET nombre_condominio = ?, direccion_condominio = ? WHERE id_condominio = ?',
    [nombre_condominio, direccion_condominio, id_condominio]
  ).then(() => res.json(200))
    .catch(error => respondWithDatabaseError(res, error, 'Error al actualizar el condominio'));
});

app.post('/api/actualizarEdificio', (req, res) => {
  const { id_edificio, nombre_edificio } = req.body;
  if (!id_edificio || !String(nombre_edificio || '').trim() || exceedsColumnLength(nombre_edificio, 20)) {
    return res.status(400).json({ error: 'Selecciona un edificio e indica un nombre de hasta 20 caracteres.' });
  }
  database.query(
    'UPDATE edificio SET nombre_edificio = ? WHERE id_edificio = ?',
    [nombre_edificio, id_edificio]
  ).then(() => res.json(200))
    .catch(error => respondWithDatabaseError(res, error, 'Error al actualizar el edificio'));
});

app.post('/api/actualizarDepartamento', (req, res) => {
  const { id_departamento, nombre_departamento } = req.body;
  if (!id_departamento || !String(nombre_departamento || '').trim() || exceedsColumnLength(nombre_departamento, 10)) {
    return res.status(400).json({ error: 'Selecciona un departamento e indica un número de hasta 10 caracteres.' });
  }
  database.query(
    'UPDATE departamento SET numero_departamento = ? WHERE id_departamento = ?',
    [nombre_departamento, id_departamento]
  ).then(() => res.json(200))
    .catch(error => respondWithDatabaseError(res, error, 'Error al actualizar el departamento'));
});

app.post('/api/actualizarInquilino', async (req, res) => {
  const {
    id_inquilino,
    nombre_inquilino,
    apellino_paterno_inquilino,
    apellino_materno_inquilino,
    correo_inquilino,
  } = req.body;
  if (
    !id_inquilino ||
    !String(nombre_inquilino || '').trim() ||
    !String(apellino_paterno_inquilino || '').trim() ||
    !String(apellino_materno_inquilino || '').trim() ||
    !String(correo_inquilino || '').trim() ||
    [
      nombre_inquilino,
      apellino_paterno_inquilino,
      apellino_materno_inquilino,
      correo_inquilino,
    ].some(value => exceedsColumnLength(value, 45))
  ) {
    return res.status(400).json({ error: 'Selecciona un inquilino y verifica que sus datos estén completos y no superen 45 caracteres.' });
  }
  if (!isValidEmail(correo_inquilino)) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido para el inquilino.' });
  }
  try {
    const [tenants] = await database.query(
      'SELECT id_departamento FROM inquilino WHERE id_inquilino = ?',
      [id_inquilino]
    );
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'No se encontró el inquilino seleccionado.' });
    }
    if (await tenantIdentityExists(tenants[0].id_departamento, req.body, id_inquilino)) {
      return res.status(409).json({ error: 'Ya existe este inquilino en el departamento seleccionado.' });
    }

    await database.query(
      `UPDATE inquilino SET nombre_inquilino = ?, apellino_paterno_inquilino = ?,
        apellino_materno_inquilino = ?, correo_inquilino = ? WHERE id_inquilino = ?`,
      [String(nombre_inquilino).trim(), String(apellino_paterno_inquilino).trim(),
        String(apellino_materno_inquilino).trim(), String(correo_inquilino).trim(), id_inquilino]
    );
    return res.json(200);
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return res.status(409).json({ error: 'Ya existe este inquilino en el departamento seleccionado.' });
    }
    return respondWithDatabaseError(res, error, 'Error al actualizar el inquilino');
  }
});

app.post('/api/liberarInquilino', async (req, res) => {
  const { id_inquilino } = req.body;
  if (!Number.isInteger(Number(id_inquilino)) || Number(id_inquilino) <= 0) {
    return res.status(400).json({ error: 'Selecciona un inquilino para liberar el departamento.' });
  }

  try {
    const [result] = await database.query(
      'UPDATE inquilino SET id_departamento = NULL WHERE id_inquilino = ? AND id_departamento IS NOT NULL',
      [id_inquilino]
    );
    if (result.affectedRows === 0) {
      const [tenants] = await database.query(
        'SELECT id_inquilino FROM inquilino WHERE id_inquilino = ?',
        [id_inquilino]
      );
      if (tenants.length === 0) {
        return res.status(404).json({ error: 'No se encontró el inquilino seleccionado.' });
      }
      return res.status(409).json({ error: 'Este inquilino ya no tiene un departamento asignado.' });
    }
    return res.json(200);
  } catch (error) {
    if (error.code === '23502' || error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(409).json({
        error: 'La base de datos todavía no permite liberar departamentos. Aplica la migración 004_allow_unassigned_tenants.sql.',
      });
    }
    return respondWithDatabaseError(res, error, 'Error al liberar el departamento');
  }
});

//███████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████

app.post('/api/getAdmin', async (req, res) => {
  const { correo_administrador, contraseña_administrador } = req.body;
  try {
    const [administrators] = await database.query(
      `SELECT id_administrador, contraseña_administrador
       FROM administrador WHERE correo_administrador = ? LIMIT 1`,
      [String(correo_administrador || '').trim()]
    );
    if (administrators.length === 0) {
      return res.json(0);
    }

    const administrator = administrators[0];
    if (!await verifyPassword(String(contraseña_administrador || ''), administrator.contraseña_administrador)) {
      return res.json(0);
    }

    if (!administrator.contraseña_administrador.startsWith('scrypt$')) {
      await database.query(
        'UPDATE administrador SET contraseña_administrador = ? WHERE id_administrador = ?',
        [await hashPassword(String(contraseña_administrador)), administrator.id_administrador]
      );
    }
    const token = jwt.sign(
      { sub: String(administrator.id_administrador) },
      jwtSecret,
      {
        algorithm: 'HS256',
        expiresIn: '8h',
        issuer: 'bureau-manager',
        audience: 'bureau-manager-web',
      }
    );
    return res.json({ token });
  } catch (error) {
    return respondWithDatabaseError(res, error, 'Error al validar la cuenta');
  }
});

app.get('/api/getRecibos', (req, res) => {
  connection.query(`${receiptSelect} ORDER BY r.fecha DESC, r.id_recibo DESC`, (error, results) => {
    if (error) {
      return respondWithDatabaseError(res, error, 'Error al obtener los recibos');
    } else {
      return res.json(results);
    }
  });
});

const liveReceiptQuery = rawSql(`
    SELECT r.id_recibo, r.no_recibo, r.id_condominio, r.id_departamento, r.id_inquilino,
      r.estado_pago, r.fecha_pago,
      CONCAT_WS(' ', i.nombre_inquilino, i.apellino_paterno_inquilino, i.apellino_materno_inquilino)
        AS nombre_completo_inquilino,
      r.fecha, cp.descripcion_concepto AS concepto_pago, tp.monto_total AS total_pagar
    FROM recibo r
    JOIN inquilino i ON i.id_inquilino = r.id_inquilino
    JOIN "concepto de pago" cp ON cp.id_concepto = r.id_concepto
    JOIN "total pagado" tp ON tp.id_total = r.id_total
    ORDER BY r.fecha DESC, r.id_recibo DESC
`);

app.post('/api/recibos/live', async (req, res) => {
  if (!realtime || !process.env.NEON_REALTIME_URL) {
    return res.status(503).json({ error: 'Neon Realtime no está configurado en esta rama.' });
  }
  try {
    const sealedQuery = await realtime.seal({ query: liveReceiptQuery });
    return res.json({ sealedQuery, realtimeUrl: process.env.NEON_REALTIME_URL });
  } catch (error) {
    console.error('No se pudo sellar la consulta de recibos en vivo:', error);
    return res.status(502).json({ error: 'No se pudo iniciar la actualización en vivo de recibos.' });
  }
});

app.get('/api/ai/models', async (req, res) => {
  const { NEON_AI_GATEWAY_BASE_URL, NEON_AI_GATEWAY_TOKEN } = process.env;
  if (!NEON_AI_GATEWAY_BASE_URL || !NEON_AI_GATEWAY_TOKEN) {
    return res.status(503).json({ error: 'El AI Gateway no está configurado en esta rama.' });
  }

  try {
    const response = await fetch(`${NEON_AI_GATEWAY_BASE_URL.replace(/\/+$/, '')}/v1/models`, {
      headers: { Authorization: `Bearer ${NEON_AI_GATEWAY_TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error('Neon AI Gateway model discovery failed:', response.status);
      return res.status(502).json({ error: 'No se pudo consultar la disponibilidad del AI Gateway.' });
    }

    const catalog = await response.json();
    const models = Array.isArray(catalog.data) ? catalog.data : [];
    const enabled = models.filter(model => model.enabled === true && typeof model.id === 'string');
    const unavailable = models.find(model => model.recovery_url);
    return res.json({
      models: enabled.map(({ id, name }) => ({ id, name: name || id })),
      recoveryUrl: unavailable?.recovery_url || null,
    });
  } catch (error) {
    console.error('Neon AI Gateway model discovery failed:', error.message);
    return res.status(502).json({ error: 'No se pudo consultar la disponibilidad del AI Gateway.' });
  }
});

const assistantRequests = new Map();
app.post('/api/ai/assistant', async (req, res) => {
  const question = String(req.body.question || '').trim();
  if (!question || question.length > 2000) {
    return res.status(400).json({ error: 'Escribe una pregunta de hasta 2000 caracteres.' });
  }

  const now = Date.now();
  const recentRequests = (assistantRequests.get(req.authAdminId) || []).filter(time => now - time < 60000);
  if (recentRequests.length >= 5) {
    assistantRequests.set(req.authAdminId, recentRequests);
    return res.status(429).json({ error: 'Espera un minuto antes de enviar más preguntas.' });
  }
  assistantRequests.set(req.authAdminId, [...recentRequests, now]);

  const { NEON_AI_GATEWAY_BASE_URL, NEON_AI_GATEWAY_TOKEN, NEON_AI_MODEL } = process.env;
  if (!NEON_AI_GATEWAY_BASE_URL || !NEON_AI_GATEWAY_TOKEN) {
    return res.status(503).json({ error: 'El AI Gateway no está configurado en esta rama.' });
  }

  try {
    const baseUrl = NEON_AI_GATEWAY_BASE_URL.replace(/\/+$/, '');
    const catalogResponse = await fetch(`${baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${NEON_AI_GATEWAY_TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!catalogResponse.ok) {
      console.error('Neon AI Gateway model discovery failed:', catalogResponse.status);
      return res.status(502).json({ error: 'No se pudo consultar la disponibilidad del AI Gateway.' });
    }

    const catalog = await catalogResponse.json();
    const enabledModels = Array.isArray(catalog.data)
      ? catalog.data.filter(model => model.enabled === true && typeof model.id === 'string')
      : [];
    if (enabledModels.length === 0) {
      return res.status(503).json({
        error: 'Neon no tiene modelos habilitados. Habilita créditos del AI Gateway en Billing para usar el asistente.',
      });
    }

    const requestedModel = String(req.body.model || '').trim();
    const model = enabledModels.find(candidate => candidate.id === requestedModel) ||
      enabledModels.find(candidate => candidate.id === NEON_AI_MODEL) ||
      enabledModels[0];
    const completion = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NEON_AI_GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente de ayuda para el uso de Bureau-Manager, un sistema para administrar condominios, inquilinos y recibos. Responde en español, de forma clara y breve. No tienes acceso a los datos del sistema; no pidas contraseñas, correos reales ni datos personales.',
          },
          { role: 'user', content: question },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!completion.ok) {
      let payload = {};
      try {
        payload = await completion.json();
      } catch (error) {
        console.error('Neon AI Gateway returned a non-JSON error response:', error.message);
      }
      console.error('Neon AI Gateway completion failed:', completion.status, payload.error?.code || 'unknown');
      if (completion.status === 403 && payload.error?.unavailable_reason === 'paid_plan_required') {
        return res.status(503).json({
          error: 'No hay créditos habilitados para el AI Gateway. Añade créditos en la página Billing de Neon.',
        });
      }
      return res.status(502).json({ error: 'El AI Gateway no pudo responder. Inténtalo de nuevo más tarde.' });
    }

    const payload = await completion.json();
    const answer = payload.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      return res.status(502).json({ error: 'El AI Gateway devolvió una respuesta vacía. Inténtalo de nuevo.' });
    }
    return res.json({ answer: answer.trim(), model: model.id });
  } catch (error) {
    console.error('Neon AI Gateway completion failed:', error.message);
    return res.status(502).json({ error: 'No se pudo conectar con el AI Gateway. Inténtalo de nuevo.' });
  }
});

app.get('/api/recibos/:id/pdf', async (req, res) => {
  const receiptId = Number(req.params.id);
  if (!Number.isSafeInteger(receiptId) || receiptId < 1) {
    return res.status(400).json({ error: 'Selecciona un recibo válido.' });
  }

  try {
    const [receipts] = await database.query(
      `${receiptSelect} WHERE r.id_recibo = ?`,
      [receiptId]
    );
    if (receipts.length === 0) return res.status(404).json({ error: 'No se encontró el recibo seleccionado.' });

    let pdf;
    if (receipts[0].pdf_storage_key) {
      pdf = await getReceiptPdf(receipts[0].pdf_storage_key);
    } else {
      pdf = await crearPDF(receipts[0]);
      const storageKey = await saveReceiptPdf(receiptId, pdf);
      await database.query(
        'UPDATE recibo SET pdf_storage_key = ? WHERE id_recibo = ?',
        [storageKey, receiptId]
      );
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibo-${receiptId}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(Buffer.from(pdf));
  } catch (error) {
    console.error(`No se pudo generar o guardar el PDF del recibo ${receiptId}:`, error);
    return res.status(502).json({ error: 'No se pudo guardar o descargar el PDF del recibo. Inténtalo de nuevo.' });
  }
});

app.get('/api/getCondominios', (req, res) => {
  connection.query('SELECT * FROM condominio ORDER BY id_condominio', (error, results) => {
    if (error) {
      return respondWithDatabaseError(res, error, 'Error al obtener los condominios');
    } else {
      return res.json(results);
    }
  });
});

app.post('/api/getEdificiosbyCondominio', (req, res) => {
  const { id_condominio } = req.body;
  connection.query('SELECT * FROM edificio WHERE id_condominio = ? ORDER BY id_edificio', [id_condominio], (error, results) => {
    if (error) {
      return respondWithDatabaseError(res, error, 'Error al obtener los edificios');
    } else {
      return res.json(results);
    }
  });
});

app.post('/api/getDepartamentosbyEdificios', (req, res) => {
  const { id_edificio } = req.body;
  connection.query('SELECT * FROM departamento WHERE id_edificio = ? ORDER BY id_departamento', [id_edificio], (error, results) => {
    if (error) {
      return respondWithDatabaseError(res, error, 'Error al obtener los departamentos');
    } else {
      return res.json(results);
    }
  });
});

app.post('/api/getInquilinosbyDepartamento', (req, res) => {
  const { id_departamento } = req.body;
  connection.query('SELECT * FROM inquilino WHERE id_departamento = ? ORDER BY id_inquilino', [id_departamento], (error, results) => {
    if (error) {
      return respondWithDatabaseError(res, error, 'Error al obtener los inquilinos');
    } else {
      return res.json(results);
    }
  });
});

app.get('/api/getEdificios', (req, res) => {
  connection.query('SELECT * FROM edificio ORDER BY id_edificio', (error, results) => {
    if (error) {
      return respondWithDatabaseError(res, error, 'Error al obtener los edificios');
    } else {
      return res.json(results);
    }
  });
});

app.get('/api/getInfoCondominio', (req, res) => {
  const { id_condominio } = req.query;
  connection.query(
    'SELECT * FROM condominio WHERE id_condominio = ?',
    [id_condominio],
    (error, results) => {
      if (error) {
        return respondWithDatabaseError(res, error, 'Error al obtener el condominio');
      } else {
        return res.json(results[0] || null);
      }
    }
  );
});

app.get('/healthz', async (req, res) => {
  try {
    await database.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check could not reach Neon PostgreSQL:', error.message);
    return res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});
