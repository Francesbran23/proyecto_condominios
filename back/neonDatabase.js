const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const separator = trimmed.indexOf('=');
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Set it in the environment or the project root .env.local file.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const primaryKeys = {
  administrador: 'id_administrador',
  'adeudos anteriores': 'id_adeudos',
  'concepto de pago': 'id_concepto',
  condominio: 'id_condominio',
  'cuota de fondo de reserva': 'id_reserva',
  'cuota de penalización': 'id_penalizacion',
  'cuota extraordinaria': 'id_extraordinaria',
  'cuota ordinaria': 'id_ordinaria',
  departamento: 'id_departamento',
  'direccion condominio': 'id_direccion',
  edificio: 'id_edificio',
  'fecha de pago': 'id_fecha',
  inquilino: 'id_inquilino',
  recibo: 'id_recibo',
  'total pagado': 'id_total',
};

function parameterize(sql, values = []) {
  let valueIndex = 0;
  const parameters = [];
  const statement = sql
    .replace(/`([^`]+)`/g, (_, identifier) => `"${identifier.replace(/"/g, '""')}"`)
    .replace(/\?/g, () => {
      if (valueIndex >= values.length) {
        throw new Error('SQL placeholder count does not match the provided values.');
      }

      const value = values[valueIndex++];
      if (Array.isArray(value)) {
        return value.map(item => {
          parameters.push(item);
          return `$${parameters.length}`;
        }).join(', ') || 'NULL';
      }

      parameters.push(value);
      return `$${parameters.length}`;
    });

  if (valueIndex !== values.length) {
    throw new Error('SQL placeholder count does not match the provided values.');
  }

  const insert = statement.match(/^\s*INSERT\s+INTO\s+(?:"([^"]+)"|([a-zA-Z_][\w]*))/i);
  const tableName = insert && (insert[1] || insert[2]);
  const primaryKey = primaryKeys[tableName];
  if (primaryKey && !/\bRETURNING\b/i.test(statement)) {
    return { statement: `${statement} RETURNING "${primaryKey}"`, parameters, primaryKey };
  }

  return { statement, parameters, primaryKey };
}

function mapResult(sql, result, primaryKey) {
  if (/^\s*SELECT\b/i.test(sql)) return result.rows;

  const summary = { affectedRows: result.rowCount };
  if (/^\s*INSERT\b/i.test(sql) && primaryKey) {
    summary.insertId = result.rows[0] ? result.rows[0][primaryKey] : null;
  }
  return summary;
}

function createConnection(client) {
  return {
    async query(sql, values = []) {
      const prepared = parameterize(sql, values);
      const result = await client.query(prepared.statement, prepared.parameters);
      return [mapResult(sql, result, prepared.primaryKey), result.fields];
    },
    beginTransaction() {
      return client.query('BEGIN');
    },
    commit() {
      return client.query('COMMIT');
    },
    rollback() {
      return client.query('ROLLBACK');
    },
    release() {
      client.release();
    },
  };
}

const connection = {
  query(sql, values, callback) {
    if (typeof values === 'function') {
      callback = values;
      values = [];
    }
    values = values || [];

    const prepared = parameterize(sql, values);
    const query = pool.query(prepared.statement, prepared.parameters)
      .then(result => mapResult(sql, result, prepared.primaryKey));

    if (typeof callback === 'function') {
      query.then(results => callback(null, results), error => callback(error));
      return undefined;
    }
    return query.then(results => [results, undefined]);
  },
  getConnection(callback) {
    const connectionPromise = pool.connect().then(client => createConnection(client));
    if (typeof callback === 'function') {
      connectionPromise.then(client => callback(null, client), error => callback(error));
      return undefined;
    }
    return connectionPromise;
  },
  promise() {
    return database;
  },
};

const database = {
  query(sql, values = []) {
    return connection.query(sql, values);
  },
  getConnection() {
    return connection.getConnection();
  },
};

module.exports = { connection, database, pool };
