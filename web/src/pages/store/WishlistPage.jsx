import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../lib/api';
import ProductImage from '../../components/ProductImage';
import Price from '../../components/Price';
import EmptyState from '../../components/EmptyState';
import { Ic } from '../../lib/icons';

export default function WishlistPage() {
  const wish = useWishlist();
  const cart = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wish.ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    api(`/products/by-ids?ids=${wish.ids.join(',')}`)
      .then((r) => {
        const map = new Map(products ? [] : []);
        r.items.forEach((p) => map.set(p.id, p));
        setProducts(r.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wish.ids]);

  if (products.length === 0 && !loading) {
    return (
      <div className="container" style={{ padding: '50px 16px 90px' }}>
        <EmptyState
          icon="Heart"
          title="Your wishlist is empty"
          text="Save your favourite pieces here and find them again in an instant."
          cta="Explore Collection"
          to="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head" style={{ background: 'none', padding: '40px 0 20px', border: 'none' }}>
        <h1>Your Wishlist</h1>
        <p>{products.length} saved {products.length === 1 ? 'piece' : 'pieces'}</p>
      </div>
      <div className="grid" style={{ padding: '0 0 90px' }}>
        {products.map((p) => (
          <article className="product-card" key={p.id}>
            <div className="pc-media">
              <Link to={`/product/${p.slug}`}>
                <ProductImage src={p.thumbnail} alt={p.name} />
              </Link>
              {!p.inStock && <div className="pc-badges"><span className="tag tag-out">Out of Stock</span></div>}
              <button className={`pc-wish saved`} onClick={() => wish.toggle(p.id)} aria-label="Remove">
                <Ic.Heart />
              </button>
            </div>
            <div className="pc-body">
              <span className="pc-cat">{p.category}</span>
              <Link to={`/product/${p.slug}`}><h3>{p.name}</h3></Link>
              <Price price={p.price} salePrice={p.salePrice} />
              <span className={`stock-state ${p.inStock ? 'in' : 'out'}`} style={{ padding: '4px 10px', alignSelf: 'flex-start' }}>
                {p.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              <div className="pc-add">
                <button className="btn btn-outline" disabled={!p.inStock} onClick={() => {
                  cart.add({
                    productId: p.id,
                    slug: p.slug,
                    name: p.name,
                    price: p.salePrice || p.price,
                    size: p.sizes[0] || '',
                    colorName: p.colors[0]?.name || '',
                    colorHex: p.colors[0]?.hex || '',
                    image: p.thumbnail,
                    qty: 1,
                    stock: p.stock,
                  });
                }}>
                  <Ic.Cart width={15} height={15} /> Add to Cart
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}