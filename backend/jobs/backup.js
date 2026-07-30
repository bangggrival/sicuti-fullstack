const db = require('../db/connection');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

async function performBackup() {
  console.log('Memulai proses backup database...');
  try {
    const tables = ['users', 'pengajuan_cuti', 'notifikasi', 'hari_libur', 'password_resets', 'refresh_tokens'];
    const backupData = {};

    for (const table of tables) {
      const res = await db.query(`SELECT * FROM ${table}`);
      backupData[table] = res.rows;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json.gz`;
    const backupPath = path.join(__dirname, '../backups', filename);

    // Compress data
    const jsonString = JSON.stringify(backupData, null, 2);
    zlib.gzip(jsonString, (err, buffer) => {
      if (err) {
        console.error('Gagal mengompresi backup:', err);
        return;
      }
      fs.writeFile(backupPath, buffer, (err) => {
        if (err) {
          console.error('Gagal menyimpan file backup:', err);
        } else {
          console.log(`Backup berhasil disimpan di: ${backupPath}`);
        }
      });
    });

  } catch (err) {
    console.error('Error saat melakukan backup:', err);
  }
}

module.exports = performBackup;
