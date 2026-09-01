import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductImage from '../../components/ProductImage';
import { formatPKR } from '../../lib/format';
import { Ic } from '../../lib/icons';

export default function OrderConfirmPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
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

  useEffect(() => {
    if (order && action && !done && order.status === 'pending') {
      if (action === 'confirm') handleConfirm();
      if (action === 'cancel') handleCancel();
    }
  }, [order, action]);

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="sk" style={{ width: 400, height: 300, borderRadius: 14 }} /></div>;
  if (error && !order) return <div className="centered-page"><div className="success-card"><h2>Order Not Found</h2><p className="dim mt-16">{error}</p></div></div>;

  if (done) {
    return (
      <div className="centered-page">
        <div className="success-card">
          <div className="check-circle" style={{ background: finalStatus === 'confirmed' ? 'rgba(46,125,91,0.1)' : 'rgba(182,64,46,0.1)' }}>
            {finalStatus === 'confirmed' ? <Ic.CheckCircle style={{ color: 'var(--green)' }} /> : <Ic.X style={{ color: 'var(--red)' }} />}
          </div>
          <h1 style={{ fontSize: 28 }}>
            {finalStatus === 'confirmed' ? 'Order Confirmed!' : 'Order Cancelled'}
          </h1>
          <p className="dim mt-16" style={{ maxWidth: 360, margin: '16px auto 0' }}>
            {finalStatus === 'confirmed'
              ? `Thank you, ${order.customerName}! Your order ${order.orderNumber} has been confirmed. We'll start preparing it right away.`
              : `Your order ${order.orderNumber} has been cancelled. If this was a mistake, please place a new order.`}
          </p>
          <div style={{ marginTop: 28 }}>
            <strong>{order.orderNumber}</strong>
            <div className="dim small mt-8">Total: {formatPKR(order.total)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="centered-page">
      <div className="success-card" style={{ textAlign: 'left', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>Boliolo</div>
          <p className="dim small">Order Confirmation</p>
        </div>

        {order.status !== 'pending' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="check-circle" style={{ margin: '0 auto 16px' }}>
              {order.status === 'confirmed' ? <Ic.CheckCircle style={{ color: 'var(--green)' }} /> : order.status === 'cancelled' ? <Ic.X style={{ color: 'var(--red)' }} /> : <Ic.Clock />}
            </div>
            <h3>Order is already {order.status}</h3>
            <p className="dim small mt-8">This order has already been {order.status}.</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--paper-2)', borderRadius: 'var(--r-sm)', padding: 16, marginBottom: 20 }}>
              <div className="dim small" style={{ textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, marginBottom: 4 }}>Order</div>
              <div style={{ fontWeight: 600, fontSize: 18 }}>{order.orderNumber}</div>
              <div className="dim small mt-8">{order.customerName} · {order.city}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              {(order.items || []).map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--line)' }}>
                  <ProductImage src={it.image} alt={it.name} style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.name}</div>
                    <div className="dim small">{it.size && `Size ${it.size} · `}{it.color} · Qty {it.qty}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{formatPKR(it.price * it.qty)}</div>
                </div>
              ))}
            </div>

            <div className="sm-row"><span>Subtotal</span><span>{formatPKR(order.subtotal)}</span></div>
            <div className="sm-row"><span>Delivery</span><span>{formatPKR(order.deliveryFee)}</span></div>
            <div className="sm-row total"><span>Total</span><span>{formatPKR(order.total)}</span></div>

            <div className="cod-chip" style={{ marginTop: 16 }}>
              <Ic.Money style={{ color: 'var(--gold-dark)' }} />
              <span>Cash on Delivery</span>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-dark btn-block" onClick={handleConfirm} disabled={acting}>
                {acting ? 'Processing...' : 'Confirm Order'}
              </button>
              <button className="btn btn-outline btn-block" onClick={handleCancel} disabled={acting} style={{ color: 'var(--red)' }}>
                {acting ? 'Processing...' : 'Cancel Order'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
