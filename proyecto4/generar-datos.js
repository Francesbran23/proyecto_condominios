// generar-datos.js — datos SINTÉTICOS reproducibles (semilla fija) para bureau-manager.
// Uso: node generar-datos.js [carpeta_salida]   (por omisión ../datos)
// Cada archivo CSV lleva los ids explícitos para que las claves foráneas sean deterministas.
const fs = require('fs');
const path = require('path');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'datos'));
fs.mkdirSync(out, { recursive: true });

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20261105);
const pick = a => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pad = (n, w) => String(n).padStart(w, '0');
const money = n => n.toFixed(2);
const csv = (name, header, rows) => fs.writeFileSync(path.join(out, name + '.csv'),
  [header.join(','), ...rows.map(r => r.map(v => v === null ? '\\N' : String(v).includes(',') ? `"${v}"` : v).join(','))].join('\n') + '\n', 'utf8');

const NOMBRES = ['José','María','Juan','Ana','Luis','Carmen','Jorge','Laura','Miguel','Patricia','Carlos','Sofía','Fernando','Elena','Ricardo','Gabriela','Alejandro','Daniela','Roberto','Verónica','Héctor','Mónica','Raúl','Adriana','Óscar','Lucía','Sergio','Paola','Arturo','Claudia'];
const APELLIDOS = ['Hernández','García','Martínez','López','González','Pérez','Rodríguez','Sánchez','Ramírez','Cruz','Flores','Gómez','Morales','Vázquez','Reyes','Jiménez','Torres','Díaz','Gutiérrez','Ruiz','Mendoza','Aguilar','Ortiz','Castillo','Romero','Álvarez','Chávez','Rivera','Juárez','Ramos'];
const ALCALDIAS = ['Benito Juárez','Coyoacán','Iztapalapa','Gustavo A. Madero','Tlalpan','Azcapotzalco','Cuauhtémoc','Miguel Hidalgo','Álvaro Obregón','Venustiano Carranza','Iztacalco','Xochimilco'];
const CALLES = ['Av. Insurgentes','Calzada de Tlalpan','Av. Universidad','Calle Reforma','Av. Revolución','Calle Morelos','Av. Hidalgo','Calle Allende','Av. Central','Calle Juárez','Av. Politécnico','Calle Zaragoza'];

// ---- condominio (12) / edificio (3 por condominio) / departamento (6 por edificio => 216) ----
const NC = 12, EPC = 3, DPE = 6;
const cond = [], edif = [], depa = [];
for (let c = 1; c <= NC; c++) {
  cond.push([c, `Condominio ${pick(['Las Palmas','El Roble','Vista Hermosa','Los Pinos','San Ángel','Jardines','La Noria','Villa Real','Bosques','Torres del Sur','Paseo Verde','Cumbres'])} ${c}`,
    `${pick(CALLES)} ${int(10, 999)}, ${pick(ALCALDIAS)}, CDMX`]);
  for (let e = 1; e <= EPC; e++) {
    const ide = (c - 1) * EPC + e;
    edif.push([ide, c, `Torre ${'ABC'[e - 1]}`]);
    for (let d = 1; d <= DPE; d++) depa.push([(ide - 1) * DPE + d, ide, `${Math.ceil(d / 2)}0${((d - 1) % 2) + 1}`]);
  }
}
// condominio.nombre debe ser único: se garantiza con el sufijo " ${c}".

