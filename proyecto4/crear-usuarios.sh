#!/usr/bin/env bash
# Uso: export MYSQL_ROOT_PASSWORD=... APP_PASSWORD=... CONSULTA_PASSWORD=... ADMIN_PASSWORD=...; ./crear-usuarios.sh
set -euo pipefail
: "${MYSQL_ROOT_PASSWORD:?falta}" "${APP_PASSWORD:?falta}" "${CONSULTA_PASSWORD:?falta}" "${ADMIN_PASSWORD:?falta}"
export APP_PASSWORD CONSULTA_PASSWORD ADMIN_PASSWORD
envsubst '${APP_PASSWORD} ${CONSULTA_PASSWORD} ${ADMIN_PASSWORD}' < "$(dirname "$0")/003-roles.sql" \
  | mysql -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u root -p"$MYSQL_ROOT_PASSWORD"
