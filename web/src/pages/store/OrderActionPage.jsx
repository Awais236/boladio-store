import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductImage from '../../components/ProductImage';
import { formatPKR } from '../../lib/format';
import { Ic } from '../../lib/icons';

export default function OrderActionPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [finalStatus, setFinalStatus] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/public/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setOrder(d.order);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirm = async () => {
    setActing(true);
    try {
      const r = await fetch(`/api/orders/public/${token}/confirm`, { method: 'POST' });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setFinalStatus('confirmed');
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    setActing(true);
    try {
      const r = await fetch(`/api/orders/public/${token}/cancel`, { method: 'POST' });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setFinalStatus('cancelled');
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5' }}>
        <div className="sk" style={{ width: 380, height: 320, borderRadius: 16 }} />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center', border: '1px solid #e8e2d9' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 8 }}>Order Not Found</h2>
          <p style={{ color: '#76706a', fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid #e8e2d9', boxShadow: '0 6px 24px rgba(28,25,23,0.09)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
            background: finalStatus === 'confirmed' ? 'rgba(46,125,91,0.1)' : 'rgba(182,64,46,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {finalStatus === 'confirmed'
              ? <Ic.CheckCircle style={{ color: '#2e7d5b', width: 36, height: 36 }} />
              : <Ic.X style={{ color: '#b6402e', width: 36, height: 36 }} />}
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, marginBottom: 8 }}>
            {finalStatus === 'confirmed' ? 'Order Confirmed!' : 'Order Cancelled'}
          </h1>
          <p style={{ color: '#76706a', fontSize: 14, lineHeight: 1.6 }}>
            {finalStatus === 'confirmed'
              ? `Thank you, ${order.customerName}! Your order ${order.orderNumber} has been confirmed. We'll start preparing it right away.`
              : `Your order ${order.orderNumber} has been cancelled. If this was a mistake, please place a new order.`}
          </p>
          <div style={{ marginTop: 24, background: '#faf8f5', borderRadius: 10, padding: 14 }}>
            <strong>{order.orderNumber}</strong>
            <div style={{ color: '#76706a', fontSize: 13, marginTop: 4 }}>Total: {formatPKR(order.total)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (order.status !== 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid #e8e2d9' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px', background: '#f4efe8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.CheckCircle style={{ color: '#a67c52', width: 36, height: 36 }} />
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 8 }}>Order Already {order.status}</h2>
          <p style={{ color: '#76706a', fontSize: 14 }}>This order has already been {order.status}. No action needed.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f5', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 30, maxWidth: 440, width: '100%', border: '1px solid #e8e2d9', boxShadow: '0 6px 24px rgba(28,25,23,0.09)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 600 }}>Boliolo</div>
          <div style={{ color: '#76706a', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>Order Confirmation</div>
        </div>

        <div style={{ background: '#faf8f5', borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#76706a', marginBottom: 4 }}>Order</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{order.orderNumber}</div>
          <div style={{ color: '#76706a', fontSize: 13, marginTop: 4 }}>{order.customerName} · {order.city}</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          {(order.items || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: i < order.items.length - 1 ? '1px dashed #e8e2d9' : 'none' }}>
              <ProductImage src={it.image} alt={it.name} style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.name}</div>
                <div style={{ color: '#76706a', fontSize: 12 }}>{it.size && `Size ${it.size} · `}{it.color} · Qty {it.qty}</div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{formatPKR(it.price * it.qty)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, color: '#3f3a36' }}><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#3f3a36' }}><span>Delivery</span><span>{formatPKR(order.deliveryFee)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e8e2d9', paddingTop: 8, fontSize: 17, fontWeight: 600 }}><span>Total</span><span>{formatPKR(order.total)}</span></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f4efe8', border: '1px dashed #d8cfc2', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 16 }}>
          <Ic.Money style={{ color: '#8a6844', flexShrink: 0 }} />
          <span>Cash on Delivery</span>
        </div>

        {error && (
          <div style={{ background: 'rgba(182,64,46,0.08)', color: '#b6402e', border: '1px solid rgba(182,64,46,0.25)', borderRadius: 8, padding: 10, fontSize: 13, marginTop: 16 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            onClick={handleConfirm}
            disabled={acting}
            style={{
              flex: 1, padding: '14px 0', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: acting ? 'not-allowed' : 'pointer',
              background: '#2e7d5b', color: '#fff', opacity: acting ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {acting ? 'Processing...' : 'Confirm Order'}
          </button>
          <button
            onClick={handleCancel}
            disabled={acting}
            style={{
              flex: 1, padding: '14px 0', border: '1px solid #d8cfc2', borderRadius: 999, fontSize: 13, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: acting ? 'not-allowed' : 'pointer',
              background: '#fff', color: '#b6402e', opacity: acting ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {acting ? 'Processing...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
