#!/usr/bin/env python3
"""Valida los CSV contra las reglas de 001-dominios.sql y 002-referencias.sql SIN necesitar MySQL.
Uso: python3 validar-datos.py [carpeta_datos]"""
import csv, re, sys, os, collections
from datetime import datetime, date
d = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'datos')
def rd(n):
    with open(os.path.join(d, n + '.csv'), encoding='utf8') as f:
        return [{k: (None if v == '\\N' else v) for k, v in r.items()} for r in csv.DictReader(f)]
T = {n: rd(n) for n in ['condominio','edificio','departamento','inquilino','concepto_pago','cuota_ordinaria','cuota_extraordinaria','cuota_penalizacion','cuota_reserva','adeudos_anteriores','total_pagado','recibo']}
err = []
def chk(c, m):
    if not c: err.append(m)
mail = re.compile(r'^[^ @]+@[^ @]+[.][^ @]+$')
lim = {'condominio': {'nombre_condominio':45,'direccion_condominio':100}, 'edificio': {'nombre_edificio':20}, 'departamento': {'numero_departamento':10},
       'inquilino': {'nombre_inquilino':45,'apellino_paterno_inquilino':45,'apellino_materno_inquilino':45,'correo_inquilino':45},
       'recibo': {'no_recibo':20}, 'concepto_pago': {'descripcion_concepto':45}}
for t, cols in lim.items():
    for r in T[t]:
        for c, m in cols.items(): chk(len(r[c]) <= m and r[c].strip(), f'{t}.{c} longitud/vacío: {r[c]!r}')
ids = {t: {r[list(r)[0]] for r in rows} for t, rows in T.items()}
def uniq(t, cols):
    s = collections.Counter(tuple(r[c] for c in cols) for r in T[t] if all(r[c] is not None for c in cols))
    chk(all(v == 1 for v in s.values()), f'UNIQUE {t}{cols} duplicado')
uniq('condominio', ['nombre_condominio']); uniq('edificio', ['id_condominio','nombre_edificio']); uniq('departamento', ['id_edificio','numero_departamento'])
uniq('recibo', ['id_condominio','no_recibo']); uniq('inquilino', ['id_departamento','nombre_inquilino','apellino_paterno_inquilino','apellino_materno_inquilino','correo_inquilino'])
for c in ['id_total','id_ordinaria','id_extraordinaria','id_penalizacion','id_reserva','id_adeudos','id_concepto']: uniq('recibo', [c])
for r in T['inquilino']:
    chk(mail.match(r['correo_inquilino']), f"correo inválido {r['correo_inquilino']}")
    chk(r['id_departamento'] is None or r['id_departamento'] in ids['departamento'], 'FK inquilino->departamento')
for r in T['edificio']: chk(r['id_condominio'] in ids['condominio'], 'FK edificio')
for r in T['departamento']: chk(r['id_edificio'] in ids['edificio'], 'FK departamento')
mont = {'cuota_ordinaria':'monto_ordinaria','cuota_extraordinaria':'monto_extraordinaria','cuota_penalizacion':'monto_penalizacion','cuota_reserva':'monto_reserva','adeudos_anteriores':'monto_adeudos'}
val = {t: {r[list(r)[0]]: float(r[c]) for r in T[t]} for t, c in mont.items()}
for t, c in mont.items():
    for r in T[t]: chk(float(r[c]) >= 0 and len(r['descripcion_' + {'cuota_ordinaria':'ordinaria','cuota_extraordinaria':'extraordinaria','cuota_penalizacion':'penalizacion','cuota_reserva':'reserva','adeudos_anteriores':'adeudos'}[t]] if t != 'cuota_extraordinaria' else r['descrpicion_extraordinaria']) <= 45, f'{t} monto/desc')
tot = {r['id_total']: r for r in T['total_pagado']}
for r in T['total_pagado']:
    s = val['cuota_ordinaria'][r['id_ordinaria']] + val['cuota_extraordinaria'][r['id_extraordinaria']] + val['cuota_penalizacion'][r['id_penalizacion']] + val['cuota_reserva'][r['id_reserva']] + val['adeudos_anteriores'][r['id_adeudos']]
    chk(abs(s - float(r['monto_total'])) < 0.005, f"total {r['id_total']} no suma")
dep2ed = {r['id_departamento']: r['id_edificio'] for r in T['departamento']}; ed2co = {r['id_edificio']: r['id_condominio'] for r in T['edificio']}
inq = {r['id_inquilino']: r for r in T['inquilino']}
for r in T['recibo']:
    chk(r['id_inquilino'] in inq and inq[r['id_inquilino']]['id_departamento'] == r['id_departamento'], 'recibo: inquilino no pertenece al departamento')
    chk(ed2co[dep2ed[r['id_departamento']]] == r['id_condominio'], 'recibo: condominio no coincide con el departamento')
    chk((r['estado_pago'] == 'pendiente') == (r['fecha_pago'] is None), 'R13 pagado<=>fecha_pago')
    if r['fecha_pago']: chk(datetime.strptime(r['fecha_pago'], '%Y-%m-%d %H:%M:%S').date() >= date.fromisoformat(r['fecha']), 'R14 fecha_pago >= fecha')
    for fk, t in [('id_concepto','concepto_pago'),('id_ordinaria','cuota_ordinaria'),('id_extraordinaria','cuota_extraordinaria'),('id_penalizacion','cuota_penalizacion'),('id_reserva','cuota_reserva'),('id_adeudos','adeudos_anteriores'),('id_total','total_pagado')]:
        chk(r[fk] in ids[t], f'FK recibo.{fk}')
print({t: len(v) for t, v in T.items()})
print('ERRORES:', len(err)); [print(' -', e) for e in err[:10]]
sys.exit(1 if err else 0)
