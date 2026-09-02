import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useToast } from '../../context/ToastContext';
import { Ic } from '../../lib/icons';
import { timeAgo } from '../../lib/format';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const toast = useToast();
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api('/admin/settings').then((r) => setS(r.settings)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setS((prev) => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await api('/admin/settings', {
        method: 'PATCH',
        body: {
          store_open: !!s.store_open,
          low_stock_threshold: Number(s.low_stock_threshold) || 0,
          delivery_fee: Number(s.delivery_fee) || 0,
          announcement: s.announcement || '',
        },
      });
      toast.success('Settings saved');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="checkout-card">
        <h3 style={{ fontSize: 17 }}>Store</h3>
        {!s && <div className="sk" style={{ height: 120 }} />}
        {s && (
          <>
            <label className="confirm-line" style={{ margin: '14px 0' }}>
              <input type="checkbox" checked={s.store_open} onChange={set('store_open')} />
              <span>
                <strong>Store open for orders</strong>
                <br />
                <span className="dim small">When off, customers cannot place COD orders.</span>
              </span>
            </label>
            <div className="field">
              <label>Announcement bar</label>
              <input className="input" value={s.announcement || ''} onChange={set('announcement')} placeholder="e.g. Free delivery on orders above PKR 20,000" />
            </div>
          </>
        )}
      </div>

      <div className="checkout-card">
        <h3 style={{ fontSize: 17 }}>Orders & Inventory</h3>
        {s && (
          <div className="form-row mt-16">
            <div className="field">
              <label>Delivery Fee (PKR)</label>
              <input className="input" type="number" value={s.delivery_fee} onChange={set('delivery_fee')} />
            </div>
            <div className="field">
              <label>Low Stock Threshold</label>
              <input className="input" type="number" value={s.low_stock_threshold} onChange={set('low_stock_threshold')} />
            </div>
          </div>
        )}
      </div>

      {s && (
        <button className="btn btn-dark btn-xl" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      )}

      <div className="checkout-card mt-24" style={{ background: 'rgba(46,125,91,0.05)' }}>
        <h3 style={{ fontSize: 17 }}><Ic.Info width={16} height={16} /> Store details</h3>
        <p className="dim small mt-8">
          Boliolo · Block ABC, Street ABC, House Number 123, Islamabad<br />
          Phone 0123456789 · WhatsApp 0123456789
        </p>
        <button className="btn btn-ghost btn-sm mt-16" onClick={() => navigate('/')}>↗ View live storefront</button>
      </div>
    </div>
  );
}