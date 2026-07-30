const jwt = require('jsonwebtoken');
const db = require('../db/connection');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'sicuti_super_secret_jwt_key_2025', async (err, user) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluwarsa.' });
    }

    try {
      // Check if token is in blacklist
      const bl = await db.query('SELECT id FROM token_blacklist WHERE token = $1', [token]);
      if (bl.rows.length > 0) {
        return res.status(401).json({ success: false, message: 'Sesi telah berakhir (logout).' });
      }
      
      req.user = user;
      req.token = token; // attach token for logout endpoint to use
      next();
    } catch (dbErr) {
      console.error('Blacklist check error:', dbErr);
      return res.status(500).json({ success: false, message: 'Server error saat memeriksa sesi.' });
    }
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki wewenang untuk aksi ini.' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
