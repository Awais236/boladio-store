const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { ApiError, asyncHandler, cleanPhone, isValidPakistaniPhone } = require('../util');
const { notifyAdmin } = require('../realtime/notify');
const config = require('../config');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query('SELECT store_open, announcement, delivery_fee, low_stock_threshold FROM settings WHERE id = 1');
    const s = rows[0] || {};
    res.json({
      storeOpen: s.store_open !== false,
      announcement: s.announcement || null,
      deliveryFee: Number(s.delivery_fee || 250),
      phone: config.brand.phone,
      whatsapp: config.brand.whatsapp,
      address: config.brand.address,
      storeName: config.brand.name,
    });
  })
);

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' },
});

router.post(
  '/contact',
  contactLimiter,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Please provide your name.'),
  body('phone').custom((v) => isValidPakistaniPhone(v)).withMessage('Enter a valid Pakistani mobile number.'),
  body('message').trim().isLength({ min: 5, max: 1000 }).withMessage('Message must be at least 5 characters.'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);
    await notifyAdmin(
      `Message from ${req.body.name}`,
      `${req.body.message} - Call: ${cleanPhone(req.body.phone)}`,
      { type: 'contact' }
    );
    res.json({ ok: true });
  })
);

module.exports = router;