import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import { Ic } from '../../lib/icons';
import { formatPKR, formatDateTime, statusLabel } from '../../lib/format';

function AuthForms() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register') {
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
      if (!/^(\+92|0)?3[0-9]{9}$/.test((form.phone || '').replace(/[^0-9+]/g, ''))) {
        return setError('Enter a valid Pakistani mobile number, e.g. 03xx xxxxxxx.');
      }
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(form.phone || form.email, form.password);
      else await register({ name: form.name, phone: form.phone, email: form.email || undefined, password: form.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 style={{ fontSize: 26, textAlign: 'center', marginBottom: 8 }}>Welcome</h2>
        <p className="center dim small" style={{ marginBottom: 20 }}>
          {mode === 'login' ? 'Sign in to view your orders.' : 'Create an account to track orders easily.'}
        </p>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Register</button>
        </div>
        <form onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}
          {mode === 'register' && (
            <div className="field">
              <label>Full Name</label>
              <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Ayesha Khan" />
            </div>
          )}
          <div className="field">
            <label>Phone {mode === 'login' ? '(or Email)' : ''}</label>
            <input className="input" required value={form[mode === 'login' ? 'phone' : 'phone']} onChange={set('phone')} placeholder="03xx xxxxxxx" />
          </div>
          {mode === 'register' && (
            <div className="field">
              <label>Email (optional)</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            </div>
          )}
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" required value={form.password} onChange={set('password')} placeholder="••••••••" />
          </div>
          {mode === 'register' && (
            <div className="field">
              <label>Confirm Password</label>
              <input className="input" type="password" required value={form.confirm} onChange={set('confirm')} placeholder="••••••••" />
            </div>
          )}
          <button className="btn btn-dark btn-block btn-xl" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className="dim small center mt-16">
          No account needed to place an order — you can also track with your order number.
        </p>
      </div>
    </div>
  );
}

function History() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api('/orders/my').then((r) => setOrders(r.items)).catch(() => setOrders([]));
  }, [user]);

  return (
    <div className="container">
      <div className="page-head" style={{ background: 'none', padding: '40px 0 20px', border: 'none' }}>
        <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
        <p>{user.phone} · {user.email || 'no email'}</p>
      </div>

      {user.role === 'admin' && (
        <Link to="/admin" className="btn btn-gold mt-16" style={{ marginBottom: 6 }}>
          <Ic.Settings width={16} height={16} /> Open Admin Dashboard
        </Link>
      )}

      <div style={{ maxWidth: 860, paddingBottom: 80 }}>
        <div className="row" style={{ justifyContent: 'space-between', margin: '24px 0 16px' }}>
          <h3 style={{ fontSize: 22 }}>My Orders</h3>
          <button className="btn btn-outline btn-sm" onClick={logout}>Sign Out</button>
        </div>

        {orders === null && <div className="sk" style={{ height: 90, borderRadius: 12 }} />}

        {orders && orders.length === 0 && (
          <EmptyState icon="Box" title="No orders yet" text="Your order history will appear here. Place your first order today." cta="Shop Now" to="/shop" />
        )}

        <div className="orders-list">
          {orders && orders.map((o) => (
            <div className="order-card" key={o.id}>
              <div className="oc-l">
                <Link to={`/tracking?order=${o.orderNumber}`}>
                  <span className="id">#{o.orderNumber}</span>
                </Link>
                <small>{formatDateTime(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {o.city}</small>
              </div>
              <div className="row">
                <span className={`status-pill st-${o.status}`}><span className="dot" /> {statusLabel(o.status)}</span>
                <strong>{formatPKR(o.total)}</strong>
                <Link to={`/tracking?order=${o.orderNumber}`} className="btn btn-outline btn-sm">Track</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return <AuthForms />;
  return <History />;
}