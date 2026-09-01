import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api, setAccessToken } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Ic } from '../../lib/icons';
import { timeAgo } from '../../lib/format';

const AdminCtx = createContext({ notifications: [], unread: 0, ping: 0, markRead: async () => {} });

export function useAdmin() {
  return useContext(AdminCtx);
}

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: Ic.Grid, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Ic.Box },
  { to: '/admin/products', label: 'Products', icon: Ic.Tag },
  { to: '/admin/customers', label: 'Customers', icon: Ic.Users },
  { to: '/admin/settings', label: 'Settings', icon: Ic.Settings },
];

function NotificationBell() {
  const { notifications, unread, markRead } = useAdmin();
  const toast = useToast();
  const [openPanel, setOpenPanel] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="notif-drop">
      <button
        className="icon-btn"
        onClick={() => {
          setOpenPanel(!openPanel);
          if (unread > 0) markRead();
        }}
        aria-label="Notifications"
      >
        <Ic.Bell />
        {unread > 0 && <span className="count-badge">{unread}</span>}
      </button>
      {openPanel && (
        <div className="notif-menu-panel">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Notifications</strong>
            <button className="dim small" style={{ textDecoration: 'underline' }} onClick={() => navigate('/admin/notifications')}>
              View all
            </button>
          </div>
          {notifications.length === 0 && <p className="dim small" style={{ padding: 18 }}>No notifications yet.</p>}
          {notifications.slice(0, 12).map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.read ? '' : 'unread'}`}
              onClick={() => {
                setOpenPanel(false);
                if (n.link) navigate(n.link);
              }}
            >
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
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [ping, setPing] = useState(0);
  const [sideClosed, setSideClosed] = useState(() => window.innerWidth <= 900);

  useEffect(() => {
    api('/admin/notifications?limit=40').then((r) => setNotifications(r.items)).catch(() => {});
    api('/admin/notifications/unread').then((r) => setUnread(r.count)).catch(() => {});
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 900) setSideClosed(true);
  }, [location.pathname]);

  useEffect(() => {
    const socket = getSocket();
    const onNotif = (n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 60));
      setUnread((u) => u + 1);
    };
    const onOrder = (o) => {
      setPing((p) => p + 1);
      setNotifications((prev) => [
        { id: `tmp-${o.id}`, type: 'new_order', title: 'New Order', message: `${o.orderNumber} from ${o.customerName}`, read: false, created_at: new Date().toISOString(), link: `/admin/orders/${o.id}` },
        ...prev,
      ].slice(0, 60));
      setUnread((u) => u + 1);
    };
    socket.on('admin:notification', onNotif);
    socket.on('order:new', onOrder);
    return () => {
      socket.off('admin:notification', onNotif);
      socket.off('order:new', onOrder);
    };
  }, []);

  const markRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await api('/admin/notifications/read', { method: 'POST' });
    } catch {
      /* ignore */
    }
  };

  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  const pageTitle = (() => {
    if (location.pathname === '/admin') return 'Dashboard';
    if (location.pathname.includes('/orders/')) return 'Order Details';
    if (location.pathname.includes('/products/new')) return 'New Product';
    if (location.pathname.includes('/products/')) return 'Edit Product';
    if (location.pathname.includes('/customers/')) return 'Customer';
    if (location.pathname.includes('/settings')) return 'Settings';
    const seg = location.pathname.split('/')[2] || '';
    return NAV.find((n) => n.to === `/admin/${seg}`)?.label || seg;
  })();

  return (
    <AdminCtx.Provider value={{ notifications, unread, ping, markRead }}>
      <div className="admin-shell">
        {!sideClosed && <div className="admin-sidebar-backdrop" onClick={() => setSideClosed(true)} />}
        <aside className={`admin-side ${sideClosed ? 'closed' : ''}`}>
          <div className="admin-logo">
            Boliolo
            <small>Admin Panel</small>
          </div>
          <nav className="admin-nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                <n.icon /> {n.label}
                {n.to === '/admin/orders' && ping > 0 && <span className="count-badge" style={{ position: 'static', marginLeft: 'auto' }}>{ping}</span>}
              </NavLink>
            ))}
          </nav>
          <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={logout} style={{ width: '100%' }}>
              <Ic.Logout /> Sign Out
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-head">
            <div className="row" style={{ gap: 10 }}>
              <button className="icon-btn admin-nav-toggle" onClick={() => setSideClosed(!sideClosed)}>
                <Ic.Menu />
              </button>
              <h2 style={{ fontSize: 19 }}>{pageTitle}</h2>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Link to="/" className="btn btn-outline btn-sm hidden-mobile">View Store</Link>
              <NotificationBell />
              <span className="dim small hidden-mobile">{user.name}</span>
            </div>
          </header>
          <main className="admin-content">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminCtx.Provider>
  );
}