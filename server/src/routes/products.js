const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../db');
const { ApiError, asyncHandler, slugify } = require('../util');
const { authRequired, requireAdmin } = require('../auth');
const { notifyAdmin } = require('../realtime/notify');

const router = express.Router();

const PRODUCT_FIELDS = `
  p.id, p.name, p.slug, p.category_id, p.short_desc, p.description, p.fabric_care, p.fabric,
  p.price::float8 AS price, p.sale_price::float8 AS sale_price,
  p.stock, p.sizes, p.colors, p.images, p.thumbnail, p.featured, p.is_new, p.active,
  p.created_at, p.updated_at, c.name AS category, c.slug AS category_slug
`;

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    category: row.category,
    categorySlug: row.category_slug,
    shortDesc: row.short_desc,
    description: row.description,
    fabricCare: row.fabric_care,
    fabric: row.fabric,
    price: row.price,
    salePrice: row.sale_price,
    stock: row.stock,
    inStock: row.stock > 0,
    sizes: row.sizes || [],
    colors: row.colors || [],
    images: row.images || [],
    thumbnail: row.thumbnail || (row.images && row.images[0]),
    featured: row.featured,
    isNew: row.is_new,
    active: row.active,
    createdAt: row.created_at,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      category, minPrice, maxPrice, sizes, colors, fabric, availability,
      sort = 'featured', page = 1, limit = 12, q, is_new, featured, collection,
    } = req.query;

    const where = ['p.active = true'];
    const params = [];
    const add = (val) => {
      params.push(val);
      return `$${params.length}`;
    };

    if (category) {
      where.push(`p.category_id = (SELECT id FROM categories WHERE slug = ${add(category)})`);
    }
    if (is_new === 'true' || collection === 'new') where.push('p.is_new = true');
    if (featured === 'true') where.push('p.featured = true');
    if (minPrice !== undefined && minPrice !== '') {
      where.push(`COALESCE(p.sale_price, p.price) >= ${add(Number(minPrice))}`);
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      where.push(`COALESCE(p.sale_price, p.price) <= ${add(Number(maxPrice))}`);
    }
    if (sizes) {
      const list = String(sizes).split(',').filter(Boolean);
      if (list.length) where.push(`p.sizes && ${add(list)}::text[]`);
    }
    if (colors) {
      const list = String(colors).split(',').filter(Boolean);
      if (list.length) {
        where.push(
          `EXISTS (SELECT 1 FROM jsonb_array_elements(p.colors) c WHERE c->>'name' = ANY(${add(list)}::text[]))`
        );
      }
    }
    if (fabric) {
      const list = String(fabric).split(',').filter(Boolean);
      if (list.length) {
        where.push(
          `(SELECT bool_or(LOWER(p.fabric) LIKE '%' || LOWER(x) || '%') FROM unnest(${add(list)}::text[]) AS x)`
        );
      }
    }
    if (availability === 'in_stock') where.push('p.stock > 0');
    if (availability === 'out_of_stock') where.push('p.stock = 0');
    if (availability === 'on_sale') where.push('p.sale_price IS NOT NULL AND p.sale_price < p.price');
    if (q) {
      where.push(`(p.name ILIKE ${add(`%${q}%`)} OR p.description ILIKE ${add(`%${q}%`)} OR p.fabric ILIKE ${add(`%${q}%`)})`);
    }

    const orderBy = {
      newest: 'p.created_at DESC',
      price_asc: 'COALESCE(p.sale_price, p.price) ASC',
      price_desc: 'COALESCE(p.sale_price, p.price) DESC',
      featured: 'p.featured DESC, p.created_at DESC',
    }[sort] || 'p.featured DESC, p.created_at DESC';

    const per = Math.min(Math.max(Number(limit) || 12, 1), 48);
    const pg = Math.max(Number(page) || 1, 1);
    const offset = (pg - 1) * per;

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM products p WHERE ${where.join(' AND ')}`,
      params.filter((p) => p !== null)
    );
    const total = countRes.rows[0].total;

    const { rows } = await pool.query(
      `SELECT ${PRODUCT_FIELDS}
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params.filter((p) => p !== null), per, offset]
    );

    res.json({ items: rows.map(mapProduct), total, page: pg, pages: Math.ceil(total / per) });
  })
);

