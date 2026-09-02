import { Link } from 'react-router-dom';
import { Ic } from '../lib/icons';
import { useData } from '../context/DataContext';

export default function Footer() {
  const { meta } = useData();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="nav-logo">
              Boliolo
            </div>
            <p>
              Premium Pakistani women's fashion. Contemporary elegance with timeless traditional
              aesthetics - ready to wear, unstitched, formal and wedding collections.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop?category=ready-to-wear">Ready to Wear</Link></li>
              <li><Link to="/shop?category=unstitched">Unstitched</Link></li>
              <li><Link to="/shop?category=formal-wear">Formal Wear</Link></li>
              <li><Link to="/shop?category=wedding">Wedding</Link></li>
              <li><Link to="/shop?category=casual">Casual</Link></li>
            </ul>
          </div>
          <div>
            <h4>Customer Care</h4>
            <ul>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/tracking">Order Tracking</Link></li>
              <li><Link to="/tracking">Shipping</Link></li>
              <li><Link to="/contact">Returns</Link></li>
              <li><Link to="/size-guide">Size Guide</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="footer-contact">
              <li>
                <Ic.Pin />
                <span>Block ABC, Street ABC<br />House Number 123, Islamabad</span>
              </li>
              <li>
                <Ic.Phone />
                <span>{meta.phone}</span>
              </li>
            </ul>
            <Link to="/contact" className="btn btn-gold btn-sm">Get in Touch</Link>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Boliolo. All Rights Reserved.</span>
          <span>Boutique · Block ABC, Street ABC · Islamabad · Cash on Delivery</span>
        </div>
      </div>
    </footer>
  );
}