# FLASHSHOP — AI E-Commerce Shopping Assistant Platform

A full-stack, production-ready MERN e-commerce store with an advanced **Google Gemini AI Shopping Copilot**, catalog-grounded visual product recommendations, review summarization, side-by-side spec comparison, modern adaptive UI, admin analytics panel, and verified checkout workflows.

**Stack:** React 18 + Vite + Tailwind CSS + Redux Toolkit + Framer Motion · Node.js + Express + MongoDB (Mongoose) + **Google Gemini AI (2.5 Flash)** · Local Product Assets · JWT Auth · Razorpay / Stripe / COD · Socket.io · PDF Invoices

---

## 🌟 Key Features

### 🤖 Grounded Google Gemini AI Assistant
- **Conversational Shopping Concierge**: Natural language product discovery grounded strictly in real MongoDB catalog items (no hallucinated items, prices, or specs).
- **Budget & Specification Filtering**: Enforces user constraints (e.g., *"ANC earbuds under ₹5,000"*, *"Running shoes with carbon plate"*).
- **Side-by-Side Product Comparisons**: Executive matrix evaluating prices, specs, pros/cons, and tailored purchasing verdicts.
- **AI Review Summaries**: Synthesizes verified customer reviews with sentiment scores, customer pros, and things to note.
- **Polite Handling of Unsupported Queries**: Courteously informs users when an item isn't carried and guides them to available categories.
- **Persistent Chat History**: Logged-in user sessions are saved in MongoDB (`AIChatSession`), with localStorage guest fallback.
- **Zero-Downtime Catalog Fallback**: Fully functional even if offline or before configuring a Gemini API key.

### 🛍️ Customer Storefront & Commerce
- **Storefront**: Hero slider, flash sales with countdown timer, featured/best-seller carousels, voice search, live search suggestions, multi-facet filtering (category, brand, price, color, size, rating, stock).
- **Product Details**: Multi-angle image zoom gallery, variant selector, live stock indicators, reviews with photo uploads, related items, quick view modal.
- **Real Shopping Workflows**: MongoDB-backed cart synchronization, quantity limits, coupon engine, wishlist persistence, saved delivery addresses.
- **Checkout & Orders**: Server-calculated totals (client totals are never trusted), COD, Razorpay HMAC verification, Stripe payment intents, order status timeline, PDF invoice generation.

### 👑 Multi-User RBAC & Admin Dashboard
- **Role-Based Access Control**: Pre-seeded accounts for **Admin**, **Manager**, **Seller**, and **Customer**.
- **Admin Analytics**: Live metrics (revenue, orders, active users), sales revenue charts, order processing, catalog CRUD, coupon management, and review moderation.

---

## 🌐 Production Deployment Guide (Vercel + Render + MongoDB Atlas)

FlashShop is architected for seamless cloud deployment with zero code changes required:

```mermaid
flowchart LR
    Browser["Client Browser / Mobile"] -->|"HTTPS / Static Assets"| Vercel["Frontend (Vercel)\nReact 18 + Vite\nSPA Rewrites (vercel.json)"]
    Browser -->|"API Requests (Bearer / Cookie)"| Render["Backend (Render)\nExpress Node.js API\nDynamic CORS + Health Check"]
    Render -->|"TLS Connection"| Atlas["Database (MongoDB Atlas)\nPersistent Products, Users,\nCarts, Orders & AI History"]
    Render -->|"REST / TLS"| Gemini["Google Gemini AI\ngemini-2.5-flash Engine"]
```

### 1. MongoDB Atlas Setup (Database)
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free **M0 Cluster**.
2. **Database Access**: Create a database user (e.g., `flashshop_admin`) with password authentication and `readWriteAnyDatabase` privileges.
3. **Network Access**: Add IP `0.0.0.0/0` (Allow access from anywhere). *Required for dynamic hosting IPs on Render.*
4. **Connection String**: Click **Connect** → **Drivers** (Node.js) and copy the SRV URI:
   ```env
   mongodb+srv://flashshop_admin:<PASSWORD>@cluster0.xxxxx.mongodb.net/flashshop?retryWrites=true&w=majority
   ```
5. *(Optional)* Seed demo data into your remote Atlas cluster from your local terminal:
   ```bash
   # Temporarily set MONGODB_URI in backend/.env, then run:
   npm run seed --prefix backend
   ```

---

### 2. Backend Deployment on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository (`Gulshankartikk/e-commerce-website`).
3. Set the following build and run parameters:

