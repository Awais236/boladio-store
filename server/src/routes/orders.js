const express = require('express');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db');
const { ApiError, asyncHandler, cleanPhone, orderPublic } = require('../util');
const { authRequired, requireAdmin, optionalAuth } = require('../auth');
const { placeOrder, updateOrderStatus, VALID_STATUS } = require('../services/orders');

const router = express.Router();

const placeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many orders from this device. Please try again later.' },
});

const ORDER_FIELDS = `SELECT o.*, u.name AS user_name FROM orders o LEFT JOIN users u ON u.id = o.customer_id`;

router.post(
  '/place',
  placeLimiter,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const order = await placeOrder({
      items: b.items,
      customer: {
        userId: req.user ? req.user.id : null,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        city: b.city,
        area: b.area,
        address: b.address,
        postalCode: b.postalCode,
        notes: b.notes,
      },
    });

    // Track order room for realtime updates: customer's own socket already opened in the app.
    res.status(201).json({ order: orderPublic(order) });
  })
);

router.get(
  '/track',
  asyncHandler(async (req, res) => {
    const orderNumber = String(req.query.order || '').trim();
    const phone = cleanPhone(String(req.query.phone || ''));
    if (!orderNumber || !phone) {
      throw new ApiError(400, 'Please provide your order number and phone number.');
    }
    const { rows } = await pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber]);
    if (!rows.length) throw new ApiError(404, 'Order not found. Please check your order number.');
    if (rows[0].customer_phone !== phone) {
      throw new ApiError(403, 'This order number does not match the phone number provided.');
    }
    res.json({ order: orderPublic(rows[0]) });
  })
);

router.get(
  '/my',
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT * FROM orders WHERE customer_id = $1 OR customer_phone = $2 ORDER BY created_at DESC LIMIT 100`,
      [req.user.id, req.user.phone || '']
    );
    res.json({ items: rows.map(orderPublic) });
  })
);

// ---------- Public order confirmation (no auth needed) ----------

router.get(
  '/public/:token',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, order_number, customer_name, customer_phone, city, area, address, items, item_count, subtotal, delivery_fee, total, status, payment_method, payment_status, created_at, confirm_token FROM orders WHERE confirm_token = $1',
      [req.params.token]
    );
    if (!rows.length) throw new ApiError(404, 'Order not found.');
    const o = rows[0];
    res.json({
      order: {
        orderNumber: o.order_number,
        customerName: o.customer_name,
        city: o.city,
        area: o.area,
        address: o.address,
        items: o.items,
        itemCount: o.item_count,
        subtotal: Number(o.subtotal),
        deliveryFee: Number(o.delivery_fee),
        total: Number(o.total),
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
      },
    });
  })
);

router.post(
  '/public/:token/confirm',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, status, confirm_token FROM orders WHERE confirm_token = $1',
      [req.params.token]
    );
    if (!rows.length) throw new ApiError(404, 'Order not found.');
    if (rows[0].status !== 'pending') {
      throw new ApiError(400, `Order is already ${rows[0].status}. Cannot confirm.`);
    }
    const { rows: updated } = await pool.query(
      "UPDATE orders SET status = 'confirmed', updated_at = now() WHERE id = $1 RETURNING *",
      [rows[0].id]
    );
    const { broadcastStatusChange } = require('../realtime/notify');
    await broadcastStatusChange(updated[0]);
    res.json({ ok: true, status: 'confirmed' });
  })
);

router.post(
  '/public/:token/cancel',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, status, items, confirm_token FROM orders WHERE confirm_token = $1',
      [req.params.token]
    );
    if (!rows.length) throw new ApiError(404, 'Order not found.');
    if (rows[0].status !== 'pending') {
      throw new ApiError(400, `Order is already ${rows[0].status}. Cannot cancel.`);
    }
    // Restock
    if (rows[0].items) {
      for (const it of rows[0].items) {
        await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [it.qty, it.productId]);
      }
    }
    const { rows: updated } = await pool.query(
      "UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1 RETURNING *",
      [rows[0].id]
    );
    const { broadcastStatusChange } = require('../realtime/notify');
    await broadcastStatusChange(updated[0]);
    res.json({ ok: true, status: 'cancelled' });
  })
);

// ---------- Admin ----------

router.get(
  '/admin',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20, q } = req.query;
    const where = [];
    const params = [];
    if (status && VALID_STATUS.includes(status)) {
      params.push(status);
      where.push(`o.status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(o.order_number ILIKE $${params.length} OR o.customer_name ILIKE $${params.length} OR o.customer_phone ILIKE $${params.length})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const per = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const pg = Math.max(Number(page) || 1, 1);
    const offset = (pg - 1) * per;

    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM orders o ${whereSql}`, params);
    const { rows } = await pool.query(
      `${ORDER_FIELDS} ${whereSql} ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, per, offset]
    );
    res.json({
      items: rows.map(orderPublic),
      total: count.rows[0].total,
      page: pg,
      pages: Math.ceil(count.rows[0].total / per),
    });
  })
);

router.get(
  '/admin/:id',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`${ORDER_FIELDS} WHERE o.id = $1`, [req.params.id]);
    if (!rows.length) throw new ApiError(404, 'Order not found.');
    res.json({ order: orderPublic(rows[0]) });
  })
);

router.patch(
  '/admin/:id/status',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = String(req.body && req.body.status || '');
    const updated = await updateOrderStatus(Number(req.params.id), status);
    res.json({ order: orderPublic(updated) });
  })
);

router.patch(
  '/admin/:id/verify',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query(
      'UPDATE orders SET suspicious = false WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) throw new ApiError(404, 'Order not found.');
    res.json({ ok: true });
  })
);

module.exports = router;