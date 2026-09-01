# Nadia's Fashion — E-Commerce Store + Admin Dashboard

A premium, mobile-first, **real-time** e-commerce website for **Nadia's Fashion**, a Pakistani women's fashion boutique in F-7 Markaz, Islamabad.

The app is built as a **monorepo** (`npm workspaces`) with two parts:

- **Storefront** (`web/`) — browse, product details, search, wishlist, cart, cash-on-delivery checkout, live order tracking, account, contact/WhatsApp.
- **Admin dashboard** (`web/` under `/admin`) — real-time orders, order status management, products/inventory, customers, notifications, store settings and stats.

**Stack:** Node.js + Express + PostgreSQL + Socket.IO + React (Vite). JWT auth with customer/admin roles. **COD-only** (orders stay `UNPAID` until delivered).

---

## Requirements

- **Node.js ≥ 20** (a portable copy is bundled at `.tools/node-v20.19.4-win-x64` if Node isn't on your PATH — prefix commands with its `bin` directory).
- **PostgreSQL 16+** installed and running as service `postgresql-x64-18` (or your version).

---

## Database setup (one time)

The app connects using the credentials below. The schema and seed data **auto-initialize on server boot**, so this is only needed if you want to reset or provision manually.

| Setting   | Value                            |
| --------- | -------------------------------- |
| Host/Port | `127.0.0.1:5432`                 |
| Database  | `nadia_fashion`                  |
| User      | `nadia_app`                      |
| Password  | `nadia_pass`                     |

To create the role + database if they don't exist (as the `postgres` superuser):

```sql
CREATE ROLE nadia_app WITH LOGIN PASSWORD 'nadia_pass';
CREATE DATABASE nadia_fashion OWNER nadia_app;
```

Connection string used by the server:
`postgres://nadia_app:nadia_pass@127.0.0.1:5432/nadia_fashion`

---

## Install & run

```bash
# 1. Install dependencies (from repo root; Node on PATH needed)
npm install

# 2. (Optional) provision schema + seed immediately
npm run setup        # runs init:db then seed

# 3a. Development — runs API (4000) + Vite dev (5175) together
npm run dev

# 3b. Or run production — build the frontend, then serve it from Express
npm run build
npm run start         # serves API + built web app on http://localhost:4000
```

Development URLs:

- Storefront: <http://localhost:5175> (Vite, proxies `/api`, `/uploads` and `/socket.io` → 4000)
- API: <http://localhost:4000/api>
- Production URL (after `build` + `start`): <http://localhost:4000>

> **Note for this environment:** if you open a fresh shell and `node` is not found, prefix with the portable Node:
> `$env:PATH = "C:\programs\store\.tools\node-v20.19.4-win-x64;$env:PATH"`

---

## Default accounts (seeded)

| Role     | Phone        | Password     |
| -------- | ------------ | ------------ |
| Admin    | `03215845987`| `admin123`   |
| Customer | `03451234567`| `customer123`|

---

## Architecture

```
server/                     Express + Socket.IO API
  src/
    index.js                Entry: initDb + seed + listen
    app.js                  Express app, middleware, error handling
    config.js               Environment / DB / brand config
    db.js                   pg pool + schema (auto-created)
    seed.js                 Categories, admin/customer, 16 products
    util.js                 Helpers: errors, phone validation, orderPublic
    auth.js                 JWT sign/verify, cookies, route guards
    middleware/upload.js    Multer image upload (4MB, jpg/png/webp/gif)
    realtime/
      socket.js             Socket.IO: auth, admins room, order rooms
      notify.js             Broadcasts + notification persistence
    services/orders.js      placeOrder / updateOrderStatus (stock, restock, COD)
    routes/                 auth, products, categories, orders, admin, meta
web/                        React (Vite) app — storefront + admin SPA
  src/
    lib/                    api wrapper, socket singleton, icons, format
    context/                Auth, Cart, Wishlist, Toast, Data
    components/             Shared UI + admin building blocks
    pages/store/            Storefront pages
    pages/admin/            Admin pages (dashboard, orders, products, ...)
```

### Key behaviours

- **Order lifecycle:** `pending → confirmed → preparing → shipped → out_for_delivery → delivered`.
  `pending`/`confirmed` can be **cancelled** (cancellation restocks inventory).
  Payment stays **`unpaid`** until an order is marked `delivered` (COD).
- **Realtime:** admin sockets join the `admins` room; customers join `order:{id}` via the `track` socket event (guarded by matching order phone). Events: `order:new`, `order:update`, `admin:order:update`, `admin:notification`, `user:notification`.
- **COD protection:** Pakistani phone validation, rate limits on login/orders/contact, server-side pricing (never trusts the client), duplicate-order detection flags orders as `suspicious`, low-stock and out-of-stock notifications.
- **Security:** helmet, CORS, express-rate-limit, express-validator, multer file-type/size limits, JWT access + refresh in httpOnly cookies.

---

## Useful scripts

| Command                 | Action                                      |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Run API + Vite dev server together          |
| `npm run build`         | Build the frontend                          |
| `npm run start`         | Serve API + built frontend (production)     |
| `npm run setup`         | Initialize DB schema + seed data            |
| `npm run init:db`       | Create/update schema only                   |
| `npm run seed`          | Seed data only (skips if data already exists)|
```

---

## Notes

- `server/uploads/*` holds admin-uploaded product images (git-ignored except `.gitkeep`).
- The web app falls back to `/images/placeholder.svg` if a product image fails to load.
- Set `PORT` / `DATABASE_URL` / JWT secrets via a `.env` file in `server/` (see `server/src/config.js`).
