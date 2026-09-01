const bcrypt = require('bcryptjs');
const { pool, initDb } = require('./db');
const { slugify } = require('./util');

const CATEGORIES = [
  { name: 'Ready to Wear', tagline: 'Elegant ready-to-wear collections', description: 'Beautifully finished outfits ready to wear the moment they arrive. Contemporary cuts with refined Pakistani craftsmanship.', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop', position: 1 },
  { name: 'Unstitched', tagline: 'Premium fabrics and beautifully designed pieces', description: 'Fine silks, lawns and chiffons with elegant embroidered panels - tailored to your perfect fit by your own tailor.', image: 'https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=1200&auto=format&fit=crop', position: 2 },
  { name: 'Formal Wear', tagline: 'Sophisticated outfits for special occasions', description: 'Luxurious formal suits, gowns and ghararas for dinners, events and celebrations.', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1200&auto=format&fit=crop', position: 3 },
  { name: 'Wedding', tagline: 'Elegant looks for weddings and festive celebrations', description: 'Bridal and wedding guest collections - season colors, rich zardozi and dreamy silhouettes.', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop', position: 4 },
  { name: 'Casual', tagline: 'Comfortable everyday Pakistani fashion', description: 'Everyday kurtis, cottons and printed sets for effortless comfort with elegance.', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop', position: 5 },
];

const C = (n) => CATEGORIES.find((c) => c.name === n)?.name || 'Ready to Wear';

const PRODUCTS = [
  {
    name: 'Embroidered Chiffon Suit',
    category: 'Ready to Wear',
    short_desc: 'Hand-embroidered chiffon 3-piece with swarovski detail on the neckline.',
    description: 'An elegant 3-piece chiffon suit featuring intricate hand embroidery across the front panel and sleeves. The soft flowing chiffon drapes beautifully, making it perfect for daytime functions, dinners and Eid gatherings. Includes embroidered dupatta.',
    fabric_care: 'Dry clean only. Store in a soft garment bag. Avoid direct sunlight for prolonged periods.',
    fabric: 'Premium German Chiffon with hand-embroidered detailing',
    price: 8500, sale_price: 7200, stock: 14,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Emerald', hex: '#0f5a43' }, { name: 'Navy', hex: '#1b2a4a' }, { name: 'Blush', hex: '#e8bfc5' }],
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop',
    ],
    featured: true, is_new: true,
  },
  {
    name: 'Printed Casual Lawn 3-Piece',
    category: 'Ready to Wear',
    short_desc: 'Fresh printed lawn 3-piece for warm days.',
    description: 'A breezy summer lawn 3-piece with a modern digital print, fully stitched and ready to wear. Lightweight, comfortable and effortlessly stylish. Comes with matching trouser and dupatta.',
    fabric_care: 'Gentle machine wash cold with like colours. Iron while slightly damp.',
    fabric: 'Premium Cotton Lawn',
    price: 5200, sale_price: null, stock: 22,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Mint', hex: '#8fd3b9' }, { name: 'Sage', hex: '#a9b89a' }],
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop'],
    featured: true, is_new: true,
  },
  {
    name: 'Pure Cotton Kameez & Trousers',
    category: 'Ready to Wear',
    short_desc: 'Classic cotton kameez with tailored trousers.',
    description: 'An everyday essential - pure cotton kameez with a neat tailored trouser. The classic fit and breathable fabric make it ideal for work, college and daily wear.',
    fabric_care: 'Machine wash cold, do not bleach, line dry.',
    fabric: '100% Pure Cotton',
    price: 4800, sale_price: 4100, stock: 8,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Sky Blue', hex: '#7fb3d5' }, { name: 'Off White', hex: '#f5f1e6' }],
    images: ['https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: false,
  },
  {
    name: 'Premium Chiffon Unstitched 3-Piece',
    category: 'Unstitched',
    short_desc: 'Designer chiffon unstitched 3-piece with embroidered front.',
    description: 'Unstitched luxury chiffon 3-piece with a fully embroidered front panel, organza inner and dyed dupatta with embellished border. Tailor it to your preference for a perfect couture fit.',
    fabric_care: 'Dry clean recommended. Keep away from perfume sprays directly.',
    fabric: 'Luxury Chiffon with embroidered front panel',
    price: 9900, sale_price: null, stock: 30,
    sizes: ['One Size'],
    colors: [{ name: 'Dusty Rose', hex: '#d4a29c' }, { name: 'Teal', hex: '#1a5b61' }],
    images: ['https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=900&auto=format&fit=crop', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=900&auto=format&fit=crop'],
    featured: true, is_new: false,
  },
  {
    name: 'Designer Lawn Unstitched 2-Piece',
    category: 'Unstitched',
    short_desc: 'Contemporary designer lawn 2-piece.',
    description: 'A designer lawn 2-piece in a modern art-inspired print with a delicate neckline finish. Pairs beautifully with stitched trousers or a shalwar of your choice.',
    fabric_care: 'Machine wash cold separately for the first wash.',
    fabric: 'Designer Cotton Lawn',
    price: 6500, sale_price: 5600, stock: 40,
    sizes: ['One Size'],
    colors: [{ name: 'Coral', hex: '#e5826a' }, { name: 'Mustard', hex: '#d9a441' }],
    images: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: true,
  },
  {
    name: 'Organza Embroidered Unstitched 3-Piece',
    category: 'Unstitched',
    short_desc: 'Luxurious organza unstitched set for occasions.',
    description: 'A rich organza unstitched 3-piece with intricate embroidery on the dupatta and kameez panels. The subtle sheen of organza adds an occasion-ready elegance to your fitted tailoring.',
    fabric_care: 'Dry clean only.',
    fabric: 'Italian Organza with fine zardozi embroidery',
    price: 12500, sale_price: null, stock: 12,
    sizes: ['One Size'],
    colors: [{ name: 'Ivory', hex: '#f3ead5' }, { name: 'Rose Gold', hex: '#b76e79' }],
    images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: false,
  },
  {
    name: 'Silk Unstitched Luxury 3-Piece',
    category: 'Unstitched',
    short_desc: 'Pure silk unstitched luxury set.',
    description: 'The pinnacle of unstitched luxury. Pure silk fabric with hand-painted detailing and a contrast border dupatta. A timeless addition to a discerning wardrobe.',
    fabric_care: 'Dry clean only. Store in muslin cloth if not wearing for a long time.',
    fabric: 'Pure Silk',
    price: 15900, sale_price: 13900, stock: 6,
    sizes: ['One Size'],
    colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'Deep Maroon', hex: '#5c1f2a' }],
    images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: false,
  },
  {
    name: 'Zari Embroidered Formal Gown',
    category: 'Formal Wear',
    short_desc: 'Floor-length formal gown with zari embroidery.',
    description: 'A graceful floor-length formal gown with gold zari embroidery cascading from the waist. Structured bodice, flowing skirt and a dreamy fit for weddings dinners and formal evenings.',
    fabric_care: 'Dry clean only. Handle jewellery carefully to avoid snags.',
    fabric: 'Chiffon with Zari Embroidery',
    price: 18500, sale_price: null, stock: 7,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Burgundy', hex: '#6d1a2b' }, { name: 'Midnight', hex: '#202a44' }],
    images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop'],
    featured: true, is_new: false,
  },
  {
    name: 'Pearl Embellished Formal Suit',
    category: 'Formal Wear',
    short_desc: 'Pearl-studded formal 3-piece ensemble.',
    description: 'A sophisticated formal 3-piece with delicate pearl embellishments on the neckline and cuffs. The ankle-length cut and tailored trousers give clean, modern lines for evening receptions.',
    fabric_care: 'Dry clean only. Store flat to preserve the embellishments.',
    fabric: 'Net & Pearl Embellishment over Satin',
    price: 21900, sale_price: 19400, stock: 5,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Champagne', hex: '#d8c49d' }, { name: 'Blush', hex: '#e8bfc5' }],
    images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: true,
  },
  {
    name: 'Contemporary Formal Anarkali',
    category: 'Formal Wear',
    short_desc: 'Modern anarkali with defined flare.',
    description: 'A contemporary anarkali silhouette - fitted bodice, defined waist and a graceful flare. Embroidered yoke detail with a matching churidar completes this refined formal look.',
    fabric_care: 'Dry clean only.',
    fabric: 'Raw Silk with Embroidery',
    price: 16900, sale_price: null, stock: 9,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Forest Green', hex: '#1e4d3b' }, { name: 'Plum', hex: '#5b2a4e' }],
    images: ['https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=900&auto=format&fit=crop'],
    featured: true, is_new: true,
  },
  {
    name: 'Palazzo Gharara Formal Set',
    category: 'Formal Wear',
    short_desc: 'Statement palazzo gharara with strapless-friendly design.',
    description: 'An opulent palazzo gharara set with flowing wide legs, detailed border work and a beautifully finished kameez. Made for weddings where you want to make an entrance.',
    fabric_care: 'Dry clean only. Steam, do not iron directly on embellishments.',
    fabric: 'Heavy Silk with Gota Detail',
    price: 24500, sale_price: 21500, stock: 4,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Peacock Blue', hex: '#135e6b' }, { name: 'Magenta', hex: '#a0356a' }],
    images: ['https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: false,
  },
  {
    name: 'Bridal Embroidered Gown',
    category: 'Wedding',
    short_desc: 'Boliolo\'s signature bridal gown - couture embroidery.',
    description: 'Our signature bridal gown, made with weeks of hand embroidery work including zardozi, dabka and resham in a rich, timeless palette. Crafted to celebrate the biggest day of your life.',
    fabric_care: 'Professional couture cleaning only. Store away from light.',
    fabric: 'Organza & Net with Couture Zardozi',
    price: 89000, sale_price: null, stock: 2,
    sizes: ['S', 'M', 'L'],
    colors: [{ name: 'Ivory', hex: '#f3ead5' }, { name: 'Champagne', hex: '#d8c49d' }],
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=900&auto=format&fit=crop', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop'],
    featured: true, is_new: false,
  },
  {
    name: 'Red Wedding Valima Suit',
    category: 'Wedding',
    short_desc: 'Classic red valima suit with minimal shimmer.',
    description: 'A classic valima red - rich, joyful and regal. Luxurious fabric with fine gold accent work along the neckline and sleeves, finished with a coordinating dupatta.',
    fabric_care: 'Dry clean only.',
    fabric: 'Silk blend with gold thread work',
    price: 64500, sale_price: null, stock: 3,
    sizes: ['M', 'L', 'XL'],
    colors: [{ name: 'Rich Red', hex: '#8e1a1a' }, { name: 'Deep Red', hex: '#6d0f0f' }],
    images: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=900&auto=format&fit=crop'],
    featured: true, is_new: true,
  },
  {
    name: 'Mayun Yellow Organza Set',
    category: 'Wedding',
    short_desc: 'Mayun ritual organza set in festive yellow.',
    description: 'A joyful mayun set in festival yellow organza with dhaaga and gota detailing. Lightweight enough to dance in, beautiful enough for the haldi and mayun festivities.',
    fabric_care: 'Gentle dry clean.',
    fabric: 'Organza with Gota Work',
    price: 48000, sale_price: null, stock: 5,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Mayun Yellow', hex: '#e6c13c' }, { name: 'Lemon', hex: '#f0d55a' }],
    images: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: false,
  },
  {
    name: 'Everyday Cotton Kurti',
    category: 'Casual',
    short_desc: 'Soft everyday cotton kurti.',
    description: 'An easy-fitting everyday cotton kurti in rich, year-round colours. Breathable, comfortable and designed to move with you through the day.',
    fabric_care: 'Machine wash cold, tumble dry low.',
    fabric: '100% Cotton',
    price: 2900, sale_price: 2400, stock: 35,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Olive', hex: '#7c8a5a' }, { name: 'Rust', hex: '#b9683c' }, { name: 'Grey', hex: '#8f8f8f' }],
    images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: false,
  },
  {
    name: 'Printed Dupatta Casual Set',
    category: 'Casual',
    short_desc: 'Printed 2-piece casual set with matching dupatta.',
    description: 'A relaxed printed 2-piece casual set with a matching lightweight dupatta. An effortless everyday look with a touch of print.',
    fabric_care: 'Machine wash cold separately first wash.',
    fabric: 'Cotton Printed with Chiffon Dupatta',
    price: 3900, sale_price: null, stock: 18,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Teal', hex: '#1a5b61' }, { name: 'Terracotta', hex: '#c46a4a' }],
    images: ['https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=900&auto=format&fit=crop'],
    featured: false, is_new: true,
  },
];

async function seedDatabase() {
  await initDb();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rowCount: catCount } = await client.query('SELECT 1 FROM categories LIMIT 1');
    if (catCount === 0) {
      for (const [i, c] of CATEGORIES.entries()) {
        await client.query(
          `INSERT INTO categories (name, slug, tagline, description, image_url, position) VALUES ($1,$2,$3,$4,$5,$6)`,
          [c.name, slugify(c.name), c.tagline, c.description, c.image, i + 1]
        );
      }
      console.log('[seed] categories inserted');
    }

    const { rowCount: userCount } = await client.query('SELECT 1 FROM users LIMIT 1');
    if (userCount === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,'admin')`,
        ['Nadia', 'admin@boliolo.pk', '0123456789', adminHash]
      );
      const custHash = await bcrypt.hash('customer123', 10);
      await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,'customer')`,
        ['Ayesha Khan', 'ayesha@example.com', '03451234567', custHash]
      );
      console.log('[seed] users inserted');
    }

    const { rowCount: prodCount } = await client.query('SELECT 1 FROM products LIMIT 1');
    if (prodCount === 0) {
      for (const p of PRODUCTS) {
        const { rows } = await client.query('SELECT id FROM categories WHERE name = $1', [p.category]);
        const categoryId = rows.length ? rows[0].id : null;
        await client.query(
          `INSERT INTO products
            (category_id, name, slug, short_desc, description, fabric_care, fabric, price, sale_price, stock, sizes, colors, images, thumbnail, featured, is_new)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            categoryId, p.name, slugify(p.name) + '-' + String(Math.floor(Math.random() * 900) + 100),
            p.short_desc, p.description, p.fabric_care, p.fabric,
            p.price, p.sale_price, p.stock,
            p.sizes, JSON.stringify(p.colors), JSON.stringify(p.images),
            p.images[0], p.featured, p.is_new,
          ]
        );
      }
      console.log('[seed] products inserted');
    }

    const { rowCount: notifCount } = await client.query('SELECT 1 FROM notifications LIMIT 1');
    if (notifCount === 0) {
      await client.query(
        `INSERT INTO notifications (target_type, type, title, message) VALUES ('admin','welcome','Welcome to the dashboard','Manage products, orders and customers in real time.')`
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { seedDatabase, CATEGORIES, PRODUCTS };

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[seed] Done.');
      return pool.end();
    })
    .catch((err) => {
      console.error('[seed] failed', err);
      process.exit(1);
    });
}