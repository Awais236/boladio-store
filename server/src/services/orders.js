const { pool } = require('../db');
const { ApiError, isValidPakistaniPhone, cleanPhone } = require('../util');
const { broadcastNewOrder, notifyAdmin, emitOrderToRooms } = require('../realtime/notify');
const { getCustomerWaLink, getAdminNewOrderWaLink } = require('./whatsapp');
const { sendOrderEmail } = require('./email');

const VALID_STATUS = ['pending', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const ACTIVE_STATUS = ['pending', 'confirmed', 'preparing', 'shipped', 'out_for_delivery'];

async function getSettings() {
  const { rows } = await pool.query('SELECT * FROM settings WHERE id = 1');
  return rows[0] || { store_open: true, delivery_fee: 250, low_stock_threshold: 5 };
}

async function placeOrder({ items, customer }) {
  const { customerName, customerPhone, customerEmail, city, area, address, postalCode, notes, userId } = customer;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Your cart is empty.');
  }
  if (!customerName || String(customerName).trim().length < 2) {
    throw new ApiError(400, 'Please provide your full name.');
  }
  const phone = cleanPhone(customerPhone);
  if (!isValidPakistaniPhone(phone)) {
    throw new ApiError(400, 'Please enter a valid Pakistani mobile number, e.g. 03xx xxxxxxx.');
  }
  if (!address || String(address).trim().length < 8) {
    throw new ApiError(400, 'Please provide a complete delivery address.');
  }
  if (!city || String(city).trim().length < 2) {
    throw new ApiError(400, 'Please provide your city.');
  }

  const settings = await getSettings();
  if (!settings.store_open) {
    throw new ApiError(403, 'We are currently not taking orders. Please check back shortly.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Load fresh product rows (never trust client prices).
    const seen = new Map();
    for (const it of items) {
      seen.set(Number(it.productId), (seen.get(Number(it.productId)) || 0) + Number(it.qty || 1));
    }
    const { rows: products } = await client.query(
      `SELECT id, name, slug, price, sale_price, stock, thumbnail FROM products WHERE id = ANY($1::int[])`,
      [[...seen.keys()]]
    );
    if (products.length !== seen.size) {
      throw new ApiError(400, 'Some products in your cart are no longer available.');
    }

    const orderItems = [];
    let subtotal = 0;
    for (const p of products) {
      const qty = seen.get(p.id);
      if (p.stock < qty) {
        throw new ApiError(
          409,
          `Only ${p.stock} left of "${p.name}". Please reduce the quantity or remove it from your cart.`
        );
      }
      const unit = Number(p.sale_price || p.price);
      orderItems.push({
        productId: p.id,
        name: p.name,
        slug: p.slug,
        price: unit,
        qty,
        size: String(items.find((i) => Number(i.productId) === p.id)?.size || ''),
        color: String(items.find((i) => Number(i.productId) === p.id)?.color || ''),
        image: p.thumbnail,
      });
      subtotal += unit * qty;
    }

    const deliveryFee = Number(settings.delivery_fee || 250);
    const total = subtotal + deliveryFee;

    // Decrement stock for each item.
    for (const it of orderItems) {
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [it.qty, it.productId]);
    }

    const { rows: inserted } = await client.query(
      `INSERT INTO orders
        (order_number, customer_id, customer_name, customer_phone, customer_email, city, area, address, postal_code, notes,
         items, item_count, subtotal, delivery_fee, total, payment_method, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'cod','unpaid')
       RETURNING *`,
      [
        'NF-0000', userId || null, String(customerName).trim(), phone,
        customerEmail ? String(customerEmail).trim() : null,
        String(city).trim(), area ? String(area).trim() : null,
        String(address).trim(), postalCode ? String(postalCode).trim() : null,
        notes ? String(notes).trim() : null,
        JSON.stringify(orderItems), orderItems.reduce((s, i) => s + i.qty, 0),
        subtotal, deliveryFee, total,
      ]
    );
    const order = inserted[0];
    order.order_number = `NF-${10000 + order.id}`;
    order.confirm_token = require('crypto').randomBytes(32).toString('hex');
    await client.query('UPDATE orders SET order_number = $1, confirm_token = $2 WHERE id = $3', [order.order_number, order.confirm_token, order.id]);

    // Duplicate order detection (COD protection).
    const recent = await client.query(
      `SELECT id FROM orders WHERE customer_phone = $1 AND total = $2 AND created_at > now() - interval '10 minutes'
       AND status <> 'cancelled'`,
      [phone, total]
    );
    if (recent.rowCount >= 2) {
      await client.query('UPDATE orders SET suspicious = true WHERE id = $1', [order.id]);
      order.suspicious = true;
    }

    // Low stock / out of stock notifications.
    await checkStockLevels(client, orderItems, settings.low_stock_threshold);

    await client.query('COMMIT');

    broadcastNewOrder(order);
    emitOrderToRooms(order);

    // Send email confirmation to customer
    sendOrderEmail(order, 'pending').catch(() => {});

    // Send WhatsApp confirmation to admin
    const adminWaLink = getAdminNewOrderWaLink(order);
    if (adminWaLink) {
      notifyAdmin(
        'WhatsApp Ready',
        `Click to confirm ${order.order_number} via WhatsApp`,
        { type: 'whatsapp', link: `/admin/orders/${order.id}` }
      ).catch(() => {});
    }

    // Attach wa_link to returned order
    order.wa_link = adminWaLink;

    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function checkStockLevels(client, orderItems, threshold) {
  for (const it of orderItems) {
    const { rows } = await client.query(
      `SELECT stock, low_stock_notified, out_stock_notified, name FROM products WHERE id = $1`,
      [it.productId]
    );
    const p = rows[0];
    if (!p) continue;
    if (p.stock === 0 && !p.out_stock_notified) {
      await client.query('UPDATE products SET out_stock_notified = true WHERE id = $1', [it.productId]);
      notifyAdmin(
        'Product out of stock',
        `"${p.name}" is now out of stock.`,
        { type: 'stock_out', link: `/admin/products` }
      ).catch(() => {});
    } else if (p.stock <= threshold && !p.low_stock_notified) {
      await client.query('UPDATE products SET low_stock_notified = true WHERE id = $1', [it.productId]);
      notifyAdmin(
        'Low stock warning',
        `Only ${p.stock} left of "${p.name}".`,
        { type: 'low_stock', link: '/admin/products' }
      ).catch(() => {});
    }
  }
}

async function updateOrderStatus(orderId, status) {
  if (!VALID_STATUS.includes(status)) throw new ApiError(400, 'Invalid order status.');
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = rows[0];
  if (!order) throw new ApiError(404, 'Order not found.');

  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['shipped', 'cancelled'],
    shipped: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: [],
  };
  const allowed = transitions[order.status] || [];
  if (status !== order.status && !allowed.includes(status)) {
    throw new ApiError(400, `Cannot move an order from "${order.status}" to "${status}".`);
  }

  const { rows: updated } = await pool.query(
    `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, orderId]
  );
  const next = updated[0];

  if (status === 'delivered') {
    await pool.query(`UPDATE orders SET payment_status = 'paid' WHERE id = $1`, [orderId]);
    next.payment_status = 'paid';
  }
  if (status === 'cancelled' && order.items) {
    // Restock cancelled orders.
    for (const it of order.items) {
      await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [it.qty, it.productId]);
    }
  }

  const { broadcastStatusChange } = require('../realtime/notify');
  await broadcastStatusChange(next);

  // Send email to customer on status change
  sendOrderEmail(next, status).catch(() => {});

  // Send WhatsApp to customer on status change
  const waLink = getCustomerWaLink(next, status);
  if (waLink) {
    notifyAdmin(
      'WhatsApp Ready',
      `Click to send ${status} update to ${order.customer_name} via WhatsApp`,
      { type: 'whatsapp', link: `/admin/orders/${order.id}` }
    ).catch(() => {});
  }

  // Attach wa_link to returned order
  next.wa_link = waLink;

  return next;
}

module.exports = { placeOrder, updateOrderStatus, getSettings, VALID_STATUS, ACTIVE_STATUS };