router.get(
  '/facets',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT
        (SELECT jsonb_agg(DISTINCT c->>'name') FROM products p2, jsonb_array_elements(p2.colors) c WHERE p2.active) AS colors,
        (SELECT jsonb_agg(DISTINCT s) FROM products p3, unnest(p3.sizes) s WHERE p3.active) AS sizes,
        (SELECT jsonb_agg(DISTINCT p4.fabric) FROM products p4 WHERE p4.active AND p4.fabric IS NOT NULL) AS fabrics
    `);
    const r = rows[0] || {};
    res.json({
      colors: r.colors || [],
      sizes: r.sizes || [],
      fabrics: r.fabrics || [],
    });
  })
);

router.get(
  '/by-ids',
  asyncHandler(async (req, res) => {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((x) => Number(x))
      .filter((x) => x > 0);
    if (!ids.length) return res.json({ items: [] });
    const { rows } = await pool.query(
      `SELECT ${PRODUCT_FIELDS}
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ANY($1::int[]) AND p.active = true`,
      [ids]
    );
    res.json({ items: rows.map(mapProduct) });
  })
);

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 1) return res.json({ items: [] });
    const { rows } = await pool.query(
      `SELECT ${PRODUCT_FIELDS}
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.active = true AND (
         p.name ILIKE '%' || $1 || '%' OR p.description ILIKE '%' || $1 || '%' OR p.fabric ILIKE '%' || $1 || '%'
         OR c.name ILIKE '%' || $1 || '%')
       ORDER BY p.created_at DESC LIMIT 8`,
      [q]
    );
    res.json({ items: rows.map(mapProduct) });
  })
);

function validateProductPayload(req) {
  const b = req.body || {};
  const errors = [];
  if (!b.name || String(b.name).trim().length < 2) errors.push('Name is required.');
  if (!b.categoryId) errors.push('Category is required.');
  if (b.price === undefined || Number(b.price) <= 0) errors.push('Price must be greater than 0.');
  if (errors.length) throw new ApiError(400, errors[0]);
}

router.post(
  '/',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    validateProductPayload(req);
    const b = req.body;
    const images = Array.isArray(b.images) ? b.images : [];
    if (!images.length) throw new ApiError(400, 'Please add at least one product image.');
    const slug = slugify(b.name) + '-' + Date.now().toString(36);

    const { rows } = await pool.query(
      `INSERT INTO products
        (category_id, name, slug, short_desc, description, fabric_care, fabric, price, sale_price, stock, sizes, colors, images, thumbnail, featured, is_new)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [
        b.categoryId, b.name.trim(), slug, b.shortDesc || '', b.description || '', b.fabricCare || '',
        b.fabric || '', Number(b.price), b.salePrice ? Number(b.salePrice) : null,
        Math.max(0, Number(b.stock) || 0), b.sizes || ['S', 'M', 'L'], JSON.stringify(b.colors || []),
        JSON.stringify(images), images[0], !!b.featured, !!b.isNew,
      ]
    );
    res.status(201).json({ id: rows[0].id });
  })
);

const idOrSlug = param('id').custom((v) => true);

router.patch(
  '/:id',
  authRequired,
  requireAdmin,
  idOrSlug,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(400, 'Invalid product identifier.');
    const b = req.body;
    const { rows } = await pool.query(`SELECT id FROM products WHERE id = $1 OR slug = $1`, [req.params.id]);
    if (!rows.length) throw new ApiError(404, 'Product not found.');
    const pid = rows[0].id;
    const images = Array.isArray(b.images) && b.images.length ? b.images : rows[0].images;

    const { rows: updated } = await pool.query(
      `UPDATE products SET
        category_id = COALESCE($2, category_id),
        name = $3,
        short_desc = $4, description = $5, fabric_care = $6, fabric = $7,
        price = $8,
        sale_price = $9,
        stock = $10,
        sizes = $11, colors = $12, images = $13, thumbnail = $14,
        featured = COALESCE($15, featured), is_new = COALESCE($16, is_new), active = COALESCE($17, active),
        updated_at = now()
       WHERE id = $1 RETURNING id`,
      [
        pid,
        b.categoryId ?? null,
        (b.name || '').trim(),
        b.shortDesc || '', b.description || '', b.fabricCare || '', b.fabric || '',
        Number(b.price),
        b.salePrice ? Number(b.salePrice) : null,
        Math.max(0, Number(b.stock) || 0),
        b.sizes || ['S', 'M', 'L'], JSON.stringify(b.colors || []), JSON.stringify(images),
        b.thumbnail || images[0], b.featured, b.isNew, b.active,
      ]
    );
    res.json({ id: updated[0].id });
  })
);

router.delete(
  '/:id',
  authRequired,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) throw new ApiError(404, 'Product not found.');
    res.json({ ok: true });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const { rows } = await pool.query(
      `SELECT ${PRODUCT_FIELDS}
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.active = true AND (p.slug = $1 OR CAST(p.id AS TEXT) = $1)`,
      [req.params.id]
    );
    if (!rows.length) return next(new ApiError(404, 'Product not found.'));
    res.json({ product: mapProduct(rows[0]) });
  })
);

module.exports = router;
module.exports.mapProduct = mapProduct;