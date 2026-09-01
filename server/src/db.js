const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[pg] Unexpected error on idle client', err.message);
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone ON users (phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  tagline    TEXT,
  description TEXT,
  image_url  TEXT,
  position   INT NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id                 SERIAL PRIMARY KEY,
  category_id        INT REFERENCES categories(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  short_desc         TEXT,
  description        TEXT,
  fabric_care        TEXT,
  fabric             TEXT,
  price              NUMERIC(12,2) NOT NULL,
  sale_price         NUMERIC(12,2),
  stock              INT NOT NULL DEFAULT 0,
  sizes              TEXT[] NOT NULL DEFAULT '{}',
  colors             JSONB NOT NULL DEFAULT '[]',
  images             JSONB NOT NULL DEFAULT '[]',
  thumbnail          TEXT,
  featured           BOOLEAN NOT NULL DEFAULT false,
  is_new             BOOLEAN NOT NULL DEFAULT false,
  active             BOOLEAN NOT NULL DEFAULT true,
  low_stock_notified BOOLEAN NOT NULL DEFAULT false,
  out_stock_notified BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (featured) WHERE featured;
CREATE INDEX IF NOT EXISTS idx_products_new ON products (is_new) WHERE is_new;

CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  order_number   TEXT NOT NULL UNIQUE,
  customer_id    INT REFERENCES users(id) ON DELETE SET NULL,
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  city           TEXT NOT NULL,
  area           TEXT,
  address        TEXT NOT NULL,
  postal_code    TEXT,
  notes          TEXT,
  items          JSONB NOT NULL,
  item_count     INT NOT NULL DEFAULT 0,
  subtotal       NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee   NUMERIC(12,2) NOT NULL DEFAULT 250,
  total          NUMERIC(12,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','preparing','shipped','out_for_delivery','delivered','cancelled')),
  payment_method  TEXT NOT NULL DEFAULT 'cod',
  payment_status  TEXT NOT NULL DEFAULT 'unpaid',
  suspicious      BOOLEAN NOT NULL DEFAULT false,
  confirm_token   TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('admin','customer')),
  target_id   INT,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  order_id    INT,
  link        TEXT,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_admin_unread ON notifications (target_type, read) WHERE target_type = 'admin';
CREATE INDEX IF NOT EXISTS idx_notif_customer ON notifications (target_id, read);

CREATE TABLE IF NOT EXISTS settings (
  id                  INT PRIMARY KEY DEFAULT 1,
  store_open          BOOLEAN NOT NULL DEFAULT true,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  delivery_fee        NUMERIC(12,2) NOT NULL DEFAULT 250,
  announcement        TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO settings (id, store_open, low_stock_threshold, delivery_fee)
  VALUES (1, true, 5, 250)
  ON CONFLICT (id) DO NOTHING;
`;

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb, SCHEMA };

if (require.main === module) {
  initDb()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('[db] Schema ready.');
      return pool.end();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[db] init failed', err);
      process.exit(1);
    });
}