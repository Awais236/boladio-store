import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import StatusPill from '../../components/admin/StatusPill';
import { Ic } from '../../lib/icons';
import { formatPKR, formatDateTime, statusLabel } from '../../lib/format';

export default function AdminOrders() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (p = page, t = tab, query = q) => {
    setLoading(true);
    api(`/orders/admin?page=${p}&limit=15${t !== 'all' ? `&status=${t}` : ''}${query ? `&q=${encodeURIComponent(query)}` : ''}`)
      .then(setData)
      .catch(() => setData({ items: [], total: 0, page: 1, pages: 1 }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page, tab, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab]);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => load(data.page, tab, q);
    socket.on('order:new', refresh);
    socket.on('admin:order:update', refresh);
    return () => {
      socket.off('order:new', refresh);
      socket.off('admin:order:update', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.page, tab, q]);

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, tab, q);
  };

  const TABS = ['all', 'pending', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div>
      <div className="row" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        {TABS.map((t) => (
          <button
            key={t}
            className={`chip ${tab === t ? 'active' : ''}`}
            onClick={() => { setTab(t); setPage(1); }}
          >
            {t === 'all' ? 'All' : statusLabel(t)}
          </button>
        ))}
      </div>

      <form onSubmit={search} className="row" style={{ marginBottom: 16 }}>
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Search order #, name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-outline btn-sm" type="submit"><Ic.Search width={14} height={14} /> Search</button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!loading && data.items.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>No orders found.</td></tr>
            )}
            {loading && <tr><td colSpan={9}><div className="sk" style={{ height: 60, borderRadius: 8 }} /></td></tr>}
            {!loading && data.items.map((o) => (
              <tr key={o.id}>
                <td><strong>#{o.orderNumber}</strong></td>
                <td>{o.customerName}{o.suspicious && <span className="badge-flag" style={{ marginLeft: 6 }}>Flag</span>}</td>
                <td>{o.customerPhone}</td>
                <td>{o.itemCount}</td>
                <td><strong>{formatPKR(o.total)}</strong></td>
                <td className="small">COD · <span style={{ color: o.paymentStatus === 'paid' ? 'var(--green)' : 'var(--gold-dark)' }}>{o.paymentStatus}</span></td>
                <td><StatusPill status={o.status} suspicious={o.suspicious} /></td>
                <td className="small dim">{formatDateTime(o.createdAt)}</td>
                <td><Link to={`/admin/orders/${o.id}`} className="btn btn-outline btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.pages > 1 && (
        <div className="pager">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="small dim">{page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}