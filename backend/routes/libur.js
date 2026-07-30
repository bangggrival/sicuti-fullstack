const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
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

// GET /api/libur — List all hari libur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM hari_libur ORDER BY tanggal ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching hari libur:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/libur — Add new hari libur (Pengawas only)
router.post('/', authenticateToken, checkPengawas, async (req, res) => {
  const { tanggal, keterangan } = req.body;
  if (!tanggal || !keterangan) {
    return res.status(400).json({ success: false, message: 'Tanggal dan keterangan wajib diisi' });
  }
  
  try {
    const result = await db.query(
      'INSERT INTO hari_libur (tanggal, keterangan) VALUES ($1, $2) RETURNING *',
      [tanggal, keterangan]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Hari libur berhasil ditambahkan' });
  } catch (err) {
    console.error('Error adding hari libur:', err);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Tanggal libur ini sudah ada' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/libur/:id — Delete hari libur (Pengawas only)
router.delete('/:id', authenticateToken, checkPengawas, async (req, res) => {
  try {
    await db.query('DELETE FROM hari_libur WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Hari libur berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting hari libur:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
