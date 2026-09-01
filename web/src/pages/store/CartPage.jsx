import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useData } from '../../context/DataContext';
import { formatPKR } from '../../lib/format';
import ProductImage from '../../components/ProductImage';
import QuantityPicker from '../../components/QuantityPicker';
import EmptyState from '../../components/EmptyState';
import { Ic } from '../../lib/icons';

export default function CartPage() {
  const cart = useCart();
  const { meta } = useData();
  const fee = cart.items.length ? Number(meta.deliveryFee) : 0;
  const total = cart.subtotal + fee;

  if (cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '50px 16px 90px' }}>
        <EmptyState
          icon="Cart"
          title="Your Cart is Waiting for Something Beautiful"
          text="Discover our latest collection and find something made for you."
          cta="Explore Collection"
          to="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head" style={{ background: 'none', padding: '40px 0 20px', border: 'none' }}>
        <h1>Shopping Bag</h1>
      </div>
      <div className="cart-layout" style={{ paddingTop: 4 }}>
        <div>
          {cart.items.map((i) => (
            <div className="cart-item" key={`${i.productId}|${i.size}|${i.colorName}`}>
              <Link to={`/product/${i.slug}`}>
                <ProductImage src={i.image} alt={i.name} />
              </Link>
              <div className="ci-info">
                <Link to={`/product/${i.slug}`}>
                  <h3>{i.name}</h3>
                </Link>
                <div className="ci-var">
                  {i.size && <>Size: <strong>{i.size}</strong></>}
                  {i.colorName && (
                    <>
                      {' · '} Colour: <span style={{ color: i.colorHex }}>●</span> <strong>{i.colorName}</strong>
                    </>
                  )}
                </div>
                <div className="ci-price">{formatPKR(i.price)}</div>
                <div className="row mt-8">
                  <QuantityPicker value={i.qty} onChange={(q) => cart.setQty(`${i.productId}|${i.size}|${i.colorName}`, q)} max={i.stock} />
                </div>
              </div>
              <div className="ci-right">
                <button className="ci-remove" onClick={() => cart.remove(`${i.productId}|${i.size}|${i.colorName}`)}>
                  <Ic.Trash width={14} height={14} /> Remove
                </button>
                <strong>{formatPKR(i.qty * i.price)}</strong>
              </div>
            </div>
          ))}
          <Link to="/shop" className="btn btn-outline btn-sm mt-24" style={{ opacity: 0.9 }}>
            <Ic.Arrow width={14} height={14} style={{ transform: 'rotate(180deg)' }} /> Continue Shopping
          </Link>
        </div>

        <aside className="summary">
          <h3 style={{ marginBottom: 18 }}>Order Summary</h3>
          <div className="sm-row"><span>Subtotal</span><span>{formatPKR(cart.subtotal)}</span></div>
          <div className="sm-row"><span>Delivery charges</span><span>{fee ? formatPKR(fee) : '—'}</span></div>
          <div className="sm-row total"><span>Total</span><span>{formatPKR(total)}</span></div>
          <div className="cod-chip">
            <Ic.CheckCircle width={18} height={18} style={{ color: 'var(--green)' }} />
            <span><strong>Cash on Delivery</strong> — pay at your doorstep.</span>
          </div>
          <Link to="/checkout" className="btn btn-dark btn-block btn-xl">
            Proceed to Checkout
          </Link>
          <p className="sm-note center">Free to cancel anytime before shipping.</p>
        </aside>
      </div>
    </div>
  );
}