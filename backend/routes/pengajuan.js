const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { pengajuanSchema } = require('../schemas');
const appEmitter = require('../utils/emitter');
const multer = require('multer');
const path = require('path');
const { globalLimiter } = require('../middleware/rateLimiter');

// Router-level middleware: all routes in this file require authentication
// and are subject to per-user rate limiting (300 req / 5 min per user).
router.use(authenticateToken, globalLimiter);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'suratsakit-' + uniqueSuffix + path.extname(file.originalname).toLowerCase())
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format berkas tidak valid. Hanya izinkan JPG, PNG, atau PDF.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: fileFilter
});

// Helper function to generate unique code (e.g. CUT-2025-006)
async function generateKode() {
  const year = new Date().getFullYear();
  const res = await db.query('SELECT COUNT(*) FROM pengajuan_cuti');
  const count = parseInt(res.rows[0].count) + 1;
  return `CUT-${year}-${String(count).padStart(3, '0')}`;
}

// GET /api/pengajuan/kalender — Get all valid leave requests for the team calendar
router.get('/kalender', authenticateToken, async (req, res) => {
  try {
    const q = `
      SELECT 
        p.id, p.kode, p.jenis_cuti as "jenisCuti", p.tanggal_mulai as "tanggalMulai", 
        p.tanggal_selesai as "tanggalSelesai", p.status, 
        u.name as "pegawaiNama", u.color as "pegawaiColor"
      FROM pengajuan_cuti p
      JOIN users u ON p.pegawai_id = u.id
      WHERE p.status != 'ditolak'
      ORDER BY p.tanggal_mulai ASC
    `;
    const result = await db.query(q);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching calendar data:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kalender' });
  }
});

// GET /api/pengajuan — List pengajuan berdasarkan role
router.get('/', authenticateToken, async (req, res) => {
  const { user } = req;
  const { status } = req.query;

  try {
    let queryStr = `
      SELECT 
        p.id, p.kode, p.jenis_cuti as "jenisCuti", p.tanggal_mulai as "tanggalMulai", 
        p.tanggal_selesai as "tanggalSelesai", p.jumlah_hari as "jumlahHari", p.alasan, 
        p.pengganti_tugas as "penggantiTugas", p.status, p.pengawas_note as "pengawasNote", 
        p.pengawas_tgl as "pengawasTanggal", p.kasie_note as "kasieNote", 
        p.kasie_tgl as "kasieTanggal", p.surat_sakit_url as "suratSakitUrl", p.created_at as "createdAt",
        u.id as "pegawaiId", u.name as "pegawaiNama", u.nip as "pegawaiNip", 
        u.jabatan as "pegawaiJabatan", u.avatar as "pegawaiAvatar", u.color as "pegawaiColor",
        spv.name as "pengawasNama"
      FROM pengajuan_cuti p
      JOIN users u ON p.pegawai_id = u.id
      LEFT JOIN users spv ON p.pengawas_id = spv.id
    `;

    const queryParams = [];

    if (user.role === 'pegawai') {
      queryStr += ` WHERE p.pegawai_id = $1`;
      queryParams.push(user.id);
    } else if (user.role === 'pengawas') {
      // Pengawas now has Kasie-level access (sees all)
    }

    if (status && status !== 'semua') {
      const paramIndex = queryParams.length + 1;
      queryStr += (queryParams.length === 0 ? ' WHERE ' : ' AND ') + `p.status = $${paramIndex}`;
      queryParams.push(status);
    }

    queryStr += ` ORDER BY p.created_at DESC, p.id DESC`;

    const result = await db.query(queryStr, queryParams);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching pengajuan:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengajuan cuti' });
  }
});

// GET /api/pengajuan/:id — Detail single pengajuan
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        p.id, p.kode, p.jenis_cuti as "jenisCuti", p.tanggal_mulai as "tanggalMulai", 
        p.tanggal_selesai as "tanggalSelesai", p.jumlah_hari as "jumlahHari", p.alasan, 
        p.pengganti_tugas as "penggantiTugas", p.status, p.pengawas_note as "pengawasNote", 
        p.pengawas_tgl as "pengawasTanggal", p.kasie_note as "kasieNote", 
        p.kasie_tgl as "kasieTanggal", p.surat_sakit_url as "suratSakitUrl", p.created_at as "createdAt",
        u.id as "pegawaiId", u.name as "pegawaiNama", u.nip as "pegawaiNip", 
        u.jabatan as "pegawaiJabatan", u.unit as "pegawaiUnit", u.avatar as "pegawaiAvatar", u.color as "pegawaiColor",
        spv.id as "pengawasId", spv.name as "pengawasNama", spv.jabatan as "pengawasJabatan"
      FROM pengajuan_cuti p
      JOIN users u ON p.pegawai_id = u.id
      LEFT JOIN users spv ON p.pengawas_id = spv.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching detail pengajuan:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail pengajuan' });
  }
});

