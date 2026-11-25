const fs = require('fs');
const path = require('path');
const { pool } = require('./neonDatabase');

async function migrate() {
  const schemaPath = path.resolve(__dirname, '..', 'database', 'neon-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
    console.log('Neon PostgreSQL schema applied successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(error => {
  console.error('Failed to apply the Neon PostgreSQL schema:', error.message);
  process.exitCode = 1;
});
