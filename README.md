# LUXORA — Full-Stack E-Commerce Platform

A production-ready MERN e-commerce store with a premium dark UI, an admin panel, and Stripe / Razorpay / Cash-on-Delivery payments.

**Stack:** React 18 + Vite + Tailwind CSS + Redux Toolkit + Framer Motion + Swiper · Node.js + Express + MongoDB (Mongoose) · JWT auth · Cloudinary · Nodemailer · Socket.io · PDFKit invoices

---

## Quick start

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit values (see below)
npm run seed                # seeds demo data + accounts
npm run dev                 # starts API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # defaults work for local dev
npm run dev                 # starts app on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend automatically.

### Demo accounts (after `npm run seed` or use 1-click login on `/login`)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **👑 Admin** | `admin@luxora.shop` | `Admin@12345` | Full system control, analytics, user roles, catalog, orders, coupons, reviews |
| **🛍️ Customer / User** | `demo@luxora.shop` | `Demo@12345` | Storefront browsing, cart, checkout, order tracking, address book, wishlist |
| **🏪 Seller / Vendor** | `seller@luxora.shop` | `Seller@12345` | Product management, stock & inventory management |
| **👔 Manager / Staff** | `manager@luxora.shop` | `Manager@12345` | Dashboard metrics, catalog, order processing & updates, review moderation |

Demo coupon: **WELCOME10** (10% off orders over ₹999, capped at ₹500).

---

## Environment variables (backend/.env)

| Variable | Purpose | Required |
|---|---|---|
| `PORT` | API port (default 5000) | no |
| `MONGO_URI` | MongoDB connection string | **yes** |
| `CLIENT_URL` | Frontend origin for CORS + email links | **yes** |
| `JWT_SECRET` | Long random string for signing tokens | **yes** |
| `CLOUDINARY_*` | Image hosting. If empty, images are stored on local disk under `backend/uploads/` and served at `/uploads` | no |
| `SMTP_*` | Nodemailer credentials. If empty, emails are logged to the console (dev mode) | no |
| `STRIPE_SECRET_KEY` | Stripe test/live secret key. Left as placeholder → Stripe hidden at checkout | no |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay keys. Left as placeholder → Razorpay hidden at checkout | no |

Cash on Delivery always works, so the store is fully usable with just `MONGO_URI` + `JWT_SECRET`.

## Frontend env (frontend/.env)

`VITE_API_URL` (default `/api/v1`), `VITE_RAZORPAY_KEY_ID` (optional; the checkout also receives the key from the server).

---

## Features

**Storefront** — hero banner slider, flash sale with live countdown, featured/best-seller/new-arrival/trending carousels, category grid, brand marquee, testimonials, newsletter. Product listing with live search + suggestions, voice search, multi-facet filters (category, brand, color, size, price, rating, stock), 5 sort orders, pagination. Product page with image gallery + hover zoom, variants (color/size with per-variant stock), reviews with photos, related products, recently viewed, share, quick view, compare (up to 3).

**Commerce** — cart with quantity limits, save-for-later, coupons, free-shipping threshold, GST calculation; checkout with address book, standard/express delivery, Stripe, Razorpay and COD; order confirmation emails; PDF invoice download; order tracking timeline; self-service cancellation with restocking.

**Accounts** — signup/login (JWT in httpOnly cookie + bearer fallback), email verification, forgot/reset password, profile, change password, notification center, wishlist.

**Admin panel** (`/admin`) — analytics dashboard (revenue, orders, users, sales area chart, status pie, top sellers, low-stock alerts), product CRUD with multi-image upload, category & brand management, order status management with customer notifications, user management (block/promote/delete), coupon CRUD, banner CRUD, review moderation.

**Security** — bcrypt password hashing, role-based route guards, rate limiting (tighter on auth endpoints), Helmet, CORS allow-list, NoSQL-injection sanitization, XSS input scrubbing, server-side price/stock/coupon validation (client totals are never trusted), Razorpay HMAC signature verification, Stripe server-side intent verification.

**Performance & UX** — route-level code splitting with vendor chunking, lazy images, loading skeletons everywhere, dark/light theme, PWA manifest, SEO meta tags, responsive from mobile to desktop, reduced-motion support.

---

## Project structure

```
backend/
  server.js               # Express app + Socket.io + security middleware
  seed/seed.js            # demo data seeder
  src/
    config/               # db, cloudinary
    models/               # User, Product, Category, Brand, Cart, Wishlist,
                          # Order (+OrderItem), Review, Coupon, Banner, Notification
    middleware/           # auth, upload, validation, error handler
    controllers/          # one per resource
    routes/               # one per resource, mounted at /api/v1/*
    utils/                # ApiFeatures, JWT, email, PDF invoice
frontend/
  src/
    api/                  # axios instance with interceptors
    app/store.js          # Redux store
    features/             # auth / cart / wishlist / ui slices
    hooks/                # useFetch, useDebounce
    components/           # layout, ui, product, home
    pages/                # storefront, auth, user dashboard, admin panel
    utils/format.js       # INR formatting, status colors
```

## API overview

Base URL: `/api/v1`

- `POST /auth/register|login|logout`, `GET /auth/me`, `GET /auth/verify-email/:token`, `POST /auth/forgot-password`, `POST /auth/reset-password/:token`, `PUT /auth/change-password|profile`
- `GET /products` (keyword, category, brand, color, size, rating, minPrice, maxPrice, inStock, flashSale, featured, sort, page), `GET /products/suggestions`, `GET /products/home`, `GET /products/:slug` · admin: `POST/PUT/DELETE /products`, `PUT /products/:id/stock`
- `GET|POST /categories`, `GET|POST /brands` (+ PUT/DELETE, admin)
- `GET|POST|PUT|DELETE /cart`, `POST|DELETE /cart/coupon`, `PUT /cart/:itemId/save-for-later`
- `GET /wishlist`, `POST /wishlist/:productId` (toggle)
- `POST /orders` (COD), `GET /orders/my`, `GET /orders/:id`, `GET /orders/:id/invoice` (PDF), `PUT /orders/:id/cancel` · admin: `GET /orders`, `PUT /orders/:id/status`
- `GET /payments/config`, `POST /payments/stripe/create-intent|confirm`, `POST /payments/razorpay/create-order|verify`
- `GET|POST|PUT|DELETE /reviews`, `PUT /reviews/:id/approve` (admin)
- `GET|POST|PUT|DELETE /coupons` (admin), `/banners`, `/addresses`, `/notifications`
- `GET /admin/dashboard`, `GET /admin/users`, `PUT /admin/users/:id/block|role`, `DELETE /admin/users/:id`

## Deployment notes

- **Backend**: deploy to Render/Railway/Fly/EC2. Set `NODE_ENV=production` and all env vars; cookies switch to `secure; SameSite=None` automatically. Point `CLIENT_URL` at your deployed frontend origin.
- **Frontend**: `npm run build` → deploy `dist/` to Vercel/Netlify/S3. Set `VITE_API_URL` to your API origin (e.g. `https://api.example.com/api/v1`).
- **Images**: add Cloudinary credentials in production (local-disk fallback is for development).
- **Stripe**: the included flow verifies the PaymentIntent server-side. For live card entry, mount Stripe Elements with the returned `clientSecret` in `Checkout.jsx` (marked with a comment).
# e-commerce-website
