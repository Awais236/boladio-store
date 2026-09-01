import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, qs } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import OrderTimeline from '../../components/OrderTimeline';
import ProductImage from '../../components/ProductImage';
import EmptyState from '../../components/EmptyState';
import { Ic } from '../../lib/icons';
import { formatPKR, formatDateTime, statusLabel } from '../../lib/format';

function useLiveOrder(orderId, phone) {
  const [live, setLive] = useState(null);
  const orderRef = useRef(orderId);

  useEffect(() => {
    orderRef.current = orderId;
    if (!orderId) return;
    const socket = getSocket();
    const onUpdate = (payload) => {
      if (payload && payload.id === orderRef.current) setLive(payload);
    };
    socket.off('order:update', onUpdate);
    socket.on('order:update', onUpdate);
    socket.emit('track', { orderId, phone });
    return () => socket.off('order:update', onUpdate);
  }, [orderId, phone]);

  return live;
}

export default function TrackingPage() {
  const [params] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [searched, setSearched] = useState(false);
  const [connected, setConnected] = useState(false);

  const lookUp = async (number, ph) => {
    setSearched(true);
    setOrder(null);
    setStatusText('');
    try {
      const data = await api(`/orders/track?${qs({ order: number, phone: ph })}`);
      setOrder(data.order);
    } catch (err) {
      setStatusText(err.message);
    }
  };

  useEffect(() => {
    const n = params.get('order');
    if (n) {
      setOrderNumber(n);
      const savedPhone = sessionStorage.getItem('nf_track_phone') || '';
      setPhone(savedPhone);
    }
  }, [params]);

  // auto-lookup when arriving with order param + saved phone
  useEffect(() => {
    const n = params.get('order');
    const p = sessionStorage.getItem('nf_track_phone');
    if (n && p) lookUp(n, p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const live = useLiveOrder(order?.id, order?.customer_phone);

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setConnected(true);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  const current = live || order;

  const submit = (e) => {
    e.preventDefault();
    sessionStorage.setItem('nf_track_phone', phone);
    lookUp(orderNumber, phone);
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>Track Your Order</h1>
        <p>Enter your order number and phone number to see live updates.</p>
      </div>

      <div style={{ maxWidth: 680, margin: '30px auto 70px' }}>
        <form onSubmit={submit} className="checkout-card">
          <div className="form-row">
            <div className="field">
              <label>Order Number</label>
              <input className="input" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="NF-10245" required />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx xxxxxxx" required />
            </div>
          </div>
          <button className="btn btn-dark btn-block" type="submit">
            <Ic.Search width={15} height={15} /> Look Up Order
          </button>
        </form>

        {searched && !current && (
          <EmptyState
            icon="Box"
            title="Order not found"
            text={statusText || "We couldn't find that order. Check the order number and phone and try again."}
          />
        )}

        {current && (
          <div className="checkout-card" style={{ padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 24 }}>{current.orderNumber}</h2>
                <p className="dim small">Placed on {formatDateTime(current.createdAt)}</p>
                <p className="dim small">Ordered by {current.customerName}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`status-pill st-${current.status}`}>
                  <span className="dot" /> {statusLabel(current.status)}
                </span>
                <div className="live-chip mt-8">
                  <span className="live-dot"></span>
                  {connected ? 'Live updates connected' : 'Connecting…'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'var(--paper-2)', borderRadius: 12, padding: 14, margin: '18px 0' }}>
              <div><div className="k" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>Total</div><strong style={{ fontSize: 20 }}>{formatPKR(current.total)}</strong></div>
              <div><div className="k" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>Payment</div><strong>Cash on Delivery</strong></div>
              <div><div className="k" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>Delivery ETA</div><strong>2–5 days</strong></div>
              <div><div className="k" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)' }}>Deliver to</div><strong>{current.city}{current.area ? `, ${current.area}` : ''}</strong></div>
            </div>

            <OrderTimeline status={current.status} cancelled={current.status === 'cancelled'} />

            <h4 style={{ margin: '18px 0 10px', fontFamily: 'var(--sans)' }}>Items</h4>
            {(current.items || []).map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px dashed var(--line)', alignItems: 'center' }}>
                <ProductImage src={it.image} alt={it.name} style={{ width: 42, height: 54, objectFit: 'cover', borderRadius: 6 }} />
                <div style={{ flex: 1, fontSize: 13.5 }}>
                  <strong>{it.name}</strong>
                  <div className="dim small">
                    {it.size && <>Size {it.size} · </>}{it.color && <>Colour {it.color} · </>}Qty {it.qty}
                  </div>
                </div>
                <strong style={{ fontSize: 13 }}>{formatPKR(it.price * it.qty)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}