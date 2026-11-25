#!/usr/bin/env node
// poblar.js — carga repetible, ordenada y de todo-o-nada de bureau-manager.
//   node poblar.js                 carga masiva (LOAD DATA LOCAL INFILE)  [por omisión]
//   node poblar.js --modo=filas    un INSERT por renglón (solo para medir la diferencia de tiempo)
//   node poblar.js --demo-sucio    informa qué renglones del archivo sucio rechazan las restricciones (siempre hace ROLLBACK)
// Conexión SOLO por variables de entorno (usar el usuario usr_app, no root):
//   DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD  y  SEED_ADMIN_PASSWORD (contraseña de las cuentas de administrador sembradas)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let mysql;
try { mysql = require('mysql2/promise'); }
catch { mysql = require(path.join(__dirname, '..', '..', 'back', 'node_modules', 'mysql2', 'promise')); }

const DATOS = path.resolve(__dirname, '..', 'datos');
// Orden: primero las tablas de las que dependen las demás (padres antes que hijos).
const TABLAS = [
  ['condominio', 'condominio', 'id_condominio'],
  ['edificio', 'edificio', 'id_edificio'],
  ['departamento', 'departamento', 'id_departamento'],
  ['inquilino', 'inquilino', 'id_inquilino'],
  ['concepto de pago', 'concepto_pago', 'id_concepto'],
  ['cuota ordinaria', 'cuota_ordinaria', 'id_ordinaria'],
  ['cuota extraordinaria', 'cuota_extraordinaria', 'id_extraordinaria'],
  ['cuota de penalización', 'cuota_penalizacion', 'id_penalizacion'],
  ['cuota de fondo de reserva', 'cuota_reserva', 'id_reserva'],
  ['adeudos anteriores', 'adeudos_anteriores', 'id_adeudos'],
  ['total pagado', 'total_pagado', 'id_total'],
  ['recibo', 'recibo', 'id_recibo'],
];
const q = t => '`' + t.replace(/`/g, '``') + '`';

function leerCsv(file) {                       // CSV sencillo: comillas dobles, \N = NULL
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const parse = l => { const r = []; let cur = '', inq = false;
    for (let i = 0; i < l.length; i++) { const c = l[i];
      if (c === '"') inq = !inq; else if (c === ',' && !inq) { r.push(cur); cur = ''; } else cur += c; }
    r.push(cur); return r.map(v => (v === '\\N' ? null : v)); };
  return { cols: parse(lines[0]), rows: lines.slice(1).map(parse) };
}

function exigirEntorno() {
  const faltan = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'SEED_ADMIN_PASSWORD'].filter(k => !process.env[k]);
  if (faltan.length) { console.error('Faltan variables de entorno: ' + faltan.join(', ')); process.exit(2); }
}

