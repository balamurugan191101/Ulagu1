const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, 'utf8') < 32 || /GENERATE_A_LONG_RANDOM_SECRET/i.test(JWT_SECRET)) {
  throw new Error('JWT_SECRET must be a unique random value of at least 32 bytes.');
}

const JWT_ISSUER = 'ulagu-api';
const JWT_AUDIENCE = 'ulagu-app';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

function issueToken(user) {
  return jwt.sign({ sub: String(user.id) }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function registerUser(req, res) {
  const { name, email, password, phone } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100 ||
      !validEmail(email) || typeof password !== 'string' || password.length < 12 || password.length > 128 ||
      typeof phone !== 'string' || phone.trim().length < 5 || phone.trim().length > 20) {
    return res.status(400).json({ success: false, message: 'Provide a valid name, email, phone, and password (12–128 characters).' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const inserted = await client.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name.trim(), email.trim().toLowerCase(), passwordHash],
    );
    const user = inserted.rows[0];
    await client.query('INSERT INTO user_profiles (user_id, phone) VALUES ($1, $2)', [user.id, phone.trim()]);
    await client.query('COMMIT');
    return res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email }, token: issueToken(user) });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Unable to create account with those details.' });
    }
    throw error;
  } finally {
    client.release();
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body || {};
  if (!validEmail(email) || typeof password !== 'string' || password.length > 128) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const result = await pool.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = $1 AND is_active = TRUE',
    [email.trim().toLowerCase()],
  );
  const user = result.rows[0];
  const valid = user?.password_hash ? await argon2.verify(user.password_hash, password).catch(() => false) : false;
  if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email }, token: issueToken(user) });
}

module.exports = { registerUser, loginUser };
