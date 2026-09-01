const app = require('../server/src/app');
const { initDb } = require('../server/src/db');
const { seedDatabase } = require('../server/src/seed');

let ready = false;

module.exports = async function handler(req, res) {
  if (!ready) {
    await initDb();
    await seedDatabase();
    ready = true;
  }
  return app(req, res);
};
