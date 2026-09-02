require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://nadia_app:nadia_pass@127.0.0.1:5432/nadia_fashion',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessMinutes: parseInt(process.env.ACCESS_TOKEN_MINUTES || '60', 10),
    refreshDays: parseInt(process.env.REFRESH_TOKEN_DAYS || '14', 10),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5175',
  brand: {
    name: process.env.STORE_NAME || 'Boliolo',
    phone: process.env.STORE_PHONE || '0123456789',
    whatsapp: process.env.WHATSAPP_NUMBER || '9201234567890',
    address: process.env.STORE_ADDRESS || 'Block ABC, Street ABC, House Number 123, Islamabad',
  },
  uploadsDir: require('path').join(__dirname, '..', 'uploads'),
  webDist: require('path').join(__dirname, '..', '..', 'web', 'dist'),
};