| Setting | Value |
|---|---|
| **Name** | `flashshop-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Health Check Path** | `/api/health` |

4. Add **Environment Variables** under Environment:

| Environment Variable | Recommended Value | Note |
|---|---|---|
| `NODE_ENV` | `production` | Enables production security & cookies |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | *(64-char random string)* | Secret for signing auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `CLIENT_URL` | `https://<your-vercel-app>.vercel.app` | Allowed CORS frontend origin |
| `GEMINI_API_KEY` | *(Your Gemini API Key)* | Obtained from [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model identifier |

5. Click **Create Web Service**. Once active, verify: `https://<your-render-url>/api/health`.

---

### 3. Frontend Deployment on Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Import your GitHub repository (`Gulshankartikk/e-commerce-website`).
3. Configure the project:

| Setting | Value |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `vite build` |
| **Output Directory** | `dist` |

4. Add **Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-render-url>.onrender.com/api/v1` |

5. Click **Deploy**. Vercel will build and serve your static React SPA with auto-configured client-side route rewrites.
6. Copy your frontend URL (e.g., `https://flashshop.vercel.app`) and ensure it is set as `CLIENT_URL` in your Render backend settings.

---

### 4. Post-Deployment Verification Checklist

- [ ] **Health Endpoint**: `https://<render-url>/api/health` responds with `{ "success": true, "status": "ok" }`.
- [ ] **Storefront Catalog**: `https://<vercel-url>/` displays all categories, banners, and sample products.
- [ ] **Authentication**: Log in with demo credentials `demo@flashshop.com` / `Demo@12345`.
- [ ] **AI Shopping Assistant**: Open drawer, test natural language query (e.g. *"Show wireless earbuds under 5000"*).
- [ ] **Review Sentiment**: Open any product page and view the AI Customer Sentiment Synthesis card.
- [ ] **Compare Matrix**: Open `/compare` and test the *"✨ Ask AI for Recommendation"* feature.
- [ ] **Cart & Checkout**: Add an item to cart, apply coupon code `WELCOME10`, and place a COD order.

---

## 🚀 Local Development Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/flashshop`) or MongoDB Atlas

### 1. Configure Environment
Copy `.env.example` in `backend/`:
```bash
cp backend/.env.example backend/.env
```
Ensure `MONGO_URI` (or `MONGODB_URI`) and `JWT_SECRET` are set.
Add your Gemini API key (optional for basic fallback, required for live Gemini responses):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
> Get an API key from [Google AI Studio](https://aistudio.google.com/apikey). Keep the key in `backend/.env` only. Never expose it in client code.

### 2. Install & Seed Catalog
From the project root:
```bash
# Install root, backend, and frontend dependencies
npm run install:all

# Seed catalog (8 sample products + verified reviews + demo users + coupons)
npm run seed
```

### 3. Run Both Servers Concurrently
```bash
npm run dev
```
- **Frontend Storefront**: [http://localhost:5173](http://localhost:5173)
- **Backend API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Test Suite

Run the full end-to-end integration and security test suite:
```bash
npm run test:api
```
Tests 29 critical workflows including:
1. API Root Health Check (`/api/health` and `/api/v1/health`)
2. Multi-user authentication & role guards (`admin`, `manager`, `seller`, `user`)
3. RBAC security boundaries (403 forbidden checks)
4. Storefront catalog listing, text search, suggestions & category filters
5. Cart operations, coupon calculation (`WELCOME10`), address creation & COD checkout
6. Order status lifecycle & admin user role management
7. **AI Natural Language Shopping Chat** with grounded recommendations
8. **AI Budget Enforcement** (verifies all recommended items are $\le$ budget)
9. **AI Unsupported Product Handling**
10. **AI Review Summary with Evidence from Real Reviews**
11. **AI Side-by-Side Comparison Matrix & Verdict**
12. **AI Persistent Chat History**

---

## 👥 Demo Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **👑 Admin** | `admin@flashshop.com` *(or admin@luxora.shop)* | `Admin@12345` | Full system control, analytics, user roles, catalog, orders, coupons |
| **👔 Manager** | `manager@flashshop.com` *(or manager@luxora.shop)* | `Manager@12345` | Dashboard metrics, catalog, order processing, review moderation |
| **🏪 Seller** | `seller@flashshop.com` *(or seller@luxora.shop)* | `Seller@12345` | Product management, stock & inventory updates |
| **🛍️ Customer** | `demo@flashshop.com` *(or demo@luxora.shop)* | `Demo@12345` | Storefront browsing, AI copilot, persistent cart, wishlist, checkout |

Demo Coupon: **`WELCOME10`** (10% off orders over ₹999, max ₹500 discount).

---

## 🔌 API Endpoints Reference

### AI Shopping Assistant (`/api/v1/ai`)
- `POST /api/v1/ai/chat` — Conversational shopping concierge grounded in MongoDB inventory
- `POST /api/v1/ai/compare` — Side-by-side product comparison matrix and purchasing verdict
- `GET /api/v1/ai/review-summary/:productId` — AI-generated customer sentiment & pros/cons summary
- `GET /api/v1/ai/history` — Returns authenticated user's persistent chat sessions
- `DELETE /api/v1/ai/history` — Clears user's chat history

### Health & Commerce
- `GET /api/health` & `GET /api/v1/health` — System status and server uptime
- `GET /api/v1/products` — Filtered catalog with pagination & text search
- `POST /api/v1/cart` — MongoDB-synchronized cart item management
- `POST /api/v1/orders` — Verified order placement with server-side pricing
- `GET /api/v1/admin/dashboard` — Revenue, sales charts, and platform KPIs
