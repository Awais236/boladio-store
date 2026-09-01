import { Link, useLocation } from 'react-router-dom';
import ProductImage from './ProductImage';
import QuantityPicker from './QuantityPicker';
import { useCart } from '../context/CartContext';
import { Ic } from '../lib/icons';
import { formatPKR } from '../lib/format';

export default function CartDrawer() {
  const cart = useCart();
  const location = useLocation();
  const open = cart.open;

  const close = () => cart.setOpen(false);

  return (
    <div className={`drawer ${open ? 'open' : ''}`}>
      <div className="drawer-backdrop" onClick={close} />
      <div className="drawer-panel">
        <div className="drawer-head">
          <h3>Your Bag</h3>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <Ic.X />
          </button>
        </div>
        <div className="drawer-items">
          {cart.items.length === 0 && (
            <div className="empty" style={{ padding: '40px 10px' }}>
              <div className="empty-icon" style={{ width: 64, height: 64 }}>
                <Ic.Cart style={{ width: 30, height: 30 }} />
              </div>
              <h3 style={{ fontSize: 18 }}>Your cart is waiting for something beautiful</h3>
              <p>Discover our latest collection and find something made for you.</p>
              <Link to="/shop" className="btn btn-dark btn-sm" onClick={close}>
                Explore Collection
              </Link>
            </div>
          )}
          {cart.items.map((i) => (
            <div className="drawer-item" key={`${i.productId}|${i.size}|${i.colorName}`}>
              <Link to={`/product/${i.slug}`} onClick={close}>
                <ProductImage src={i.image} alt={i.name} />
              </Link>
              <div className="di-info">
                <h4>{i.name}</h4>
                <small>
                  {i.size && <>Size {i.size} · </>}
                  {i.colorName && <>Color <span style={{ color: i.colorHex }}>●</span> {i.colorName}</>}
                </small>
                <span className="price">{formatPKR(i.price)}</span>
                <div className="row" style={{ marginTop: 4, justifyContent: 'space-between' }}>
                  <QuantityPicker value={i.qty} onChange={(q) => cart.setQty(`${i.productId}|${i.size}|${i.colorName}`, q)} max={i.stock} />
                  <button className="ci-remove" onClick={() => cart.remove(`${i.productId}|${i.size}|${i.colorName}`)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cart.items.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-sub">
              <span>Subtotal</span>
              <strong>{formatPKR(cart.subtotal)}</strong>
            </div>
            <Link to="/checkout" className="btn btn-dark btn-block" onClick={close}>
              Proceed to Checkout
            </Link>
            <Link to="/cart" className="btn btn-outline btn-block mt-8" onClick={close}>
              View Cart
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}