const http = require('http');
const app = require('./app');
const config = require('./config');
const { initDb } = require('./db');
const { seedDatabase } = require('./seed');

const server = http.createServer(app);

async function boot() {
  await initDb();
  await seedDatabase();
  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] ${config.brand.name} API on http://localhost:${config.port}`);
  });
}

boot().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] failed to start', err);
  process.exit(1);
});
