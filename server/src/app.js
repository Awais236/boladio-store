const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const { ApiError } = require('./util');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const metaRoutes = require('./routes/meta');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.webOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use('/api', apiLimiter);

app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    if (config.env !== 'test') {
      // eslint-disable-next-line no-console
      console.log(`${req.method} ${req.originalUrl} ${_res.statusCode} ${Date.now() - start}ms`);
    }
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meta', metaRoutes);

app.use('/api', (req, _res, next) => next(new ApiError(404, `Not found: ${req.originalUrl}`)));

if (!process.env.VERCEL) {
  if (fs.existsSync(path.join(config.webDist, 'index.html'))) {
    app.use(express.static(config.webDist, { maxAge: '1d' }));
    app.get(/^(?!\/(api|uploads)).*/, (_req, res) => {
      res.sendFile(path.join(config.webDist, 'index.html'));
    });
  }
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload too large.' });
  }
  if (err && err.code && String(err.code).startsWith('22')) {
    return res.status(400).json({ error: 'Invalid numeric value provided.' });
  }
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;
