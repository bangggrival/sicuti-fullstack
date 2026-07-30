const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { globalLimiter } = require('../middleware/rateLimiter');

// Router-level middleware: all routes in this file require authentication
// and are subject to per-user rate limiting (300 req / 5 min per user).
router.use(authenticateToken, globalLimiter);


const checkPengawas = (req, res, next) => {
  if (req.user.role !== 'pengawas' && req.user.role !== 'kasie') {
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }
  next();
};

// GET /api/users/subordinates — List pegawai binaan pengawas
router.get('/subordinates', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.nip, u.name, u.role, u.jabatan, u.unit, u.avatar, u.color, u.sisa_cuti as "sisaCuti",
        u.sisa_cuti_sabtu as "sisaCutiSabtu", u.sisa_cuti_minggu as "sisaCutiMinggu",
        (
          SELECT json_build_object(
            'id', p.id,
            'kode', p.kode,
            'jenisCuti', p.jenis_cuti,
            'tanggalMulai', p.tanggal_mulai,
            'tanggalSelesai', p.tanggal_selesai,
            'status', p.status
          )
          FROM pengajuan_cuti p
          WHERE p.pegawai_id = u.id AND (p.status = 'diajukan' OR p.status = 'pending' OR p.status = 'disetujui') 
            AND CURRENT_DATE BETWEEN p.tanggal_mulai AND p.tanggal_selesai
          LIMIT 1
        ) as "activeCuti"
      FROM users u
      WHERE u.pengawas_id = $1 AND u.is_active = true
      ORDER BY u.name ASC
    `, [req.user.id]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching subordinates:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users — List all users (Pengawas only)
router.get('/', authenticateToken, checkPengawas, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, nip, name, role, jabatan, unit, avatar, color, sisa_cuti as "sisaCuti", sisa_cuti_sabtu as "sisaCutiSabtu", sisa_cuti_minggu as "sisaCutiMinggu", pengawas_id as "pengawasId", no_wa as "noWa", is_active as "isActive"
      FROM users
      WHERE is_active = true
      ORDER BY role DESC, name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/users — Create new user (Pengawas only)
router.post('/', authenticateToken, checkPengawas, async (req, res) => {
  const { nip, username, name, role, jabatan, unit, password, noWa, sisaCuti, sisaCutiSabtu, sisaCutiMinggu, pengawasId } = req.body;
  if (!nip || !username || !name || !role || !password) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = name.charAt(0).toUpperCase();
    const result = await db.query(
      `INSERT INTO users (nip, username, password, name, role, jabatan, unit, avatar, no_wa, sisa_cuti, sisa_cuti_sabtu, sisa_cuti_minggu, pengawas_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [
        nip, username, hashedPassword, name, role, jabatan || '-', unit || '-', avatar, noWa || '-', 
        sisaCuti !== undefined ? sisaCuti : 12,
        sisaCutiSabtu !== undefined ? sisaCutiSabtu : 1,
        sisaCutiMinggu !== undefined ? sisaCutiMinggu : 1,
        pengawasId || null
      ]
    );
    res.json({ success: true, message: 'User berhasil dibuat', id: result.rows[0].id });
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'NIP sudah terdaftar' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/:id — Update user role/data (Pengawas only)
router.put('/:id', authenticateToken, checkPengawas, async (req, res) => {
  const { id } = req.params;
  const { name, username, nip, jabatan, unit, role, pengawasId, sisaCuti, sisaCutiSabtu, sisaCutiMinggu, password, noWa } = req.body;
  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
    }
    
    await db.query(`
      UPDATE users 
      SET name = COALESCE($1, name),
          nip = COALESCE($2, nip),
          username = COALESCE($3, username),
          jabatan = COALESCE($4, jabatan),
          unit = COALESCE($5, unit),
          role = COALESCE($6, role), 
          pengawas_id = $7, 
          sisa_cuti = COALESCE($8, sisa_cuti),
          sisa_cuti_sabtu = COALESCE($9, sisa_cuti_sabtu),
          sisa_cuti_minggu = COALESCE($10, sisa_cuti_minggu),
          no_wa = COALESCE($11, no_wa),
          is_active = COALESCE($12, is_active)
      WHERE id = $13`, 
      [
        name, nip, username, jabatan, unit, role, 
        pengawasId || null, 
        sisaCuti !== undefined ? sisaCuti : null, 
        sisaCutiSabtu !== undefined ? sisaCutiSabtu : null, 
        sisaCutiMinggu !== undefined ? sisaCutiMinggu : null, 
        noWa, req.body.isActive, id
      ]
    );
    res.json({ success: true, message: 'Data user berhasil diperbarui' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/users/:id — Delete user (Pengawas only)
router.delete('/:id', authenticateToken, checkPengawas, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/:id/reset-password — Reset user password to default (Pengawas only)
router.put('/:id/reset-password', authenticateToken, checkPengawas, async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt); // Default password

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.params.id]);
    res.json({ success: true, message: 'Kata sandi berhasil direset ke bawaan (123456)' });
  } catch (err) {
    console.error('Error resetting user password:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
