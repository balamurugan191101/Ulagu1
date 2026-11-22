
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from environment configuration.');
}

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL.startsWith('postgres')) {
  throw new Error('DATABASE_URL must be a PostgreSQL connection string.');
}

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,

  // Neon PostgreSQL connections should use TLS.
  // Keep certificate verification enabled.
  ...(isProduction && {
    ssl: {
      rejectUnauthorized: true,
    },
  }),
  application_name: 'ulagu-backend',
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

async function testConnection() {
  const result = await pool.query(`
    SELECT
      NOW() AS server_time,
      current_database() AS database_name
  `);

  return result.rows[0];
}

async function closeDatabase() {
  await pool.end();
}

module.exports = pool;
module.exports.testConnection = testConnection;
module.exports.closeDatabase = closeDatabase;
