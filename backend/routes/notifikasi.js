const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const appEmitter = require('../utils/emitter');
const { globalLimiter } = require('../middleware/rateLimiter');

// Router-level middleware: all routes in this file require authentication
// and are subject to per-user rate limiting (300 req / 5 min per user).
// Note: globalLimiter skips /stream endpoints (SSE connections).
router.use(authenticateToken, globalLimiter);


// GET /api/notifikasi — List all notifications for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, message, type, is_read as "read", created_at as "createdAt" FROM notifikasi WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching notifikasi:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data notifikasi' });
  }
});

// GET /api/notifikasi/unread-count — Count unread notifications
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifikasi WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ success: true, count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
});

// PUT /api/notifikasi/read-all — Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE notifikasi SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'Notifikasi berhasil ditandai' });
  } catch (err) {
    console.error('Error updating notifikasi:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate data notifikasi' });
  }
});

// SSE Implementation
// Store active connections: map of userId to res object
const clients = new Map();

// GET /api/notifikasi/stream
router.get('/stream', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send an initial heartbeat to establish connection
  res.write(': heartbeat\n\n');

  // Keep track of the client connection
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(res);

  // Send periodic heartbeat to keep connection alive
  const heartbeatTimer = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatTimer);
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        clients.delete(userId);
      }
    }
  });
});

// Listen to internal app events and push to specific clients
appEmitter.on('status_changed', ({ userId, message, action, data }) => {
  const userClients = clients.get(userId);
  if (userClients) {
    const payload = JSON.stringify({ message, action, data });
    userClients.forEach(res => {
      res.write(`data: ${payload}\n\n`);
    });
  }
});

module.exports = router;
