class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function cleanPhone(phone) {
  return String(phone || '')
    .trim()
    .replace(/[^0-9+]/g, '');
}

function isValidPakistaniPhone(phone) {
  const p = cleanPhone(phone);
  // Accept 03xx-xxxxxxx or +92 3xx-xxxxxxx
  return /^(\+92|0)?3[0-9]{9}$/.test(p);
}

function formatPKR(n) {
  const num = Number(n || 0);
  return 'PKR ' + num.toLocaleString('en-PK');
}

function orderPublic(order) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    city: order.city,
    area: order.area,
    address: order.address,
    postalCode: order.postal_code,
    notes: order.notes,
    items: order.items,
    itemCount: order.item_count,
    subtotal: Number(order.subtotal || 0),
    deliveryFee: Number(order.delivery_fee || 0),
    total: Number(order.total || 0),
    suspicious: order.suspicious,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    waLink: order.wa_link || null,
    confirmToken: order.confirm_token || null,
  };
}

module.exports = {
  ApiError,
  asyncHandler,
  slugify,
  cleanPhone,
  isValidPakistaniPhone,
  formatPKR,
  orderPublic,
};