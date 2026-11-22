const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const secret = process.env.JWT_SECRET;
if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be a unique random value of at least 32 bytes.');
}

async function requireAuth(req, res, next) {
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(req.get('authorization') || '');
  if (!match) return res.status(401).json({ success: false, message: 'Authentication required.' });

  try {
    const claims = jwt.verify(match[1], secret, {
      algorithms: ['HS256'],
      issuer: 'ulagu-api',
      audience: 'ulagu-app',
    });
    if (!claims.sub || !/^\d+$/.test(claims.sub)) throw new Error('Invalid subject');
    const result = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = TRUE',
      [claims.sub],
    );
    if (!result.rowCount) return res.status(401).json({ success: false, message: 'Authentication required.' });
    req.user = result.rows[0];
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
}

module.exports = requireAuth;
