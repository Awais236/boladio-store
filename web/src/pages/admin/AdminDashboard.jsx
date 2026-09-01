import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import StatusPill from '../../components/admin/StatusPill';
import { Ic } from '../../lib/icons';
import { formatPKR, timeAgo } from '../../lib/format';

function Stat({ label, value, sub, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="k">{label}</span>
        <Icon width={18} height={18} style={{ color: 'var(--gold-dark)' }} />
      </div>
      <div className="v">{value}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const booted = useRef(false);

  const load = () => {
    api('/admin/stats').then(setStats).catch(() => {});
    api('/admin/orders/recent').then((r) => setRecent(r.items)).catch(() => {});
  };

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    load();
    const socket = getSocket();
    const onNew = () => {
      load();
      api('/admin/orders/recent').then((r) => setRecent(r.items)).catch(() => {});
    };
    socket.on('order:new', onNew);
    return () => socket.off('order:new', onNew);
  }, []);

  const pending = (stats?.pendingOrders ?? 0);

  return (
    <div>
      <div className="stats-grid">
        <Stat label="Today's Orders" value={stats ? stats.todayOrders : '—'} sub={stats ? `PKR ${Number(stats.todayRevenue).toLocaleString('en-PK', { maximumFractionDigits: 0 })} collected today` : ''} icon={Ic.Box} />
        <Stat label="Pending Orders" value={stats ? pending : '—'} sub="Awaiting your action" icon={Ic.Clock} />
        <Stat label="Total Sales" value={stats ? `PKR ${Number(stats.totalSales).toLocaleString('en-PK', { maximumFractionDigits: 0 })}` : '—'} sub="All confirmed orders" icon={Ic.Money} />
        <Stat label="Products" value={stats ? stats.products : '—'} sub={`${stats?.outOfStock ?? 0} out of stock`} icon={Ic.Tag} />
        <Stat label="Low Stock" value={stats ? stats.lowStock : '—'} sub="Threshold warning" icon={Ic.Alert} />
        <Stat label="Customers" value={stats ? stats.customers : '—'} sub="Unique phone numbers" icon={Ic.Users} />
      </div>

      <div style={{ marginTop: 34 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 20 }}>🔔 Real-Time Orders</h3>
          <span className="live-chip"><span className="live-dot"></span> Live</span>
        </div>
        <div className="live-orders">
          {recent.length === 0 && <p className="dim small">Waiting for incoming orders…</p>}
          {recent.slice(0, 8).map((o) => (
            <div className="new-order-card" key={o.id}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <strong>#{o.orderNumber}</strong>
                <StatusPill status={o.status} suspicious={o.suspicious} />
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="small">
                  👤 {o.customerName} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {timeAgo(o.createdAt)}<br />
                  📞 {o.customerPhone} · {o.city}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: 'var(--gold-dark)' }}>{formatPKR(o.total)}</strong>
                  <div className="dim small">Cash on Delivery</div>
                </div>
              </div>
              <div className="row mt-8" style={{ justifyContent: 'flex-end' }}>
                <Link to={`/admin/orders/${o.id}`} className="btn btn-outline btn-sm">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}