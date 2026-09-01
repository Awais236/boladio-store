const { brand } = require('../config');

const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5175';

const STATUS_MESSAGES = {
  pending: (order) => {
    const items = (order.items || []).map((it) => `  ${it.name} x${it.qty}`).join('\n');
    const confirmLink = order.confirm_token ? `${WEB_ORIGIN}/order/confirm/${order.confirm_token}` : '';
    return [
      `Assalam-o-Alaikum ${order.customer_name},`,
      ``,
      `Thank you for your order *${order.order_number}* from ${brand.name}.`,
      ``,
      `Items:`,
      items,
      ``,
      `Total: *PKR ${Number(order.total).toLocaleString('en-PK')}*`,
      `Payment: Cash on Delivery`,
      ``,
      `To confirm your order:`,
      `${confirmLink}`,
      ``,
      `Or simply reply:`,
      `*1* = Confirm order`,
      `*0* = Cancel order`,
      ``,
      `Please confirm within 24 hours.`,
      ``,
      `- ${brand.name}`,
    ].filter(Boolean).join('\n');
  },
  confirmed: (order) =>
    `Assalam-o-Alaikum ${order.customer_name},\n\nGreat news! Your order *${order.order_number}* has been *confirmed*.\n\nWe are now preparing your items. You will receive another update once it ships.\n\nThank you for shopping with ${brand.name}!`,
  preparing: (order) =>
    `Assalam-o-Alaikum ${order.customer_name},\n\nYour order *${order.order_number}* is now being *prepared*.\n\nIt will be shipped soon. Stay tuned!`,
  shipped: (order) =>
    `Assalam-o-Alaikum ${order.customer_name},\n\nExciting news! Your order *${order.order_number}* has been *shipped*.\n\nExpected delivery: 2-5 business days.\nPlease keep PKR ${Number(order.total).toLocaleString('en-PK')} ready for Cash on Delivery.`,
  out_for_delivery: (order) =>
    `Assalam-o-Alaikum ${order.customer_name},\n\nYour order *${order.order_number}* is *out for delivery* today!\n\nPlease keep PKR ${Number(order.total).toLocaleString('en-PK')} ready for payment.`,
  delivered: (order) =>
    `Assalam-o-Alaikum ${order.customer_name},\n\nYour order *${order.order_number}* has been *delivered*.\nThank you for shopping with ${brand.name}! We hope you love your purchase.\n\nYour feedback means the world to us. Please visit us again!`,
  cancelled: (order) =>
    `Assalam-o-Alaikum ${order.customer_name},\n\nYour order *${order.order_number}* has been *cancelled*.\n\nIf you have any questions, please contact us at ${brand.phone}.`,
};

function generateWaLink(phone, message) {
  const cleaned = String(phone).replace(/[^0-9]/g, '');
  const international = cleaned.startsWith('92') ? cleaned : cleaned.startsWith('0') ? '92' + cleaned.slice(1) : cleaned;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${international}?text=${encoded}`;
}

function newOrderAdminMessage(order) {
  const items = (order.items || []).map((it) => `  ${it.name} x${it.qty}`).join('\n');
  return [
    `New order received!`,
    ``,
    `Order: *${order.order_number}*`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    order.customer_email ? `Email: ${order.customer_email}` : null,
    `City: ${order.city}${order.area ? ', ' + order.area : ''}`,
    ``,
    `Items:\n${items}`,
    ``,
    `Total: PKR ${Number(order.total).toLocaleString('en-PK')}`,
    order.suspicious ? `\n⚠️ FLAGGED AS SUSPICIOUS` : null,
    ``,
    `Delivery Address:\n${order.address}`,
    order.notes ? `\nNotes: ${order.notes}` : null,
  ].filter(Boolean).join('\n');
}

function getCustomerWaLink(order, status) {
  const msgFn = STATUS_MESSAGES[status];
  if (!msgFn || !order.customer_phone) return null;
  const message = msgFn({
    ...order,
    confirm_token: order.confirm_token || null,
  });
  return generateWaLink(order.customer_phone, message);
}

function getAdminNewOrderWaLink(order) {
  if (!order.customer_phone) return null;
  const confirmLink = order.confirm_token ? `${WEB_ORIGIN}/order/confirm/${order.confirm_token}` : '';
  const message = [
    `Assalam-o-Alaikum ${order.customer_name},`,
    ``,
    `Thank you for your order *${order.order_number}* from ${brand.name}.`,
    ``,
    `Total: *PKR ${Number(order.total).toLocaleString('en-PK')}*`,
    `Payment: Cash on Delivery`,
    ``,
    `To confirm your order:`,
    `${confirmLink}`,
    ``,
    `Or simply reply:`,
    `*1* = Confirm order`,
    `*0* = Cancel order`,
    ``,
    `Please confirm within 24 hours.`,
    ``,
    `- ${brand.name}`,
  ].filter(Boolean).join('\n');
  return generateWaLink(order.customer_phone, message);
}

module.exports = { generateWaLink, getCustomerWaLink, getAdminNewOrderWaLink, newOrderAdminMessage, STATUS_MESSAGES };
