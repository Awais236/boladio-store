import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductImage from './ProductImage';
import Price from './Price';
import Modal from './Modal';
import QuantityPicker from './QuantityPicker';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Ic } from '../lib/icons';
import { api } from '../lib/api';
import { formatPKR } from '../lib/format';

function QuickView({ productId, onClose }) {
  const [p, setP] = useState(null);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState('');
  const cart = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api(`/products/${productId}`)
      .then(({ product }) => {
        setP(product);
        setImg(product.images[0]);
        setSize(product.sizes[0] || '');
        setColor(product.colors[0]?.name || '');
      })
      .catch(() => {});
  }, [productId]);

  if (!p) return null;

  const addToCart = () => {
    if (!p.inStock) return;
    cart.add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      price: p.salePrice || p.price,
      size,
      colorName: color,
      colorHex: p.colors.find((c) => c.name === color)?.hex || '',
      image: p.thumbnail,
      qty,
      stock: p.stock,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} title="Quick view">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
        <ProductImage src={img} alt={p.name} eager style={{ borderRadius: 12, aspectRatio: '3/4', objectFit: 'cover', width: '100%' }} />
        <div>
          <h3 style={{ fontFamily: 'var(--sans)', fontSize: 19 }}>{p.name}</h3>
          <small className="dim" style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11 }}>{p.category}</small>
          <Price price={p.price} salePrice={p.salePrice} />
          <p className="dim small" style={{ marginTop: 10 }}>{p.shortDesc}</p>

          {p.sizes.length > 0 && (
            <div className="pd-options" style={{ marginTop: 16 }}>
              <div className="lbl">
                Size <b>{size}</b>
              </div>
              <div className="chip-row">
                {p.sizes.map((s) => (
                  <button key={s} className={`chip ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {p.colors.length > 0 && (
            <div className="pd-options">
              <div className="lbl">
                Color <b>{color}</b>
              </div>
              <div className="swatch-row">
                {p.colors.map((c) => (
                  <button
                    key={c.name}
                    className={`swatch ${color === c.name ? 'active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setColor(c.name)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="row" style={{ marginTop: 18 }}>
            <QuantityPicker value={qty} onChange={setQty} max={p.stock} />
            <button className="btn btn-dark" disabled={!p.inStock} onClick={addToCart}>
              {p.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
          <button
            className="btn btn-ghost btn-sm mt-16"
            onClick={() => {
              onClose();
              navigate(`/product/${p.slug}`);
            }}
          >
            View full details
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProductCard({ product, className = '' }) {
  const cart = useCart();
  const wish = useWishlist();
  const [quick, setQuick] = useState(false);
  const saved = wish.has(product.id);

  const onSale = product.salePrice && Number(product.salePrice) < Number(product.price);
  const pct = onSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  const quickAdd = () => {
    if (!product.inStock) return;
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.salePrice || product.price,
      size: product.sizes[0] || '',
      colorName: product.colors[0]?.name || '',
      colorHex: product.colors[0]?.hex || '',
      image: product.thumbnail,
      qty: 1,
      stock: product.stock,
    });
  };

  return (
    <article className={`product-card ${className}`}>
      <div className="pc-media">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <ProductImage src={product.thumbnail} alt={product.name} />
        </Link>
        <div className="pc-badges">
          {product.isNew && <span className="tag tag-new">New</span>}
          {onSale && <span className="tag tag-sale">-{pct}%</span>}
          {!product.inStock && <span className="tag tag-out">Out of Stock</span>}
        </div>
        <button className={`pc-wish ${saved ? 'saved' : ''}`} aria-label="Wishlist" onClick={() => wish.toggle(product.id)}>
          <Ic.Heart />
        </button>
        {product.inStock && (
          <button className="pc-quick" onClick={() => setQuick(true)}>
            <Ic.Zoom width={14} height={14} /> Quick View
          </button>
        )}
      </div>
      <div className="pc-body">
        <span className="pc-cat">{product.category}</span>
        <Link to={`/product/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <Price price={product.price} salePrice={product.salePrice} />
        <span className="pc-sizes">
          {product.sizes.slice(0, 4).join(' · ')}
          {product.sizes.length > 4 ? ' +' : ''}
        </span>
        <div className="pc-add">
          <button className="btn btn-outline" onClick={quickAdd} disabled={!product.inStock}>
            <Ic.Cart width={15} height={15} /> Add to Cart
          </button>
        </div>
      </div>
      {quick && <QuickView productId={product.id} onClose={() => setQuick(false)} />}
    </article>
  );
}