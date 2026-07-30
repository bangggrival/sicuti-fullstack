const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../schemas');

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau Password salah' });
    }

    const user = result.rows[0];
    
    if (user.is_active === false) {
      return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Username atau Password salah' });
    }

    const payload = {
      id: user.id,
      nip: user.nip,
      username: user.username,
      name: user.name,
      role: user.role,
      jabatan: user.jabatan,
      unit: user.unit,
      avatar: user.avatar,
      color: user.color,
      pengawasId: user.pengawas_id,
      sisaCuti: user.sisa_cuti,
      sisaCutiSabtu: user.sisa_cuti_sabtu,
      sisaCutiMinggu: user.sisa_cuti_minggu
    };

    const token = jwt.sign(payload, process.process?.env?.JWT_SECRET || process.env.JWT_SECRET || 'sicuti_super_secret_jwt_key_2025', {
      expiresIn: '24h' // Access token valid for 24h
    });

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || 'sicuti_super_secret_refresh_key_2025', {
      expiresIn: '7d' // Long-lived refresh token
    });

    // Save refresh token to db
    await db.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      refreshToken,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nip, u.name, u.role, u.jabatan, u.unit, u.avatar, u.pengawas_id as "pengawasId", 
              u.sisa_cuti as "sisaCuti", u.sisa_cuti_sabtu as "sisaCutiSabtu", u.sisa_cuti_minggu as "sisaCutiMinggu", u.color, u.no_wa as "noWa",
              spv.name as "pengawasName", spv.no_wa as "pengawasWa"
       FROM users u
       LEFT JOIN users spv ON u.pengawas_id = spv.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token tidak ditemukan' });
  }

  try {
    // Check if refresh token is in database
    const dbCheck = await db.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
    if (dbCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Refresh token tidak valid' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'sicuti_super_secret_refresh_key_2025', async (err, decoded) => {
      if (err) {
        // If expired, delete it from db
        await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        return res.status(403).json({ success: false, message: 'Refresh token kadaluwarsa' });
      }

      // Generate new access token
      const userRes = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      if (userRes.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'User tidak valid' });
      }

      const user = userRes.rows[0];
      const payload = {
        id: user.id,
        nip: user.nip,
        name: user.name,
        role: user.role,
        jabatan: user.jabatan,
        unit: user.unit,
        avatar: user.avatar,
        color: user.color,
        pengawasId: user.pengawas_id,
        sisaCuti: user.sisa_cuti,
        sisaCutiSabtu: user.sisa_cuti_sabtu,
        sisaCutiMinggu: user.sisa_cuti_minggu
      };

      const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET || 'sicuti_super_secret_jwt_key_2025', {
        expiresIn: '24h'
      });

      res.json({ success: true, token: newAccessToken });
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body;
  const accessToken = req.token; // attached by authenticateToken middleware

  try {
    // 1. Blacklist the access token
    if (accessToken) {
      await db.query('INSERT INTO token_blacklist (token) VALUES ($1) ON CONFLICT DO NOTHING', [accessToken]);
    }
    
    // 2. Remove the refresh token
    if (refreshToken) {
      await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    res.json({ success: true, message: 'Logout berhasil' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Server error saat logout' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  const { nip } = req.body;

  try {
    const userRes = await db.query('SELECT id, name FROM users WHERE nip = $1 AND is_active = true', [nip]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun dengan NIP tersebut tidak ditemukan atau tidak aktif' });
    }
    
    const user = userRes.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Clean up old tokens for this user
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
    
    // Insert new token
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Simulate sending email/whatsapp
    console.log(`\n\n[SIMULASI] Token reset sandi untuk ${user.name} (NIP: ${nip}):\nhttp://localhost:5173/reset-sandi/${token}\n\n`);
    
    // Return token in response for testing/demo purposes
    res.json({ 
      success: true, 
      message: 'Instruksi reset password berhasil dikirim',
      mockToken: token // In real app, DO NOT send this to frontend!
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const resetRes = await db.query('SELECT * FROM password_resets WHERE token = $1', [token]);
    if (resetRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Token reset tidak valid atau sudah kadaluwarsa' });
    }

    const resetData = resetRes.rows[0];
    if (new Date() > new Date(resetData.expires_at)) {
      await db.query('DELETE FROM password_resets WHERE id = $1', [resetData.id]);
      return res.status(400).json({ success: false, message: 'Token reset sudah kadaluwarsa' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, resetData.user_id]);
    
    // Delete token
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [resetData.user_id]);

    res.json({ success: true, message: 'Kata sandi berhasil direset. Silakan login kembali.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
