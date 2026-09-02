import { Link } from 'react-router-dom';
import ProductImage from '../../components/ProductImage';
import { Ic } from '../../lib/icons';

const HIGHLIGHTS = [
  { icon: Ic.User, t: 'Personalized Service', d: 'One-on-one styling advice before and after your purchase.' },
  { icon: Ic.Tag, t: 'Quality Fabrics', d: 'Only premium chiffons, lawns, silks and organzas.' },
  { icon: Ic.Star, t: 'Detailed Craftsmanship', d: 'Hand embroidery and finishing you can see and feel.' },
  { icon: Ic.Clock, t: 'Formal & Event Wear', d: 'Curated formal and bridal collections for every occasion.' },
  { icon: Ic.Edit, t: 'Custom Designs', d: 'Bespoke tailoring and custom design consultations.' },
  { icon: Ic.Truck, t: 'COD Across Pakistan', d: 'Order online, pay cash on delivery at your doorstep.' },
];

export default function AboutPage() {
  return (
    <>
      <div className="page-head">
        <div className="crumbs"><Link to="/">Home</Link> / About</div>
        <h1>About Boliolo</h1>
        <p>Boutique · Block ABC, Street ABC · Islamabad</p>
      </div>

      <div className="container">
        <section className="section" style={{ paddingBottom: 30 }}>
          <div className="split">
            <ProductImage
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop"
              alt="Boutique"
              style={{ borderRadius: 18, width: '100%', aspectRatio: '4/5', objectFit: 'cover' }}
              eager
            />
            <div>
              <div className="eyebrow">Our Story</div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', margin: '12px 0 18px' }}>
                Where Tradition Meets Contemporary Elegance
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                Boliolo brings together contemporary Pakistani fashion and timeless traditional
                aesthetics. From beautifully crafted everyday pieces to sophisticated formal and wedding
                wear, every collection is selected with elegance, quality and individuality in mind.
              </p>
              <p className="mt-16" style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                Located in the heart of Islamabad, we serve women who love classic Pakistani
                silhouettes — kameez suits, formals, ghararas and bridal ensembles — with a modern,
                refined point of view.
              </p>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 30 }}>
          <div className="section-head">
            <div className="eyebrow">What Makes Us Different</div>
            <h2>Considering the Details</h2>
          </div>
          <div className="hl-list">
            {HIGHLIGHTS.map((h, i) => (
              <div className="hl-item" key={i}>
                <h4>
                  <h.icon width={17} height={17} style={{ color: 'var(--gold-dark)' }} /> {h.t}
                </h4>
                <p>{h.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" style={{ background: 'var(--paper-2)', borderRadius: 20, padding: '50px 30px' }}>
          <div className="center">
            <div className="eyebrow">Visit Us</div>
            <h2 style={{ margin: '12px 0 8px' }}>Block ABC, Street ABC, Islamabad</h2>
            <p className="dim">
              Walk-ins welcome · Block ABC, Street ABC, House Number 123, Islamabad · {`0123456789`}
            </p>
            <div className="row mt-24" style={{ justifyContent: 'center' }}>
              <Link to="/contact" className="btn btn-dark">Get in Touch</Link>
              <Link to="/shop" className="btn btn-outline">Shop the Collection</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}