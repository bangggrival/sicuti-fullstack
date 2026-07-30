const rateLimit = require('express-rate-limit');

// ============================================================
//  PRODUCTION-READY RATE LIMITING STRATEGY
//
//  Problem with IP-only rate limiting in an office environment:
//  All employees share the same public IP (NAT), so one person's
//  heavy usage can block everyone else.
//
//  Solution: For authenticated routes, rate-limit by User ID.
//  For public routes (login), rate-limit by IP to prevent brute-force.
//
//  How it works:
//  - keyGenerator reads req.user.id if the user is already authenticated.
//  - This works because in our routes, authenticateToken is declared
//    BEFORE globalLimiter in the middleware chain (see usage below).
//  - If req.user is not set yet (public route), it falls back to req.ip.
// ============================================================

/**
 * Key generator for authenticated routes.
 * Uses User ID if available (after authenticateToken), otherwise falls back to IP.
 */
const userOrIpKeyGenerator = (req) => {
  if (req.user && req.user.id) {
    return `uid_${req.user.id}`;
  }
  return req.ip;
};

// ---------------------------------------------------------------
// 1. Global Limiter — Used on all authenticated API routes
//    Apply this AFTER authenticateToken in your route definitions:
//      router.get('/path', authenticateToken, globalLimiter, handler)
//    OR use the createAuthLimiter helper below (recommended).
//
//    Quota: 300 requests per 5 minutes per user
//    = ~1 request/sec, comfortable for normal app usage.
// ---------------------------------------------------------------
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300,
  keyGenerator: userOrIpKeyGenerator,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Silakan kurangi aktivitas dan coba lagi dalam beberapa menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip SSE stream — it's a single long-lived connection, not a request flood
  skip: (req) => req.path.endsWith('/stream'),
});

// ---------------------------------------------------------------
// 2. Login Limiter — For the public /api/auth/login endpoint
//    Rate-limit by IP to prevent brute-force attacks.
//    20 attempts per 15 minutes per IP (reasonable for a shared office IP).
// ---------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login dari jaringan ini. Silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------------------------------------------------------------
// 3. Write Limiter — For mutating actions (POST, PUT, DELETE)
//    Limits heavy write operations per user.
//    60 write actions per 5 minutes per user.
// ---------------------------------------------------------------
const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  keyGenerator: userOrIpKeyGenerator,
  message: {
    success: false,
    message: 'Terlalu banyak aksi perubahan data. Silakan coba lagi dalam beberapa menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helper: Creates a middleware array [authenticateToken, globalLimiter]
 * to be used cleanly in router definitions, ensuring auth runs first.
 *
 * Usage in a route file:
 *   const { withLimit } = require('../middleware/rateLimiter');
 *   const { authenticateToken } = require('../middleware/auth');
 *   router.get('/path', withLimit(authenticateToken), handler);
 */
const withLimit = (authMiddleware) => [authMiddleware, globalLimiter];
const withWriteLimit = (authMiddleware) => [authMiddleware, writeLimiter];

module.exports = {
  globalLimiter,
  loginLimiter,
  writeLimiter,
  withLimit,
  withWriteLimit,
};
