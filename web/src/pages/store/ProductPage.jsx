import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import ProductImage from '../../components/ProductImage';
import ProductCard from '../../components/ProductCard';
import Price from '../../components/Price';
import QuantityPicker from '../../components/QuantityPicker';
import Modal from '../../components/Modal';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useData } from '../../context/DataContext';
import { Ic } from '../../lib/icons';
import { WHATSAPP, formatPKR } from '../../lib/format';

const TABS = ['Description', 'Fabric & Care', 'Size Guide', 'Delivery'];

function Gallery({ images }) {
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const imgs = images && images.length ? images : ['/images/placeholder.svg'];

  useEffect(() => {
    setIdx(0);
    setZoomed(false);
  }, [images]);

  return (
    <>
      <div className="gallery">
        {imgs.length > 1 && (
          <div className="gallery-thumbs">
            {imgs.map((im, i) => (
              <button key={i} className={idx === i ? 'active' : ''} onClick={() => setIdx(i)}>
                <ProductImage src={im} alt="" />
              </button>
            ))}
          </div>
        )}
        <div
          className={`gallery-main ${zoomed ? 'zoomed' : ''}`}
          onClick={() => (zoomed ? setLightbox(true) : setZoomed(true))}
          onMouseLeave={() => setZoomed(false)}
        >
          <ProductImage src={imgs[idx]} alt="" eager />
          <div className="gallery-actions">
            <button className="icon-btn" style={{ background: 'rgba(255,255,255,0.9)' }} onClick={(e) => { e.stopPropagation(); setLightbox(true); }} aria-label="Fullscreen">
              <Ic.Zoom />
            </button>
          </div>
          <div className="eyebrow" style={{ position: 'absolute', bottom: 12, right: 12, margin: 0, color: '#fff', background: 'rgba(28,25,23,0.7)', padding: '6px 10px', borderRadius: 999, letterSpacing: 2, fontSize: 10 }}>
            Click to zoom · {imgs.length} {imgs.length === 1 ? 'photo' : 'photos'}
          </div>
        </div>
      </div>
      <Modal onClose={() => setLightbox(false)} title="View">
        <img src={imgs[idx]} alt="" style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 10 }} />
        <div className="gallery-thumbs" style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 14 }}>
          {imgs.map((im, i) => (
            <button key={i} className={idx === i ? 'active' : ''} onClick={() => setIdx(i)}>
              <ProductImage src={im} alt="" />
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

function SizeGuideModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="Size Guide">
      <div className="size-guide">
        <table>
          <thead>
            <tr><th>Size</th><th>Bust (in)</th><th>Waist (in)</th><th>Hips (in)</th></tr>
          </thead>
          <tbody>
            <tr><td>XS</td><td>32</td><td>26</td><td>36</td></tr>
            <tr><td>S</td><td>34</td><td>28</td><td>38</td></tr>
            <tr><td>M</td><td>36</td><td>30</td><td>40</td></tr>
            <tr><td>L</td><td>38</td><td>32</td><td>42</td></tr>
            <tr><td>XL</td><td>40</td><td>34</td><td>44</td></tr>
            <tr><td>XXL</td><td>42</td><td>36</td><td>46</td></tr>
          </tbody>
        </table>
        <p className="dim small mt-16">
          For unstitched pieces, please share your measurements on WhatsApp and we will help you choose the right fabric quantity.
        </p>
      </div>
    </Modal>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState(0);
  const [related, setRelated] = useState([]);
  const [sizeGuide, setSizeGuide] = useState(false);
  const cart = useCart();
  const wish = useWishlist();
  const { meta } = useData();

  useEffect(() => {
    setP(null);
    setSize('');
    setColor('');
    setQty(1);
    api(`/products/${slug}`)
      .then(({ product }) => {
        setP(product);
        setSize(product.sizes[0] || '');
        setColor(product.colors[0]?.name || '');
        api(`/products?category=${product.categorySlug}&limit=4`).then((r) => setRelated(r.items.filter((x) => x.id !== product.id))).catch(() => {});
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  const saved = p ? wish.has(p.id) : false;

  const addToCart = () => {
    if (!p || !p.inStock) return;
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
    cart.setOpen(true);
  };

  const buyNow = () => {
    if (!p || !p.inStock) return;
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
    navigate('/checkout');
  };

  if (notFound) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 30 }}>Product not found</h1>
        <p className="dim mt-8">This product may have sold out.</p>
        <Link to="/shop" className="btn btn-dark mt-24">Back to Shop</Link>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="container" style={{ padding: '40px 16px' }}>
        <div className="sk" style={{ aspectRatio: '16/9', borderRadius: 16 }} />
      </div>
    );
  }

  const waMsg = WHATSAPP(`Hello! I'm interested in "${p.name}" (${formatPKR(p.salePrice || p.price)}). Is it available?`, meta.whatsapp);

  return (
    <>
      <div className="container">
        <div className="crumbs mt-24">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${p.categorySlug}`}>{p.category}</Link> / {p.name}
        </div>
        <div className="pd">
          <Gallery images={p.images} />
          <div className="pd-info">
            <h1>{p.name}</h1>
            <div className="pd-meta">
              <span className={`stock-state ${p.inStock ? 'in' : 'out'}`}>
                {p.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              {p.stock > 0 && p.stock <= 10 && (
                <span className="dim small">Only {p.stock} left</span>
              )}
            </div>

            <Price price={p.price} salePrice={p.salePrice} size="lg" />
            <p className="pd-desc">{p.shortDesc}</p>

            {p.sizes.length > 0 && (
              <div className="pd-options">
                <div className="lbl">
                  Select Size
                  <button onClick={() => setSizeGuide(true)} style={{ textDecoration: 'underline', color: 'var(--gold-dark)' }}>
                    Size guide
                  </button>
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
                  Select Color <b>{color}</b>
                </div>
                <div className="swatch-row">
                  {p.colors.map((c) => (
                    <button key={c.name} className={`swatch ${color === c.name ? 'active' : ''}`} style={{ background: c.hex }} onClick={() => setColor(c.name)} title={c.name}>
                      {color === c.name && <small>{c.name}</small>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pd-options">
              <div className="lbl">Quantity</div>
              <QuantityPicker value={qty} onChange={setQty} max={p.stock} />
            </div>

            <div className="pd-cta">
              <button className="btn btn-outline" onClick={() => addToCart()}>Add to Cart</button>
              <button className="btn btn-gold" disabled={!p.inStock} onClick={buyNow}>Buy Now</button>
              <button className={`icon-btn ${saved ? '' : ''}`} style={{ border: '1px solid var(--line-strong)' }} onClick={() => wish.toggle(p.id)} aria-label="Wishlist">
                <Ic.Heart style={saved ? { fill: 'var(--rose)', stroke: 'var(--rose)' } : undefined} />
              </button>
            </div>

            <div className="row mt-24">
              <a className="btn btn-ghost" href={waMsg} target="_blank" rel="noreferrer">
                <Ic.WhatsApp width={16} height={16} /> Order via WhatsApp
              </a>
            </div>

            <div className="tabs">
              <div className="tab-bar">
                {TABS.map((t, i) => (
                  <button key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="tab-panel">
                {tab === 0 && <p>{p.description || p.shortDesc}</p>}
                {tab === 1 && (
                  <div>
                    <p><strong>Fabric:</strong> {p.fabric}</p>
                    <p className="mt-8">{p.fabricCare}</p>
                  </div>
                )}
                {tab === 2 && (
                  <div className="size-guide">
                    <table>
                      <thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hips</th></tr></thead>
                      <tbody>
                        <tr><td>XS</td><td>32</td><td>26</td><td>36</td></tr>
                        <tr><td>S</td><td>34</td><td>28</td><td>38</td></tr>
                        <tr><td>M</td><td>36</td><td>30</td><td>40</td></tr>
                        <tr><td>L</td><td>38</td><td>32</td><td>42</td></tr>
                        <tr><td>XL</td><td>40</td><td>34</td><td>44</td></tr>
                        <tr><td>XXL</td><td>42</td><td>36</td><td>46</td></tr>
                      </tbody>
                    </table>
                    <p className="dim small mt-8">All measurements in inches.</p>
                  </div>
                )}
                {tab === 3 && (
                  <div>
                    <div className="delivery-note">
                      <strong>Cash on Delivery</strong> — pay when your order arrives at your doorstep.
                      Estimated delivery <strong>2–5 business days</strong> within Pakistan.
                      Delivery charges apply as shown at checkout.
                    </div>
                    <p className="mt-16 dim small">
                      We deliver across Pakistan via trusted couriers. Once your order is shipped you'll see
                      live updates on your tracking page.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section style={{ padding: '30px 0 70px' }}>
            <div className="section-head">
              <div className="eyebrow">You may also love</div>
              <h2>Complete the Look</h2>
            </div>
            <div className="grid grid-3">{related.map((prod) => <ProductCard key={prod.id} product={prod} />)}</div>
          </section>
        )}
      </div>
      {sizeGuide && <SizeGuideModal onClose={() => setSizeGuide(false)} />}
    </>
  );
}