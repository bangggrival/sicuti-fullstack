const cron = require('node-cron');
const db = require('./db/connection');
const performBackup = require('./jobs/backup');

// Jadwal Cron: Berjalan setiap tanggal 1 Januari jam 00:01
// Format: menit(0-59) jam(0-23) tanggal(1-31) bulan(1-12) hari_dalam_minggu(0-7)
cron.schedule('1 0 1 1 *', async () => {
  console.log('Menjalankan cron job: Reset Kuota Cuti Tahunan...');
  try {
    const result = await db.query(`
      UPDATE users 
      SET sisa_cuti = 12, 
          sisa_cuti_sabtu = 1, 
          sisa_cuti_minggu = 1
      WHERE is_active = true
    `);
    console.log(`Cron job selesai. Kuota cuti di-reset untuk ${result.rowCount} pegawai aktif.`);
  } catch (err) {
    console.error('Gagal menjalankan cron job reset cuti:', err);
  }
}, {
  scheduled: true,
  timezone: "Asia/Jakarta" // Waktu Indonesia Barat
});

// Jadwal Cron: Backup Database setiap jam 02:00 pagi setiap hari
cron.schedule('0 2 * * *', async () => {
  console.log('Menjalankan cron job: Auto-Backup Database...');
  await performBackup();
}, {
  scheduled: true,
  timezone: "Asia/Jakarta" // Waktu Indonesia Barat
});
