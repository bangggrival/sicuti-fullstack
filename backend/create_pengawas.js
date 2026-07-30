const { pool } = require('./db/connection');
const bcrypt = require('bcryptjs');

async function create() {
  try {
    const password = await bcrypt.hash('123456', 10);
    const nip = '19900101202401' + Math.floor(Math.random() * 10000);
    await pool.query(`
      INSERT INTO users (nip, username, password, name, role, jabatan, unit, avatar, sisa_cuti, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [nip, 'pengawas1', password, 'Ahmad Rivaldi (Pengawas)', 'pengawas', 'Pengawas Baru', 'Semua Seksi', 'AR', 12, '#F59E0B']);
    console.log('User created successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
create();
