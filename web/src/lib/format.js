export function formatPKR(n) {
  return 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(iso);
}

export const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', step: 0 },
  { key: 'confirmed', label: 'Order Confirmed', step: 1 },
  { key: 'preparing', label: 'Preparing', step: 2 },
  { key: 'shipped', label: 'Shipped', step: 3 },
  { key: 'out_for_delivery', label: 'Out for Delivery', step: 4 },
  { key: 'delivered', label: 'Delivered', step: 5 },
];

export function statusLabel(key) {
  const s = ORDER_STATUSES.find((x) => x.key === key);
  return s ? s.label : key;
}

export const WHATSAPP = (msg) =>
  `https://wa.me/9201234567890?text=${encodeURIComponent(msg || '')}`;