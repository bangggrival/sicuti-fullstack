const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sicuti',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function run() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN sisa_cuti_sabtu INTEGER DEFAULT 1');
    await pool.query('ALTER TABLE users ADD COLUMN sisa_cuti_minggu INTEGER DEFAULT 1');
    console.log("Migration successful");
  } catch(e) {
    console.error("Migration failed:", e.message);
  } finally {
    pool.end();
  }
}
run();