// ---- inquilino: uno por departamento; ~5 % sin departamento asignado (relación opcional) ----
const inq = [];
depa.forEach((d, i) => {
  const n = pick(NOMBRES), a1 = pick(APELLIDOS), a2 = pick(APELLIDOS);
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  inq.push([i + 1, rnd() < 0.05 ? null : d[0], n, a1, a2, `${norm(n)}.${norm(a1)}${i + 1}@correo.example`]);
});
// ---- recibos: 3 meses por inquilino asignado; una fila por tabla de cuota por recibo (igual que la API) ----
const MESES = [['2026-07', 'julio'], ['2026-08', 'agosto'], ['2026-09', 'septiembre']];
const T = { ord: [], ext: [], pen: [], res: [], adeu: [], conc: [], tot: [], rec: [] };
const edifDeDepa = new Map(depa.map(d => [d[0], d[1]]));
const condDeEdif = new Map(edif.map(e => [e[0], e[1]]));
let k = 0; const seq = {};
for (const i of inq) {
  if (i[1] === null) continue;
  const idc = condDeEdif.get(edifDeDepa.get(i[1]));
  const base = pick([850, 1000, 1200, 1500, 1800, 2200]);
  for (const [ym, mes] of MESES) {
    k++;
    const ord = base, ext = rnd() < 0.15 ? int(5, 25) * 100 : 0, res = Math.round(base * pick([0.05, 0.08, 0.1]));
    const pagado = rnd() < 0.7, pen = !pagado && rnd() < 0.4 ? Math.round(base * 0.05) : 0, adeu = rnd() < 0.1 ? base : 0;
    const total = ord + ext + pen + res + adeu;
    T.ord.push([k, money(ord), `Cuota ordinaria ${mes} 2026`]);
    T.ext.push([k, money(ext), ext ? 'Obra de mantenimiento' : 'Sin cuota extraordinaria']);
    T.pen.push([k, money(pen), pen ? 'Pago extemporáneo' : 'Sin penalización']);
    T.res.push([k, money(res), 'Fondo de reserva']);
    T.adeu.push([k, money(adeu), adeu ? 'Adeudo mes anterior' : 'Sin adeudos']);
    T.conc.push([k, `Cuota de mantenimiento ${mes}`]);
    T.tot.push([k, k, k, k, k, k, money(total)]);
    seq[idc] = (seq[idc] || 0) + 1;
    const fecha = `${ym}-05`;
    let fpago = null;
    if (pagado) fpago = `${ym}-${pad(int(5, 28), 2)} ${pad(int(8, 20), 2)}:${pad(int(0, 59), 2)}:00`;
    T.rec.push([k, `C${pad(idc, 2)}-${ym.replace('-', '')}-${pad(seq[idc], 4)}`, idc, i[1], i[0], fecha,
      pagado ? 'pagado' : 'pendiente', fpago, 'activo', k, k, k, k, k, k, k, 1]);
  }
}
csv('condominio', ['id_condominio','nombre_condominio','direccion_condominio'], cond);
csv('edificio', ['id_edificio','id_condominio','nombre_edificio'], edif);
csv('departamento', ['id_departamento','id_edificio','numero_departamento'], depa);
csv('inquilino', ['id_inquilino','id_departamento','nombre_inquilino','apellino_paterno_inquilino','apellino_materno_inquilino','correo_inquilino'], inq);
csv('cuota_ordinaria', ['id_ordinaria','monto_ordinaria','descripcion_ordinaria'], T.ord);
csv('cuota_extraordinaria', ['id_extraordinaria','monto_extraordinaria','descrpicion_extraordinaria'], T.ext);
csv('cuota_penalizacion', ['id_penalizacion','monto_penalizacion','descripcion_penalizacion'], T.pen);
csv('cuota_reserva', ['id_reserva','monto_reserva','descripcion_reserva'], T.res);
csv('adeudos_anteriores', ['id_adeudos','monto_adeudos','descripcion_adeudos'], T.adeu);
csv('concepto_pago', ['id_concepto','descripcion_concepto'], T.conc);
csv('total_pagado', ['id_total','id_ordinaria','id_extraordinaria','id_penalizacion','id_reserva','id_adeudos','monto_total'], T.tot);
csv('recibo', ['id_recibo','no_recibo','id_condominio','id_departamento','id_inquilino','fecha','estado_pago','fecha_pago','estado_registro','id_concepto','id_ordinaria','id_extraordinaria','id_penalizacion','id_reserva','id_adeudos','id_total','id_administrador'], T.rec);

// ---- archivo deliberadamente sucio para demostrar el diagnóstico de rechazos ----
const sucio = [
  [9001, depa[0][0], 'Ana', 'Ruiz', 'Cruz', 'correo-sin-arroba'],          // CHECK de formato de correo
  [9002, depa[0][0], '   ', 'Ruiz', 'Cruz', 'ana.ruiz@correo.example'],     // CHECK de nombre en blanco
  [9003, 99999, 'Luis', 'Gómez', 'Díaz', 'luis.gomez@correo.example'],     // FK inexistente
  [9004, inq[1][1], inq[1][2], inq[1][3], inq[1][4], inq[1][5]],           // UNIQUE compuesta (duplicado de la fila 2)
  [9005, depa[1][0], 'Eva', 'Mora', 'Sosa', 'eva.mora@correo.example'],     // fila válida
];
fs.mkdirSync(path.join(out, 'sucio'), { recursive: true });
csv('sucio/inquilino_sucio', ['id_inquilino','id_departamento','nombre_inquilino','apellino_paterno_inquilino','apellino_materno_inquilino','correo_inquilino'], sucio);
console.log(`CSV generados en ${out}: condominio=${cond.length} edificio=${edif.length} departamento=${depa.length} inquilino=${inq.length} recibo=${T.rec.length}`);
