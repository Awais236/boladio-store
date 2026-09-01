import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { api } from '../../lib/api';
import { formatPKR } from '../../lib/format';
import ProductImage from '../../components/ProductImage';
import EmptyState from '../../components/EmptyState';
import { Ic } from '../../lib/icons';

const CITIES = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Other'];

export default function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const { meta } = useData();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    city: 'Islamabad',
    area: '',
    address: '',
    postalCode: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customerName: f.customerName || user.name || '',
        customerPhone: f.customerPhone || (user.phone ? formatPhone(user.phone) : ''),
        customerEmail: f.customerEmail || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (cart.count === 0) navigate('/cart', { replace: true });
  }, [cart.count, navigate]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const subtotal = cart.subtotal;
  const fee = cart.count ? Number(meta.deliveryFee) : 0;
  const total = subtotal + fee;
  const storeClosed = !meta.storeOpen;

  const phoneValid = /^(\+92|0)?3[0-9]{9}$/.test((form.customerPhone || '').replace(/[^0-9+]/g, ''));

  const place = async () => {
    setError('');
    if (!form.customerName.trim() || form.customerName.trim().length < 2) return setError('Please enter your full name.');
    if (!phoneValid) return setError('Enter a valid Pakistani mobile number, e.g. 03xx xxxxxxx.');
    if (!form.address.trim() || form.address.trim().length < 8) return setError('Please provide a complete delivery address.');
    if (!form.city.trim()) return setError('Please select your city.');
    if (!confirm) return setError('Please confirm the order details to continue.');

    setPlacing(true);
    try {
      const { order } = await api('/orders/place', {
        method: 'POST',
        body: {
          items: cart.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            size: i.size,
            color: i.colorName,
          })),
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerEmail: form.customerEmail.trim() || undefined,
          city: form.city.trim(),
          area: form.area.trim(),
          address: form.address.trim(),
          postalCode: form.postalCode.trim(),
          notes: form.notes.trim(),
        },
      });
      cart.clear();
      navigate(`/order-success`, { state: { orderId: order.id, orderNumber: order.orderNumber } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (cart.count === 0) {
    return (
      <div className="container" style={{ padding: '50px 16px 90px' }}>
        <EmptyState
          title="Your cart is empty"
          text="Add something beautiful to your bag first."
          cta="Browse Collection"
          to="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head" style={{ background: 'none', padding: '40px 0 20px', border: 'none' }}>
        <h1>Checkout</h1>
        <p>Simple, fast and secure — 3 easy steps.</p>
      </div>

      {storeClosed && (
        <div className="form-error" style={{ marginBottom: 0, padding: 16 }}>
          We are currently not taking orders. Please check back shortly.
        </div>
      )}

      <div className="checkout-grid" style={{ paddingBottom: 80 }}>
        <div>
          <div className="checkout-card">
            <h3><span className="num">1</span> Delivery Information</h3>
            <div className="form-row">
              <div className="field">
                <label>Full Name <span className="req">*</span></label>
                <input className="input" value={form.customerName} onChange={set('customerName')} placeholder="e.g. Ayesha Khan" autoComplete="name" />
              </div>
              <div className="field">
                <label>Mobile Number <span className="req">*</span></label>
                <input className="input" value={form.customerPhone} onChange={set('customerPhone')} placeholder="03xx xxxxxxx" inputMode="tel" autoComplete="tel" />
              </div>
            </div>
            <div className="field">
              <label>Email <span className="dim" style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input className="input" type="email" value={form.customerEmail} onChange={set('customerEmail')} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="field">
              <label>Complete Address <span className="req">*</span></label>
              <textarea className="textarea" value={form.address} onChange={set('address')} placeholder="House #, Street, Block / Sector, Landmark" autoComplete="street-address" />
            </div>
            <div className="form-row">
              <div className="field">
                <label>City <span className="req">*</span></label>
                <select className="select" value={form.city} onChange={set('city')}>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                  <option value="__other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Area / Sector</label>
                <input className="input" value={form.area} onChange={set('area')} placeholder="e.g. F-7, Gulberg" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Postal Code <span className="dim" style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input className="input" value={form.postalCode} onChange={set('postalCode')} placeholder="e.g. 44000" />
              </div>
              <div className="field">
                <label>Order Notes <span className="dim" style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input className="input" value={form.notes} onChange={set('notes')} placeholder="Any instructions for us?" />
              </div>
            </div>
          </div>

          <div className="checkout-card">
            <h3><span className="num">2</span> Payment Method</h3>
            <div className="pay-box">
              <h4>
                <Ic.Money width={18} height={18} style={{ color: 'var(--gold-dark)' }} />
                Cash on Delivery
              </h4>
              <p className="dim small" style={{ marginTop: 4 }}>
                Pay when your order arrives at your doorstep. No advance payment required.
              </p>
            </div>
            <p className="dim small mt-16" style={{ lineHeight: 1.6 }}>
              Your order will remain pending until our team confirms it. You'll receive a call from{' '}
              <strong>{meta.phone}</strong> to verify your order details.
            </p>
          </div>

          <label className="confirm-line">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
            <span>
              I confirm that the information provided is correct and I agree to receive this order
              through Cash on Delivery.
            </span>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-gold btn-block btn-xl" onClick={place} disabled={placing || storeClosed}>
            {placing ? 'Placing your order…' : 'Place COD Order'}
          </button>
          <Link to="/cart" className="btn btn-ghost btn-block mt-16">← Back to Cart</Link>
        </div>

        <aside className="summary">
          <h3 style={{ marginBottom: 18 }}>Order Summary</h3>
          {cart.items.map((i) => (
            <div key={`${i.productId}|${i.size}|${i.colorName}`} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--line)', minWidth: 0 }}>
              <ProductImage src={i.image} alt={i.name} style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 12.5, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</div>
                <span className="dim">
                  {i.size && <>Size {i.size} · </>}
                  {i.colorName} · Qty {i.qty}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{formatPKR(i.qty * i.price)}</span>
            </div>
          ))}
          <div className="sm-row mt-16"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
          <div className="sm-row"><span>Delivery</span><span>{formatPKR(fee)}</span></div>
          <div className="sm-row total"><span>Total</span><span>{formatPKR(total)}</span></div>
          <div className="cod-chip">
            <Ic.CheckCircle width={18} height={18} style={{ color: 'var(--green)' }} />
            <span>Cash on Delivery · Pay later</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatPhone(p) {
  const digits = String(p || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('92') && digits.length === 12) return '0' + digits.slice(2);
  return p;
}