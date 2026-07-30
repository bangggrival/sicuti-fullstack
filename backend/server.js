const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pengajuanRoutes = require('./routes/pengajuan');
const usersRoutes = require('./routes/users');
const notifikasiRoutes = require('./routes/notifikasi');
const liburRoutes = require('./routes/libur');

// Initialize Cron Jobs
require('./cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy — REQUIRED when deployed behind Nginx or any reverse proxy.
// Without this, req.ip will always be the proxy's IP (e.g. 127.0.0.1),
// making all users appear to come from the same IP for rate limiting purposes.
// Set to 1 if there is exactly 1 proxy in front (typical Nginx setup).
app.set('trust proxy', 1);

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS: read allowed origins from env so it works in both dev and production
// Set ALLOWED_ORIGINS in your .env file, e.g.:
// ALLOWED_ORIGINS=https://sicuti.yourdomain.com,https://www.yourdomain.com
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

app.use('/uploads', express.static('uploads'));

// Routes
// Rate limiting is applied inside each route file AFTER authenticateToken,
// so that req.user is populated and rate limiting keys are per-user (not per-IP).
// See middleware/rateLimiter.js for strategy details.
app.use('/api/auth', authRoutes);
app.use('/api/pengajuan', pengajuanRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifikasi', notifikasiRoutes);
app.use('/api/libur', liburRoutes);

// Health check (no auth, no rate limit needed)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SiCuti REST API is running', timestamp: new Date() });
});

// Start server (only when not running as Vercel serverless function)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 SiCuti Backend REST API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
