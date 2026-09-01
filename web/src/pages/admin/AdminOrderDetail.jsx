import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import StatusPill from '../../components/admin/StatusPill';
import ProductImage from '../../components/ProductImage';
import OrderTimeline from '../../components/OrderTimeline';
import { useToast } from '../../context/ToastContext';
import { Ic } from '../../lib/icons';
import { formatPKR, formatDateTime, statusLabel } from '../../lib/format';

const NEXT = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api(`/orders/admin/${id}`).then(({ order: o }) => setOrder(o)).catch(() => setLoading(false)).finally(() => setLoading(false));
    const socket = getSocket();
    const onUpdate = (o) => {
      if (o && String(o.id) === String(id)) setOrder(o);
    };
    socket.on('admin:order:update', onUpdate);
    return () => socket.off('admin:order:update', onUpdate);
  }, [id]);

  const setStatus = async (status) => {
    try {
      const { order: o } = await api(`/orders/admin/${id}/status`, { method: 'PATCH', body: { status } });
      setOrder(o);
      toast.success(`Order moved to ${statusLabel(status)}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const verify = async () => {
    await api(`/orders/admin/${id}/verify`, { method: 'PATCH' });
    setOrder((o) => ({ ...o, suspicious: false }));
    toast.success('Order marked as verified');
  };

  if (loading) return <div className="sk" style={{ height: 260, borderRadius: 14 }} />;
  if (!order) return <p className="dim">Order not found.</p>;

  const next = NEXT[order.status] || [];

  return (
    <div style={{ maxWidth: 980 }}>
      <div className="row" style={{ marginBottom: 16, gap: 10 }}>
        <Link to="/admin/orders" className="btn btn-outline btn-sm"><Ic.Arrow width={13} height={13} style={{ transform: 'rotate(180deg)' }} /> All Orders</Link>
        <h2 style={{ fontSize: 24 }}>#{order.orderNumber}</h2>
        <StatusPill status={order.status} suspicious={order.suspicious} />
        {order.suspicious && (
          <button className="btn btn-ghost btn-sm" onClick={verify}><Ic.CheckCircle width={14} height={14} /> Mark Verified</button>
        )}
      </div>

      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
        {next.map((s) => (
          <button key={s} className={`btn btn-sm ${s === 'cancelled' ? 'btn-outline' : 'btn-dark'}`} onClick={() => setStatus(s)}>
            Mark as {statusLabel(s)}
          </button>
        ))}
        {next.length === 0 && <span className="dim small">No further actions — order is {order.status}.</span>}
      </div>

      {order.customerPhone && (
        <div className="checkout-card" style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>
            <span style={{ color: '#25d366' }}>&#9742;</span> Quick Contact
          </h3>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {order.confirmToken && (
              <a
                href={`https://wa.me/${(order.customerPhone || '').replace(/[^0-9]/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(
                  `Assalam-o-Alaikum ${order.customerName},\n\nThank you for your order ${order.orderNumber} from Boliolo.\n\nTotal: PKR ${Number(order.total).toLocaleString('en-PK')}\nPayment: Cash on Delivery\n\nTo confirm your order:\n${window.location.origin}/order/confirm/${order.confirmToken}\n\nOr simply reply:\n1 = Confirm order\n0 = Cancel order\n\nPlease confirm within 24 hours.\n\n- Boliolo`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{ background: '#25d366', color: '#fff' }}
              >
                WhatsApp Customer
              </a>
            )}
            {!order.confirmToken && (
              <a
                href={`https://wa.me/${(order.customerPhone || '').replace(/[^0-9]/g, '').replace(/^0/, '92')}?text=${encodeURIComponent(`Assalam-o-Alaikum ${order.customerName},\n\nThank you for your order ${order.orderNumber} from Boliolo.\n\nWe will confirm your order shortly.\n\n- Boliolo`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{ background: '#25d366', color: '#fff' }}
              >
                WhatsApp Customer
              </a>
            )}
            <a
              href={`tel:${order.customerPhone}`}
              className="btn btn-outline btn-sm"
            >
              Call Customer
            </a>
          </div>
        </div>
      )}

      {order.notes && (
        <div style={{ background: 'rgba(166,124,82,0.08)', borderLeft: '3px solid var(--gold)', padding: '12px 16px', borderRadius: 8, marginBottom: 18 }}>
          <strong className="small">📝 Order notes:</strong> {order.notes}
        </div>
      )}

      <div className="checkout-card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>Customer & Delivery</h3>
        <div className="form-row">
          <div><div className="k small dim" style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 11 }}>Name</div><strong>{order.customerName}</strong></div>
          <div><div className="k small dim" style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 11 }}>Phone</div><strong>{order.customerPhone}</strong></div>
          <div><div className="k small dim" style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 11 }}>Email</div><strong>{order.customerEmail || '—'}</strong></div>
          <div><div className="k small dim" style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 11 }}>Placed</div><strong>{formatDateTime(order.createdAt)}</strong></div>
        </div>
        <div className="mt-16">
          <div className="k small dim" style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 11 }}>Delivery Address</div>
          <p style={{ marginTop: 4 }}>{order.address}, {order.area ? order.area + ', ' : ''}{order.city}{order.postalCode ? ` · ${order.postalCode}` : ''}</p>
        </div>
      </div>

      <div className="checkout-card">
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>Items ({order.itemCount})</h3>
        {(order.items || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px dashed var(--line)', alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }}>
            <ProductImage src={it.image} alt={it.name} style={{ width: 44, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</strong>
              <div className="dim small">
                {it.size && <>Size {it.size} · </>}{it.color && <>Colour {it.color} · </>}Qty {it.qty}
              </div>
            </div>
            <span style={{ flexShrink: 0 }}>{formatPKR(it.price)}</span>
            <span className="dim small" style={{ flexShrink: 0 }}>{formatPKR(it.price * it.qty)}</span>
          </div>
        ))}
        <div className="sm-row mt-16"><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
        <div className="sm-row"><span>Delivery</span><span>{formatPKR(order.deliveryFee)}</span></div>
        <div className="sm-row total"><span>Total</span><span>{formatPKR(order.total)}</span></div>
      </div>

      <div className="checkout-card">
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>Order Status</h3>
        <OrderTimeline status={order.status} cancelled={order.status === 'cancelled'} />
      </div>
    </div>
  );
}