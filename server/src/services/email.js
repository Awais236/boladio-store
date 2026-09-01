const nodemailer = require('nodemailer');
const { brand } = require('../config');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return transporter;
}

function formatPKR(n) {
  return 'PKR ' + Number(n).toLocaleString('en-PK');
}

const SUBJECTS = {
  pending: (o) => `Order Received - ${o.order_number}`,
  confirmed: (o) => `Order Confirmed - ${o.order_number}`,
  preparing: (o) => `Order Being Prepared - ${o.order_number}`,
  shipped: (o) => `Order Shipped - ${o.order_number}`,
  out_for_delivery: (o) => `Out for Delivery - ${o.order_number}`,
  delivered: (o) => `Order Delivered - ${o.order_number}`,
  cancelled: (o) => `Order Cancelled - ${o.order_number}`,
};

function buildHtml(order, status) {
  const items = (order.items || [])
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;">${it.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${it.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;">${formatPKR(it.price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;font-weight:600;">${formatPKR(it.price * it.qty)}</td>
      </tr>`
    )
    .join('');

  const statusColors = {
    pending: '#a67c52',
    confirmed: '#5b8fa0',
    preparing: '#d9a441',
    shipped: '#5b6ca0',
    out_for_delivery: '#5b6ca0',
    delivered: '#2e7d5b',
    cancelled: '#b6402e',
  };

  const statusLabels = {
    pending: 'Order Placed',
    confirmed: 'Confirmed',
    preparing: 'Being Prepared',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="text-align:center;padding:24px 0;border-bottom:2px solid #a67c52;">
      <h1 style="font-family:Georgia,serif;font-size:22px;color:#1c1917;margin:0;">${brand.name}</h1>
    </div>

    <div style="padding:24px 0;">
      <h2 style="font-size:18px;color:#1c1917;margin:0 0 4px;">Hello ${order.customer_name},</h2>
      <p style="color:#76706a;font-size:14px;margin:0 0 20px;">${getStatusLabel(status, order)}</p>

      <div style="background:#fff;border:1px solid #e8e2d9;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#76706a;">Order</div>
            <div style="font-weight:600;font-size:16px;">${order.order_number}</div>
          </div>
          <div style="background:${statusColors[status] || '#a67c52'};color:#fff;padding:6px 14px;border-radius:999px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">
            ${statusLabels[status] || status}
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:2px solid #e8e2d9;">
              <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#76706a;text-align:left;">Item</th>
              <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#76706a;text-align:center;">Qty</th>
              <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#76706a;text-align:right;">Price</th>
              <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#76706a;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>

        <div style="border-top:1px solid #e8e2d9;margin-top:12px;padding-top:12px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#76706a;margin-bottom:4px;">
            <span>Subtotal</span><span>${formatPKR(order.subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#76706a;margin-bottom:8px;">
            <span>Delivery</span><span>${formatPKR(order.delivery_fee)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:600;color:#1c1917;border-top:1px solid #e8e2d9;padding-top:8px;">
            <span>Total</span><span>${formatPKR(order.total)}</span>
          </div>
        </div>
      </div>

      <div style="background:#fff;border:1px solid #e8e2d9;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#76706a;margin-bottom:6px;">Delivery Address</div>
        <div style="font-size:14px;color:#1c1917;">${order.address}, ${order.area ? order.area + ', ' : ''}${order.city}${order.postal_code ? ' ' + order.postal_code : ''}</div>
      </div>

      <div style="background:#fff;border:1px solid #e8e2d9;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#76706a;margin-bottom:6px;">Payment</div>
        <div style="font-size:14px;color:#1c1917;">Cash on Delivery · ${order.payment_status === 'paid' ? 'Paid' : 'Pay on delivery'}</div>
      </div>

      ${status === 'shipped' || status === 'out_for_delivery' ? `
      <div style="background:#f4efe8;border-radius:12px;padding:16px 20px;margin-bottom:20px;border-left:3px solid #a67c52;">
        <div style="font-size:13px;color:#3f3a36;">Please keep <strong>${formatPKR(order.total)}</strong> ready for payment when your order arrives.</div>
      </div>` : ''}

      ${status === 'delivered' ? `
      <div style="text-align:center;padding:20px 0;">
        <p style="font-size:15px;color:#2e7d5b;font-weight:600;">Thank you for shopping with us!</p>
        <p style="font-size:13px;color:#76706a;">We hope you love your purchase. Visit us again soon.</p>
      </div>` : ''}

      <div style="text-align:center;padding:16px 0;border-top:1px solid #e8e2d9;margin-top:16px;">
        <p style="font-size:12px;color:#a49e96;">
          Questions? Contact us at ${brand.phone} or visit ${brand.address}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getStatusLabel(status, order) {
  const labels = {
    pending: `We've received your order ${order.order_number}. We'll confirm it shortly.`,
    confirmed: `Great news! Your order ${order.order_number} has been confirmed and we're getting it ready.`,
    preparing: `Your order ${order.order_number} is being prepared with care.`,
    shipped: `Your order ${order.order_number} has been shipped and is on its way to you!`,
    out_for_delivery: `Your order ${order.order_number} is out for delivery today!`,
    delivered: `Your order ${order.order_number} has been delivered. Thank you!`,
    cancelled: `Your order ${order.order_number} has been cancelled.`,
  };
  return labels[status] || `Your order ${order.order_number} status has been updated.`;
}

async function sendOrderEmail(order, status) {
  const transport = getTransporter();
  if (!transport) return null;

  const subjectFn = SUBJECTS[status];
  if (!subjectFn) return null;

  const customerEmail = order.customer_email;
  if (!customerEmail) return null;

  try {
    const info = await transport.sendMail({
      from: `"${brand.name}" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: subjectFn(order),
      html: buildHtml(order, status),
    });
    return info;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return null;
  }
}

module.exports = { sendOrderEmail };