async function hashScrypt(pwd) {               // mismo formato que back/conexionDataBase.js
  const salt = crypto.randomBytes(16);
  const key = await new Promise((ok, no) => crypto.scrypt(pwd, salt, 64, (e, k) => (e ? no(e) : ok(k))));
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function insertarFilas(cn, tabla, cols, rows, informe) {   // un INSERT por renglón; registra cada rechazo
  const sql = `INSERT INTO ${q(tabla)} (${cols.map(q).join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
  for (let i = 0; i < rows.length; i++) {
    try { await cn.query(sql, rows[i]); informe.insertados++; }
    catch (e) { informe.rechazados.push({ renglon: i + 2, id: rows[i][0], codigo: e.code, mensaje: e.sqlMessage || e.message }); }
  }
}

async function main() {
  exigirEntorno();
  const modo = (process.argv.find(a => a.startsWith('--modo=')) || '--modo=masivo').split('=')[1];
  const demoSucio = process.argv.includes('--demo-sucio');
  const cn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), database: process.env.DB_NAME,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    infileStreamFactory: p => fs.createReadStream(p), charset: 'utf8mb4',
  });
  const resumen = []; const t0 = Date.now();
  await cn.query("SET SESSION sql_mode='STRICT_ALL_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
  await cn.beginTransaction();
  try {
    // 1) administradores (no vienen en CSV: la contraseña sale del entorno)
    const rep = { tabla: 'administrador', insertados: 0, rechazados: [], omitidos: 0 };
    for (const n of [1, 2, 3]) {
      const correo = `admin${n}@condominios.example`;
      const [[{ c }]] = await cn.query('SELECT COUNT(*) c FROM administrador WHERE correo_administrador = ?', [correo]);
      if (c) { rep.omitidos++; continue; }
      await cn.query('INSERT INTO administrador (nombre_administrador, apellido_paterno_administrador, apellido_materno_administrador, correo_administrador, `contraseña_administrador`) VALUES (?,?,?,?,?)',
        [`Admin${n}`, 'Demo', 'Sintético', correo, await hashScrypt(process.env.SEED_ADMIN_PASSWORD)]);
      rep.insertados++;
    }
    resumen.push(rep);

    // 2) resto de tablas, en orden padre -> hijo
    for (const [tabla, archivo, pk] of TABLAS) {
      const file = path.join(DATOS, archivo + '.csv');
      const { cols, rows } = leerCsv(file);
      const ids = rows.map(r => Number(r[0]));
      const [[{ c: existentes }]] = await cn.query(`SELECT COUNT(*) c FROM ${q(tabla)} WHERE ${q(pk)} BETWEEN ? AND ?`, [Math.min(...ids), Math.max(...ids)]);
      const informe = { tabla, insertados: 0, rechazados: [], omitidos: 0 };
      if (existentes === rows.length) { informe.omitidos = rows.length; resumen.push(informe); continue; }      // idempotente
      if (existentes !== 0) throw Object.assign(new Error(`carga parcial previa en ${tabla}: ${existentes} de ${rows.length}. Ejecute "make limpiar".`), { tabla, archivo });
      try {
        if (modo === 'filas') {
          await insertarFilas(cn, tabla, cols, rows, informe);
          if (informe.rechazados.length) throw Object.assign(new Error(informe.rechazados[0].mensaje), { tabla, archivo, rechazados: informe.rechazados });
        } else {
          const [r] = await cn.query(`LOAD DATA LOCAL INFILE ${mysql.escape(file)} INTO TABLE ${q(tabla)} CHARACTER SET utf8mb4 FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\\n' IGNORE 1 LINES (${cols.map(q).join(',')})`);
          informe.insertados = r.affectedRows;
        }
      } catch (e) {                                  // identificar qué renglones fallan, sin ocultar el error original
        e.tabla = tabla; e.archivo = archivo;
        if (!e.rechazados) { const d = { insertados: 0, rechazados: [] }; await insertarFilas(cn, tabla, cols, rows, d); e.rechazados = d.rechazados; }
        throw e;
      }
      resumen.push(informe);
    }

    if (demoSucio) {                                 // renglones sucios: solo diagnóstico
      const { cols, rows } = leerCsv(path.join(DATOS, 'sucio', 'inquilino_sucio.csv'));
      const d = { tabla: 'inquilino (sucio)', insertados: 0, rechazados: [], omitidos: 0 };
      await insertarFilas(cn, 'inquilino', cols, rows, d); resumen.push(d);
      await cn.rollback(); console.log('--demo-sucio: ROLLBACK, no se guardó nada.');
    } else await cn.commit();
  } catch (e) {
    await cn.rollback();
    console.error(`\nERROR: carga revertida por completo (todo o nada).\n  Tabla: ${e.tabla || '-'}   Archivo: ${e.archivo || '-'}\n  Causa: ${e.code || ''} ${e.sqlMessage || e.message}`);
    (e.rechazados || []).slice(0, 10).forEach(r => console.error(`  - renglón ${r.renglon} (id ${r.id}): ${r.codigo} ${r.mensaje}`));
    await cn.end(); process.exit(1);
  }
  const ms = Date.now() - t0;
  console.log(`\nModo: ${modo}   Tiempo total: ${ms} ms\n${'tabla'.padEnd(30)}${'insertados'.padStart(11)}${'omitidos'.padStart(10)}${'rechazados'.padStart(12)}`);
  for (const r of resumen) console.log(`${r.tabla.padEnd(30)}${String(r.insertados).padStart(11)}${String(r.omitidos).padStart(10)}${String(r.rechazados.length).padStart(12)}`);
  if (demoSucio) resumen.at(-1).rechazados.forEach(r => console.log(`  rechazado: renglón ${r.renglon} (id ${r.id}) -> ${r.codigo}: ${r.mensaje}`));
  await cn.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
