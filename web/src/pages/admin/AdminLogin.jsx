import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Ic } from '../../lib/icons';

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ id: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && user.role === 'admin') return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.id, form.password);
      if (u.role !== 'admin') {
        setError('This account does not have admin access.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#14110d', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '38px 34px', width: 'min(400px, 100%)', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="nav-logo" style={{ justifyContent: 'center', fontSize: 26 }}>
            Boliolo
          </div>
          <div className="eyebrow" style={{ marginTop: 10 }}>Admin Dashboard</div>
        </div>
        <form onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label>Phone / Email</label>
            <input className="input" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="admin phone or email" autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button className="btn btn-dark btn-block btn-xl" disabled={busy}>
            {busy ? 'Signing in…' : 'Admin Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}