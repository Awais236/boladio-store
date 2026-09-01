const express = require('express');
const { pool } = require('../db');
const { ApiError, asyncHandler } = require('../util');
const { authRequired, requireAdmin } = require('../auth');
const { ACTIVE_STATUS } = require('../services/orders');
const config = require('../config');

const router = express.Router();

router.use(authRequired, requireAdmin);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [today, pending, sales, products, stock, customers] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS orders, COALESCE(SUM(total),0)::float8 AS revenue
         FROM orders WHERE created_at >= date_trunc('day', now()) AND status <> 'cancelled'`
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM orders WHERE status IN ('pending','confirmed')`),
      pool.query(`SELECT COALESCE(SUM(total),0)::float8 AS total FROM orders WHERE status <> 'cancelled'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE active = true`),
      pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM products WHERE active AND stock > 0 AND stock <= (SELECT low_stock_threshold FROM settings WHERE id=1)) AS low,
           (SELECT COUNT(*)::int FROM products WHERE active AND stock = 0) AS out`
      ),
      pool.query(
        `SELECT COUNT(DISTINCT customer_phone)::int AS count FROM orders`
      ),
    ]);

    res.json({
      todayOrders: today.rows[0].orders,
      todayRevenue: today.rows[0].revenue,
      pendingOrders: pending.rows[0].count,
      totalSales: sales.rows[0].total,
      products: products.rows[0].count,
      lowStock: stock.rows[0].low,
      outOfStock: stock.rows[0].out,
      customers: customers.rows[0].count,
    });
  })
);

router.get(
  '/orders/recent',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT * FROM orders ORDER BY created_at DESC LIMIT 10`
    );
    const { orderPublic } = require('../util');
    res.json({ items: rows.map(orderPublic) });
  })
);

// ----- Customers -----

router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '');
    const { page = 1, limit = 20 } = req.query;
    const per = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const pg = Math.max(Number(page) || 1, 1);
    const offset = (pg - 1) * per;
    const phoneFilter = q && q.match(/\d{4,}/) ? q.replace(/[^0-9]/g, '') : '';
    const nameFilter = q;

    const { rows, rowCount } = await pool.query(
      `SELECT
         customer_phone AS phone,
         (array_agg(customer_name ORDER BY created_at DESC))[1] AS name,
         (array_agg(NULLIF(customer_email,'') ORDER BY created_at DESC))[1] AS email,
         COUNT(*)::int AS order_count,
         COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0)::float8 AS total_spent,
         MAX(created_at) AS last_order_at
       FROM orders
       WHERE ($1 = '' OR customer_phone LIKE '%' || $1 || '%' OR customer_name ILIKE '%' || $2 || '%')
       GROUP BY customer_phone
       ORDER BY last_order_at DESC
       LIMIT $3 OFFSET $4`,
      [phoneFilter, nameFilter ? `%${nameFilter}%` : '', per, offset]
    );
    res.json({ items: rows, page: pg, total: rowCount });
  })
);

router.get(
  '/customers/:phone/orders',
  asyncHandler(async (req, res) => {
    const phone = req.params.phone.replace(/[^0-9+]/g, '');
    const { rows } = await pool.query(
      `SELECT * FROM orders WHERE customer_phone = $1 ORDER BY created_at DESC`,
      [phone]
    );
    const { orderPublic } = require('../util');
    res.json({ items: rows.map(orderPublic) });
  })
);

// ----- Notifications -----

router.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const { rows } = await pool.query(
      `SELECT * FROM notifications WHERE target_type = 'admin' ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ items: rows });
  })
);

router.get(
  '/notifications/unread',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE target_type = 'admin' AND read = false`
    );
    res.json({ count: rows[0].count });
  })
);

router.post(
  '/notifications/read',
  asyncHandler(async (_req, res) => {
    await pool.query(`UPDATE notifications SET read = true WHERE target_type = 'admin' AND read = false`);
    res.json({ ok: true });
  })
);

// ----- Settings -----

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json({ settings: rows[0] });
  })
);

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const allowed = {};
    if (b.store_open !== undefined) allowed.store_open = !!b.store_open;
    if (b.low_stock_threshold !== undefined) allowed.low_stock_threshold = Math.max(0, Number(b.low_stock_threshold) || 0);
    if (b.delivery_fee !== undefined) allowed.delivery_fee = Math.max(0, Number(b.delivery_fee) || 0);
    if (b.announcement !== undefined) allowed.announcement = String(b.announcement).slice(0, 200);

    const keys = Object.keys(allowed);
    if (!keys.length) throw new ApiError(400, 'Nothing to update.');
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    await pool.query(`UPDATE settings SET ${sets}, updated_at = now() WHERE id = $1`, [1, ...keys.map((k) => allowed[k])]);
    const { rows } = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json({ settings: rows[0] });
  })
);

module.exports = router;