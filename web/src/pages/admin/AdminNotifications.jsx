import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { Ic } from '../../lib/icons';
import { timeAgo } from '../../lib/format';

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  const load = () => api('/admin/notifications?limit=100').then((r) => setItems(r.items)).catch(() => {}).finally(() => setLoaded(true));

  useEffect(() => {
    load();
    const socket = getSocket();
    const onNotif = (n) => setItems((prev) => [n, ...prev]);
    const onOrder = (o) =>
      setItems((prev) => [
        { id: `tmp-${o.id}`, type: 'new_order', title: 'New Order', message: `${o.orderNumber} from ${o.customerName}`, read: false, created_at: new Date().toISOString() },
        ...prev,
      ]);
    socket.on('admin:notification', onNotif);
    socket.on('order:new', onOrder);
    return () => {
      socket.off('admin:notification', onNotif);
      socket.off('order:new', onOrder);
    };
  }, []);

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api('/admin/notifications/read', { method: 'POST' });
    } catch {
      /* ignore */
    }
  };

  const open = (n) => {
    if (n.link) navigate(n.link);
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Link to="/admin" className="btn btn-outline btn-sm"><Ic.Arrow width={13} height={13} style={{ transform: 'rotate(180deg)' }} /> Dashboard</Link>
        <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>
      </div>
      {!loaded && <div className="sk" style={{ height: 200 }} />}
      {loaded && items.length === 0 && <p className="dim center">No notifications yet.</p>}
      {items.map((n) => (
        <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => open(n)} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14, marginBottom: 10, cursor: n.link ? 'pointer' : 'default' }}>
          <div className="notif-ic">
            {n.type === 'new_order' ? <Ic.Box /> : n.type === 'low_stock' || n.type === 'stock_out' ? <Ic.Alert /> : <Ic.Bell />}
          </div>
          <div style={{ flex: 1 }}>
            <h5>{n.title}</h5>
            <p>{n.message}</p>
            <time>{timeAgo(n.created_at)}</time>
          </div>
        </div>
      ))}
    </div>
  );
}