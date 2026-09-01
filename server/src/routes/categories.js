const express = require('express');
const { pool } = require('../db');
const { ApiError, asyncHandler, slugify } = require('../util');
const { authRequired, requireAdmin } = require('../auth');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(p.id)::int AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.active
       WHERE c.active = true
       GROUP BY c.id ORDER BY c.position ASC`
    );
    res.json({ items: rows });
  })
);

router.post(
  '/',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.name || String(b.name).trim().length < 2) throw new ApiError(400, 'Category name is required.');
    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, tagline, description, image_url, position)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [
        String(b.name).trim(), slugify(b.name) + '-' + Date.now().toString(36),
        b.tagline || '', b.description || '', b.image_url || '',
        Math.max(0, Number(b.position) || 0),
      ]
    );
    res.status(201).json({ id: rows[0].id });
  })
);

router.patch(
  '/:id',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const { rowCount } = await pool.query(
      `UPDATE categories SET
        name = COALESCE($2, name), tagline = COALESCE($3, tagline),
        description = COALESCE($4, description), image_url = COALESCE($5, image_url),
        position = COALESCE($6, position), active = COALESCE($7, active)
       WHERE id = $1`,
      [
        req.params.id, b.name, b.tagline || null, b.description || null,
        b.image_url || null, b.position === undefined ? null : Number(b.position),
        b.active === undefined ? null : !!b.active,
      ]
    );
    if (!rowCount) throw new ApiError(404, 'Category not found.');
    res.json({ ok: true });
  })
);

router.delete(
  '/:id',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    if (!rowCount) throw new ApiError(404, 'Category not found.');
    res.json({ ok: true });
  })
);

module.exports = router;