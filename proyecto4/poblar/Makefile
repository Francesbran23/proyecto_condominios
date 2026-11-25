# Uso (desde practica4/poblar). Las credenciales salen del entorno; ver .env.example
#   make migrar      aplica 001, 002 con el administrador
#   make datos       regenera los CSV (determinista)
#   make poblar      carga masiva con usr_app
#   make comparar    mide LOAD DATA vs INSERT por renglón (limpia entre corridas)
#   make limpiar     vacía las tablas (necesita usr_admin: usr_app no tiene DELETE)
MYSQL_ADMIN = mysql -h $(DB_HOST) -P $(or $(DB_PORT),3306) -u $(ADMIN_USER) -p$(ADMIN_PASSWORD) $(DB_NAME)
migrar:
	for f in ../migraciones/001-dominios.sql ../migraciones/002-referencias.sql; do $(MYSQL_ADMIN) < $$f; done
datos:
	node generar-datos.js
poblar:
	node poblar.js
demo-sucio:
	node poblar.js --demo-sucio
limpiar:
	$(MYSQL_ADMIN) -e "SET FOREIGN_KEY_CHECKS=0; DELETE FROM recibo; DELETE FROM \`total pagado\`; DELETE FROM \`adeudos anteriores\`; DELETE FROM \`cuota de fondo de reserva\`; DELETE FROM \`cuota de penalización\`; DELETE FROM \`cuota extraordinaria\`; DELETE FROM \`cuota ordinaria\`; DELETE FROM \`concepto de pago\`; DELETE FROM inquilino; DELETE FROM departamento; DELETE FROM edificio; DELETE FROM condominio; SET FOREIGN_KEY_CHECKS=1;"
comparar: limpiar
	node poblar.js --modo=filas
	$(MAKE) limpiar
	node poblar.js
