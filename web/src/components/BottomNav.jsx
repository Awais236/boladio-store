import { NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Ic } from '../lib/icons';

export default function BottomNav() {
  const cart = useCart();
  const wish = useWishlist();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  if (isAdminArea) return null;

  const item = (to, label, Icon, badge) => (
    <NavLink
      to={to}
      end={to === '/' || to === '/shop'}
      className={({ isActive }) => (isActive ? 'active' : '')}
    >
      <span style={{ position: 'relative' }}>
        <Icon />
        {badge > 0 && <span className="count-badge" style={{ transform: 'translateX(0)' }}>{badge}</span>}
      </span>
      {label}
    </NavLink>
  );

  return (
    <nav className="bottom-nav">
      <ul>
        {item('/', 'Home', Ic.Home)}
        {item('/shop', 'Shop', Ic.Grid)}
        {item('/wishlist', 'Wishlist', Ic.Heart, wish.count)}
        <li>
          <NavLink to="#" onClick={(e) => { e.preventDefault(); cart.setOpen(true); }} className={location.pathname === '/cart' ? 'active' : ''}>
            <span style={{ position: 'relative' }}>
              <Ic.Cart />
              {cart.count > 0 && <span className="count-badge">{cart.count}</span>}
            </span>
            Cart
          </NavLink>
        </li>
        {item('/account', 'Account', Ic.User)}
      </ul>
    </nav>
  );
}