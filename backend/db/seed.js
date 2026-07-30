const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./connection');

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🌱 Executing schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);

    console.log('👥 Inserting users...');
    const defaultPassword = await bcrypt.hash('123456', 10);

    // Insert Pengawas & Kasie first
    const kasieRes = await client.query(`
      INSERT INTO users (nip, username, password, name, role, jabatan, unit, avatar, sisa_cuti, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, ['197605142010031001', 'bambang', defaultPassword, 'Dr. Bambang Sugiarto, M.Si', 'kasie', 'Kepala Seksi', 'Semua Seksi', 'BS', 12, '#0891B2']);
    const kasieId = kasieRes.rows[0].id;

    const spv1Res = await client.query(`
      INSERT INTO users (nip, username, password, name, role, jabatan, unit, avatar, sisa_cuti, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, ['198507122015041001', 'hendra', defaultPassword, 'Drs. Hendra Wijaya', 'pengawas', 'Pengawas Tim A', 'Seksi Pelayanan & Keuangan', 'HW', 12, '#D97706']);
    const spv1Id = spv1Res.rows[0].id;

    const spv2Res = await client.query(`
      INSERT INTO users (nip, username, password, name, role, jabatan, unit, avatar, sisa_cuti, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, ['198203082014041002', 'dewi', defaultPassword, 'Ir. Dewi Lestari', 'pengawas', 'Pengawas Tim B', 'Seksi Teknologi', 'DL', 12, '#DB2777']);
    const spv2Id = spv2Res.rows[0].id;

    // Insert Pegawai
    const emp1Res = await client.query(`
      INSERT INTO users (nip, username, password, name, role, jabatan, unit, avatar, pengawas_id, sisa_cuti, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, ['199001012020011001', 'ahmad', defaultPassword, 'Ahmad Fauzi', 'pegawai', 'Staf Administrasi', 'Seksi Pelayanan', 'AF', spv1Id, 12, '#2563EB']);
    const emp1Id = emp1Res.rows[0].id;

    const emp2Res = await client.query(`
      INSERT INTO users (nip, username, password, name, role, jabatan, unit, avatar, pengawas_id, sisa_cuti, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, ['199205152019022002', 'siti', defaultPassword, 'Siti Rahayu', 'pegawai', 'Staf Keuangan', 'Seksi Keuangan', 'SR', spv1Id, 8, '#7C3AED']);
    const emp2Id = emp2Res.rows[0].id;

    const emp3Res = await client.query(`
      INSERT INTO users (nip, username, password, name, role, jabatan, unit, avatar, pengawas_id, sisa_cuti, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, ['198811032018013003', 'budi', defaultPassword, 'Budi Santoso', 'pegawai', 'Staf IT', 'Seksi Teknologi', 'BS', spv2Id, 5, '#059669']);
    const emp3Id = emp3Res.rows[0].id;

    console.log('📋 Inserting initial leave requests...');
    await client.query(`
      INSERT INTO pengajuan_cuti 
      (kode, pegawai_id, jenis_cuti, tanggal_mulai, tanggal_selesai, jumlah_hari, alasan, status, pengawas_id, created_at)
      VALUES
      ('CUT-2025-001', ${emp1Id}, 'tahunan', '2025-08-05', '2025-08-07', 3, 'Keperluan keluarga di kampung halaman', 'diajukan', ${spv1Id}, '2025-07-25'),
      ('CUT-2025-002', ${emp2Id}, 'sakit', '2025-07-28', '2025-07-30', 3, 'Sakit demam berdarah, perlu istirahat total', 'diajukan', ${spv1Id}, '2025-07-28'),
      ('CUT-2025-003', ${emp1Id}, 'alasan_penting', '2025-08-12', '2025-08-12', 1, 'Menghadiri prosesi pernikahan saudara kandung', 'diajukan', ${spv1Id}, '2025-07-28'),
      ('CUT-2025-004', ${emp3Id}, 'tahunan', '2025-08-18', '2025-08-22', 5, 'Liburan bersama keluarga', 'diajukan', ${spv2Id}, '2025-07-26')
    `);

    console.log('🔔 Inserting sample notifications...');
    await client.query(`
      INSERT INTO notifikasi (user_id, message, type, is_read)
      VALUES 
      (${emp1Id}, 'Pengajuan cuti CUT-2025-001 telah berhasil diajukan.', 'info', true),
      (${spv1Id}, 'Ahmad Fauzi mengajukan cuti Alasan Penting pada 12 Agu 2025.', 'info', false)
    `);

    console.log('✅ Database seeding complete!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    client.release();
    process.exit();
  }
}

seedDatabase();
