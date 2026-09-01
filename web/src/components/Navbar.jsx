import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Ic } from '../lib/icons';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?collection=new', label: 'New Arrivals' },
  { to: '/shop?category=ready-to-wear', label: 'Ready to Wear' },
  { to: '/shop?category=unstitched', label: 'Unstitched' },
  { to: '/shop?category=formal-wear', label: 'Formal Wear' },
  { to: '/shop?category=wedding', label: 'Wedding Collection' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const cart = useCart();
  const wish = useWishlist();
  const { user } = useAuth();
  const { meta } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (to) => {
    const [path, query] = to.split('?');
    if (query) return location.pathname === path && location.search.includes(query.split('=')[0]);
    return location.pathname === path;
  };

  return (
    <>
      {meta.announcement && <div className="announce">{meta.announcement}</div>}
      <header className="site-header">
        <div className="container">
          <nav className="nav">
            <button className="icon-btn burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              <Ic.Menu />
            </button>

            <Link to="/" className="nav-logo">
              Boliolo
            </Link>

            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
              {LINKS.map((l) => (
                <NavLink key={l.label} to={l.to} className={isActive(l.to) ? 'active' : ''}>
                  {l.label}
                </NavLink>
              ))}
            </div>

            <div className="nav-actions">
              <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
                <Ic.Search />
              </button>
              <Link to="/account" className="icon-btn" aria-label="Account">
                <Ic.User />
              </Link>
              <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
                <Ic.Heart />
                {wish.count > 0 && <span className="count-badge">{wish.count}</span>}
              </Link>
              <button className="icon-btn" onClick={() => cart.setOpen(true)} aria-label="Cart">
                <Ic.Cart />
                {cart.count > 0 && <span className="count-badge">{cart.count}</span>}
              </button>
              <Link to="/account" className="btn btn-dark btn-sm nav-signin">
                {user ? 'Account' : 'Sign In'}
              </Link>
            </div>
          </nav>
        </div>
      </header>
      {menuOpen && <div className="nav-backdrop open" onClick={() => setMenuOpen(false)} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 1) return setResults([]);
      try {
        const data = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`).then((r) => r.json());
        setResults(data.items || []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const go = () => {
    if (!q.trim()) return;
    onClose();
    navigate(`/shop?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="modal open">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel" style={{ top: 40, transform: 'translateX(-50%)', width: 'min(680px, calc(100vw - 24px))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
          <Ic.Search style={{ flexShrink: 0 }} />
          <input
            autoFocus
            className="input"
            style={{ border: 'none', boxShadow: 'none', padding: '12px 0' }}
            placeholder="Search suits, lawn, chiffon, formal..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
          />
          <button className="icon-btn" onClick={onClose}>
            <Ic.X />
          </button>
        </div>
        <div>
          {!q.trim() && (
            <p className="dim small mt-16" style={{ padding: '8px 4px' }}>
              Search by product, category or fabric &mdash; try "chiffon" or "lawn".
            </p>
          )}
          {results.map((r) => (
            <Link
              key={r.id}
              to={`/product/${r.slug}`}
              onClick={onClose}
              style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid var(--line)' }}
            >
              <img src={r.thumbnail || '/images/placeholder.svg'} alt="" style={{ width: 46, height: 58, objectFit: 'cover', borderRadius: 8 }} />
              <div className="spacer">
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <small className="dim">{r.category} · {r.fabric}</small>
              </div>
              <strong>PKR {Number(r.salePrice || r.price).toLocaleString('en-PK')}</strong>
            </Link>
          ))}
          {q.trim() && results.length === 0 && (
            <p className="dim small mt-16" style={{ padding: '12px 4px' }}>
              No matches for "{q}"
            </p>
          )}
          <button className="btn btn-dark btn-sm mt-16" style={{ width: '100%' }} onClick={go}>
            See all results
          </button>
        </div>
      </div>
    </div>
  );
}