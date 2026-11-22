
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('--------------------------------');
    console.log('ULAGU DATABASE INITIALIZATION');
    console.log('--------------------------------');

    await client.query('SELECT 1');

    console.log('Database connection successful.');

    const schemaPath = path.join(__dirname, 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error('schema.sql file not found.');
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schema);

    console.log('Database schema executed successfully.');

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('Available database tables:');

    for (const row of result.rows) {
      console.log(`- ${row.table_name}`);
    }

    console.log('Database initialization completed.');

  } catch (error) {
    console.error('Database initialization failed:', error.message);
    throw error;

  } finally {
    client.release();
  }
}

module.exports = initializeDatabase;
