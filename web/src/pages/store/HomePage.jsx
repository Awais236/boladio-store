import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import { ProductGridSkeleton } from '../../components/Skeleton';
import ProductImage from '../../components/ProductImage';
import { Ic } from '../../lib/icons';

function Hero() {
  return (
    <section className="hero">
      <img
        className="hero-bg"
        src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1800&auto=format&fit=crop"
        alt="Elegant Pakistani fashion"
        loading="eager"
      />
      <div className="container">
        <div className="hero-content">
          <div className="eyebrow">Boliolo · Islamabad</div>
          <h1>
            Elegance, <em>Designed</em> for You
          </h1>
          <p>
            Discover contemporary Pakistani fashion crafted for everyday elegance, celebrations and
            unforgettable occasions.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-light btn-xl">
              Shop Collection
            </Link>
            <Link to="/shop?category=formal-wear" className="btn btn-xl" style={{ border: '1px solid rgba(255,255,255,0.5)', color: '#fff' }}>
              Explore Formal Wear
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceStrip() {
  const items = [
    { icon: Ic.Truck, t: 'Cash on Delivery', d: 'Pay when your order arrives at your doorstep.' },
    { icon: Ic.Clock, t: '2–5 Business Days', d: 'Fast tracked delivery across Pakistan.' },
    { icon: Ic.Refresh, t: 'Easy Returns', d: 'Simple returns for your peace of mind.' },
    { icon: Ic.Phone, t: 'Personal Service', d: 'WhatsApp us for styling advice.' },
  ];
  return (
    <section className="section" style={{ padding: '44px 0' }}>
      <div className="container">
        <div className="service-strip">
          {items.map((s) => (
            <div key={s.t} style={{ textAlign: 'center', padding: '10px 18px' }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--paper-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-dark)', marginBottom: 10 }}>
                <s.icon width={22} height={22} />
              </div>
              <h4 style={{ fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600, letterSpacing: '0.02em' }}>{s.t}</h4>
              <p className="dim small" style={{ marginTop: 3 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Categories({ categories }) {
  if (!categories.length) return null;
  const first = categories[0];
  const rest = categories.slice(1);
  return (
    <section className="section" style={{ paddingTop: 20 }}>
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">Curated Collections</div>
          <h2>Shop by Category</h2>
          <p>From daily elegance to grand celebrations - a collection for every moment.</p>
        </div>
        <div className="cat-grid">
          {first && (
            <div className="cat-card wide">
              <ProductImage src={first.image_url} alt={first.name} eager />
              <div className="cat-body">
                <h3>{first.name}</h3>
                <p>{first.tagline}</p>
                <span className="explore">
                  Explore <Ic.Arrow />
                </span>
              </div>
              <Link to={`/shop?category=${first.slug}`} style={{ position: 'absolute', inset: 0, zIndex: 3 }} aria-label={first.name} />
            </div>
          )}
          {rest.slice(0, 4).map((c) => (
            <div className="cat-card" key={c.id}>
              <ProductImage src={c.image_url} alt={c.name} />
              <div className="cat-body">
                <h3>{c.name}</h3>
                <p>{c.tagline}</p>
                <span className="explore">
                  Explore <Ic.Arrow />
                </span>
              </div>
              <Link to={`/shop?category=${c.slug}`} style={{ position: 'absolute', inset: 0, zIndex: 3 }} aria-label={c.name} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/categories'),
      api('/products?is_new=true&sort=newest&limit=8'),
      api('/products?featured=true&limit=8'),
    ])
      .then(([cats, news, feat]) => {
        setCategories(cats.items);
        setNewArrivals(news.items);
        setFeatured(feat.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Hero />
      <ServiceStrip />
      <Categories categories={categories} />

      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Just Arrived</div>
            <h2>New Arrivals</h2>
            <p>Fresh pieces chosen for the season.</p>
            <Link to="/shop?collection=new" className="btn btn-outline btn-sm mt-16">
              View All <Ic.Arrow width={13} height={13} />
            </Link>
          </div>
          {loading ? <ProductGridSkeleton count={8} /> : <div className="grid">{newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 10, background: 'var(--paper-2)' }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">The Edit</div>
            <h2>Featured Collections</h2>
            <p>Our most loved silhouettes this season.</p>
          </div>
          {loading ? <ProductGridSkeleton count={8} /> : <div className="grid">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--ink)', color: '#f3ecdf' }}>
        <div className="container">
          <div className="split">
            <div>
              <div className="eyebrow">Our Story</div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', margin: '12px 0 16px', color: '#fff' }}>
                Where Tradition Meets Contemporary Elegance
              </h2>
              <p style={{ opacity: 0.85, lineHeight: 1.8 }}>
                Boliolo brings together contemporary Pakistani fashion and timeless traditional
                aesthetics. From beautifully crafted everyday pieces to sophisticated formal and wedding
                wear, every collection is selected with elegance, quality and individuality in mind.
              </p>
              <Link to="/about" className="btn btn-gold mt-24">
                About Us <Ic.Arrow width={14} height={14} />
              </Link>
            </div>
            <ProductImage
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop"
              alt="Boliolo collection"
              style={{ borderRadius: 18, width: '100%', aspectRatio: '4/5', objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>
    </>
  );
}