// POST /api/pengajuan — Buat pengajuan baru
router.post('/', authenticateToken, authorizeRoles('pegawai', 'pengawas', 'kasie'), validate(pengajuanSchema), async (req, res) => {
  const { jenisCuti, tanggalMulai, tanggalSelesai, jumlahHari, alasan, penggantiTugas } = req.body;

  try {
    let includesSabtu = false;
    let includesMinggu = false;
    let curr = new Date(tanggalMulai);
    const end = new Date(tanggalSelesai);

    // Fetch hari libur in this range
    const liburRes = await db.query('SELECT tanggal FROM hari_libur WHERE tanggal BETWEEN $1 AND $2', [tanggalMulai, tanggalSelesai]);
    const liburDates = liburRes.rows.map(r => new Date(r.tanggal).getTime());

    let actualHariKerja = 0;
    while (curr <= end) {
      const day = curr.getDay();
      if (day === 6) includesSabtu = true;
      if (day === 0) includesMinggu = true;
      
      const isWeekend = day === 0 || day === 6;
      const isLibur = liburDates.includes(curr.getTime());

      if (!isWeekend && !isLibur) {
        actualHariKerja++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    
    // Override jumlahHari with the securely calculated value if it's Cuti Tahunan or similar
    const finalJumlahHari = (jenisCuti === 'tahunan') ? actualHariKerja : jumlahHari;

    if (jenisCuti === 'tahunan' || jenisCuti === 'alasan_penting') {
      const userRes = await db.query('SELECT sisa_cuti, sisa_cuti_sabtu, sisa_cuti_minggu FROM users WHERE id = $1', [req.user.id]);
      const { sisa_cuti, sisa_cuti_sabtu, sisa_cuti_minggu } = userRes.rows[0];
      
      if (jenisCuti === 'tahunan' && finalJumlahHari > sisa_cuti) {
        return res.status(400).json({ 
          success: false, 
          message: `Sisa cuti tahunan Anda (${sisa_cuti} hari) tidak mencukupi untuk ${finalJumlahHari} hari.` 
        });
      }

      if (includesSabtu && sisa_cuti_sabtu <= 0) {
        return res.status(400).json({ success: false, message: 'Jatah ijin hari Sabtu Anda tahun ini sudah habis.' });
      }
      if (includesMinggu && sisa_cuti_minggu <= 0) {
        return res.status(400).json({ success: false, message: 'Jatah ijin hari Minggu Anda tahun ini sudah habis.' });
      }
    }

    const kode = await generateKode();

    // Deduct quotas immediately upon creation
    if (jenisCuti === 'tahunan') {
      await db.query(`
        UPDATE users 
        SET sisa_cuti = GREATEST(0, sisa_cuti - $1)
        WHERE id = $2
      `, [finalJumlahHari, req.user.id]);
    }

    if (jenisCuti === 'tahunan' || jenisCuti === 'alasan_penting') {
      if (includesSabtu || includesMinggu) {
        await db.query(`
          UPDATE users 
          SET sisa_cuti_sabtu = CASE WHEN $1 = true THEN GREATEST(0, sisa_cuti_sabtu - 1) ELSE sisa_cuti_sabtu END,
              sisa_cuti_minggu = CASE WHEN $2 = true THEN GREATEST(0, sisa_cuti_minggu - 1) ELSE sisa_cuti_minggu END
          WHERE id = $3
        `, [includesSabtu, includesMinggu, req.user.id]);
      }
    }

    // Fetch latest real-time pengawas_id from database
    const userDbRes = await db.query('SELECT pengawas_id FROM users WHERE id = $1', [req.user.id]);
    const targetPengawasId = (userDbRes.rows.length > 0 && userDbRes.rows[0].pengawas_id) ? userDbRes.rows[0].pengawas_id : null;

    const insertRes = await db.query(`
      INSERT INTO pengajuan_cuti 
      (kode, pegawai_id, jenis_cuti, tanggal_mulai, tanggal_selesai, jumlah_hari, alasan, pengganti_tugas, status, pengawas_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'diajukan', $9)
      RETURNING *
    `, [kode, req.user.id, jenisCuti, tanggalMulai, tanggalSelesai, finalJumlahHari, alasan, penggantiTugas || null, targetPengawasId]);

    const newRequest = insertRes.rows[0];

    // Kirim notifikasi ke pengawas/kasie dan ambil info kontak
    let pengawasPhone = null;
    let pengawasName = null;
    
    try {
      if (targetPengawasId) {
        const pRes = await db.query('SELECT name, no_wa FROM users WHERE id = $1', [targetPengawasId]);
        if (pRes.rows.length > 0) {
          pengawasPhone = pRes.rows[0].no_wa;
          pengawasName = pRes.rows[0].name;

          await db.query(`
            INSERT INTO notifikasi (user_id, message, type)
            VALUES ($1, $2, 'info')
          `, [targetPengawasId, `${req.user.name} mengajukan cuti baru (${kode}).`]);

          appEmitter.emit('status_changed', {
            userId: targetPengawasId,
            message: `${req.user.name} mengajukan cuti baru (${kode}).`,
            action: 'pengajuan_baru',
            data: newRequest
          });
        }
      } else {
        // Broadcast notification to all active supervisors & kasie if no specific supervisor assigned
        const supervisors = await db.query("SELECT id, name, no_wa FROM users WHERE role IN ('pengawas', 'kasie') AND is_active = true");
        if (supervisors.rows.length > 0) {
          pengawasPhone = supervisors.rows[0].no_wa;
          pengawasName = supervisors.rows[0].name;

          for (const spv of supervisors.rows) {
            await db.query(`
              INSERT INTO notifikasi (user_id, message, type)
              VALUES ($1, $2, 'info')
            `, [spv.id, `${req.user.name} mengajukan cuti baru (${kode}).`]);

            appEmitter.emit('status_changed', {
              userId: spv.id,
              message: `${req.user.name} mengajukan cuti baru (${kode}).`,
              action: 'pengajuan_baru',
              data: newRequest
            });
          }
        }
      }

      // Ensure we have a valid supervisor phone number for WhatsApp redirect
      if (!pengawasPhone || pengawasPhone === '-') {
        const validSpv = await db.query("SELECT name, no_wa FROM users WHERE role IN ('pengawas', 'kasie') AND is_active = true AND no_wa IS NOT NULL AND no_wa != '-' ORDER BY id ASC LIMIT 1");
        if (validSpv.rows.length > 0) {
          pengawasPhone = validSpv.rows[0].no_wa;
          if (!pengawasName) pengawasName = validSpv.rows[0].name;
        }
      }
    } catch (notifErr) {
      console.error('Failed to send notification to supervisors:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Pengajuan cuti berhasil dibuat',
      data: newRequest,
      pengawas: {
        name: pengawasName,
        no_wa: pengawasPhone
      }
    });
  } catch (err) {
    console.error('Error creating pengajuan:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat pengajuan cuti' });
  }
});



// PUT /api/pengajuan/:id/keputusan — Review pengajuan
router.put('/:id/keputusan', authenticateToken, async (req, res) => {
  if (req.user.role !== 'pengawas' && req.user.role !== 'kasie') {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }

  const { id } = req.params;
  const { action, note } = req.body;
  
  if (!['disetujui', 'ditolak', 'diketahui'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Aksi tidak valid' });
  }

  try {
    const pRes = await db.query('SELECT * FROM pengajuan_cuti WHERE id = $1', [id]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    const pengajuan = pRes.rows[0];

    // Return quota if rejected and it was not previously rejected
    if (action === 'ditolak' && pengajuan.status !== 'ditolak') {
      if (pengajuan.jenis_cuti === 'tahunan') {
        await db.query('UPDATE users SET sisa_cuti = sisa_cuti + $1 WHERE id = $2', [pengajuan.jumlah_hari, pengajuan.pegawai_id]);
      }
    }

    if (req.user.role === 'pengawas') {
      await db.query(`
        UPDATE pengajuan_cuti 
        SET status = $1, pengawas_note = $2, pengawas_tgl = NOW() 
        WHERE id = $3
      `, [action, note, id]);
    } else if (req.user.role === 'kasie') {
      await db.query(`
        UPDATE pengajuan_cuti 
        SET status = $1, kasie_note = $2, kasie_tgl = NOW() 
        WHERE id = $3
      `, [action, note, id]);
    }

    await db.query(`
      INSERT INTO notifikasi (user_id, message, type)
      VALUES ($1, $2, $3)
    `, [pengajuan.pegawai_id, `Pengajuan cuti Anda (${pengajuan.kode}) telah ${action}.`, action === 'disetujui' ? 'success' : (action === 'ditolak' ? 'error' : 'info')]);

    res.json({ success: true, message: `Pengajuan berhasil ${action}` });
  } catch (err) {
    console.error('Error updating keputusan:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

// POST /api/pengajuan/:id/upload-surat — Upload Surat Sakit
router.post('/:id/upload-surat', authenticateToken, (req, res, next) => {
  upload.single('suratSakit')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: 'Gagal mengunggah: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File surat sakit wajib diunggah' });
  }

  try {
    const pRes = await db.query('SELECT * FROM pengajuan_cuti WHERE id = $1', [id]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    const p = pRes.rows[0];
    if (p.jenis_cuti !== 'sakit') {
      return res.status(400).json({ success: false, message: 'Hanya cuti sakit yang memerlukan surat keterangan' });
    }

    // You can upload multiple times or just once. We'll allow overriding.
    const fileUrl = `/uploads/${req.file.filename}`;

    await db.query(`
      UPDATE pengajuan_cuti 
      SET surat_sakit_url = $1
      WHERE id = $2
    `, [fileUrl, id]);

    res.json({ 
      success: true, 
      message: 'Surat sakit berhasil diunggah',
      data: { suratSakitUrl: fileUrl }
    });
  } catch (err) {
    console.error('Error uploading surat sakit:', err);
    res.status(500).json({ success: false, message: 'Gagal mengunggah surat sakit' });
  }
});
