import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import StatusPill from '../../components/admin/StatusPill';
import { Ic } from '../../lib/icons';
import { formatPKR, formatDateTime } from '../../lib/format';

export default function AdminCustomerDetail() {
  const { phone } = useParams();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api(`/admin/customers/${phone}/orders`).then((r) => setOrders(r.items)).catch(() => setOrders([]));
  }, [phone]);

  const totals = (orders || []).reduce(
    (acc, o) => {
      acc.count += 1;
      acc.spent += o.status !== 'cancelled' ? Number(o.total) : 0;
      return acc;
    },
    { count: 0, spent: 0 }
  );

  return (
    <div>
      <div className="row" style={{ marginBottom: 16, gap: 10 }}>
        <Link to="/admin/customers" className="btn btn-outline btn-sm"><Ic.Arrow width={13} height={13} style={{ transform: 'rotate(180deg)' }} /> Customers</Link>
        <h2 style={{ fontSize: 24 }}>{orders?.[0]?.customerName || 'Customer'}</h2>
      </div>

      <div className="stats-grid" style={{ marginBottom: 22, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="k">Phone</div><div className="v" style={{ fontSize: 22 }}>{phone}</div></div>
        <div className="stat-card"><div className="k">Total Orders</div><div className="v" style={{ fontSize: 22 }}>{totals.count}</div></div>
        <div className="stat-card"><div className="k">Total Spent</div><div className="v" style={{ fontSize: 22 }}>{formatPKR(totals.spent)}</div></div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {orders === null && <tr><td colSpan={6}><div className="sk" style={{ height: 56 }} /></td></tr>}
            {orders && orders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>No orders for this number.</td></tr>}
            {orders && orders.map((o) => (
              <tr key={o.id}>
                <td><strong>#{o.orderNumber}</strong></td>
                <td className="small dim">{formatDateTime(o.createdAt)}</td>
                <td>{o.itemCount}</td>
                <td><strong>{formatPKR(o.total)}</strong></td>
                <td><StatusPill status={o.status} suspicious={o.suspicious} /></td>
                <td><Link to={`/admin/orders/${o.id}`} className="btn btn-outline btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}