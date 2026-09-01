const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { signTokens, setAuthCookies, clearAuthCookies, verifyRefresh, authRequired } = require('../auth');
const { ApiError, asyncHandler, cleanPhone, isValidPakistaniPhone } = require('../util');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please try again later.' },
});

function isValidPassword(pw) {
  return String(pw || '').length >= 6;
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.created_at };
}

router.post(
  '/register',
  loginLimiter,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Please provide your full name.'),
  body('phone').custom((v) => isValidPakistaniPhone(v)).withMessage('Enter a valid Pakistani mobile number.'),
  body('password').custom(isValidPassword).withMessage('Password must be at least 6 characters.'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Enter a valid email.'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

    const name = req.body.name.trim();
    const phone = cleanPhone(req.body.phone);
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null;
    const hash = await bcrypt.hash(req.body.password, 10);

    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rowCount) throw new ApiError(409, 'An account with this phone number already exists.');

    const { rows } = await pool.query(
      `INSERT INTO users (name, phone, email, password_hash, role) VALUES ($1,$2,$3,$4,'customer') RETURNING *`,
      [name, phone, email, hash]
    );
    const user = rows[0];
    const tokens = signTokens(user);
    setAuthCookies(res, tokens);
    res.status(201).json({ user: publicUser(user), accessToken: tokens.access });
  })
);

router.post(
  '/login',
  loginLimiter,
  body('identifier').trim().notEmpty().withMessage('Enter phone or email.'),
  body('password').notEmpty().withMessage('Enter your password.'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

    const identifier = String(req.body.identifier).trim();
    const phone = cleanPhone(identifier);

    const { rows } = await pool.query(
      `SELECT * FROM users WHERE phone = $1 OR lower(email) = lower($2)`,
      [phone, identifier]
    );
    const user = rows[0];
    if (!user || !user.password_hash) throw new ApiError(401, 'Invalid phone/email or password.');

    const ok = await bcrypt.compare(req.body.password, user.password_hash);
    if (!ok) throw new ApiError(401, 'Invalid phone/email or password.');

    const tokens = signTokens(user);
    setAuthCookies(res, tokens);
    res.json({ user: publicUser(user), accessToken: tokens.access });
  })
);

router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies && req.cookies.nf_refresh;
    if (!token) throw new ApiError(401, 'No active session.');
    let payload;
    try {
      payload = verifyRefresh(token);
    } catch {
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.id]);
    if (!rows.length) throw new ApiError(401, 'Account not found.');
    const tokens = signTokens(rows[0]);
    setAuthCookies(res, tokens);
    res.json({ user: publicUser(rows[0]), accessToken: tokens.access });
  })
);

router.get(
  '/me',
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) throw new ApiError(401, 'Account not found.');
    res.json({ user: publicUser(rows[0]) });
  })
);

module.exports = router;
module.exports.publicUser = publicUser;
module.exports.isValidPassword = isValidPassword;