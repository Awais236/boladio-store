import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Ic } from '../../lib/icons';
import { formatPKR, formatDate, timeAgo } from '../../lib/format';

export default function AdminCustomers() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(`/admin/customers?q=${encodeURIComponent(q)}`)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-outline btn-sm" onClick={() => setQ(q)}><Ic.Search width={14} height={14} /> Search</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7}><div className="sk" style={{ height: 56 }} /></td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>No customers found.</td></tr>}
            {!loading && items.map((c) => (
              <tr key={c.phone}>
                <td style={{ fontWeight: 500 }}>{c.name || 'Guest'}</td>
                <td>{c.phone}</td>
                <td className="small dim">{c.email || '—'}</td>
                <td>{c.order_count}</td>
                <td><strong>{formatPKR(c.total_spent)}</strong></td>
                <td className="small dim">{timeAgo(c.last_order_at)}</td>
                <td><Link to={`/admin/customers/${c.phone}/orders`} className="btn btn-outline btn-sm">History</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}