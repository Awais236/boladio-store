const { pool } = require('../db');
const { orderPublic } = require('../util');

async function createNotification({ targetType, targetId, type, title, message, orderId, link }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (target_type, target_id, type, title, message, order_id, link)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [targetType, targetId || null, type, title, message || '', orderId || null, link || null]
  );
  return rows[0];
}

async function broadcastNewOrder(order) {
  await createNotification({
    targetType: 'admin',
    type: 'new_order',
    title: 'New Order',
    message: `${order.order_number} from ${order.customer_name} - ${order.item_count} item(s), total ${Number(order.total)}`,
    orderId: order.id,
    link: `/admin/orders/${order.id}`,
  });
}

async function broadcastStatusChange(order) {
  const names = {
    pending: 'Order Placed',
    confirmed: 'Order Confirmed',
    preparing: 'Order Being Prepared',
    shipped: 'Order Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  if (order.customer_id) {
    await createNotification({
      targetType: 'customer',
      targetId: order.customer_id,
      type: 'status',
      title: names[order.status] || order.status,
      message: `Your order ${order.order_number} is now ${(names[order.status] || order.status).toLowerCase()}.`,
      orderId: order.id,
      link: `/tracking?order=${order.order_number}`,
    });
  }
  await createNotification({
    targetType: 'admin',
    type: 'status',
    title: `${order.order_number} ${names[order.status] || ''}`.trim(),
    message: `${order.customer_name} - ${names[order.status] || ''}`,
    orderId: order.id,
    link: `/admin/orders/${order.id}`,
  });
}

async function notifyAdmin(title, message, { type = 'generic', orderId, link } = {}) {
  return createNotification({
    targetType: 'admin',
    type,
    title,
    message,
    orderId,
    link,
  });
}

function emitToAdmins() {}
function emitOrderToRooms() {}

module.exports = {
  emitToAdmins,
  emitOrderToRooms,
  createNotification,
  broadcastNewOrder,
  broadcastStatusChange,
  notifyAdmin,
};
