# E-Commerce Platform (MERN + Razorpay)

Full-stack e-commerce app: auth, product catalog with search/filtering, cart, wishlist, checkout with Razorpay, product reviews, coupons, order tracking, email notifications, and an admin dashboard (products, orders, users, sales analytics).

## Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Razorpay, Nodemailer
- **Frontend:** React (Vite), Redux Toolkit, React Router, Tailwind CSS, Axios

---

## 1. Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) — a plain standalone instance is fine, no replica set needed
- A Razorpay account (free) for test API keys: https://dashboard.razorpay.com/app/keys
- An email account for Nodemailer — Gmail with an **App Password** (not your regular password) is easiest: https://myaccount.google.com/apppasswords

---

## 2. Backend setup

```bash
cd server
npm install
```

Edit `server/.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=<generate with: openssl rand -hex 32>
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM="MyShop <your_email@gmail.com>"
ADMIN_EMAIL=admin@myshop.com
ADMIN_PASSWORD=admin123456
```

Make sure MongoDB is running, then seed an admin account + sample products:
```bash
npm run seed
```

Start the server:
```bash
npm run dev
```
Should print `Server running on http://localhost:5000` and `MongoDB connected: ...`.

---

## 3. Frontend setup

In a **new terminal**:
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173**.

---

## 4. Try it out

- Log in as admin: the email/password from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (defaults: `admin@myshop.com` / `admin123456`)
- Or register a new customer account at `/register`
- Browse `/products`, add to cart, go to `/checkout`
- At checkout, Razorpay's **test mode** widget opens — use Razorpay's published test card numbers (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV) to simulate a real payment without moving real money
- After payment, you'll land on the order confirmation page, and (if email is configured) receive a confirmation email
- Visit `/admin` (only visible/accessible to admin accounts) for the sales dashboard, product/order/user/coupon management

---

## 5. Project structure

```
ecommerce-app/
├── server/
│   └── src/
│       ├── models/         User, Product, Cart, Order, Coupon
│       ├── routes/         auth, users, products, cart, wishlist, coupons, orders
│       ├── routes/admin/   products, orders, users, coupons, dashboard
│       ├── middleware/     auth.js (JWT verify + admin check)
│       ├── utils/          jwt, email (Nodemailer), razorpay, seed.js
│       └── index.js
└── client/
    └── src/
        ├── app/store.js              Redux store
        ├── features/                 one slice per domain (auth, products, cart, wishlist, orders, admin, ui)
        ├── components/                Navbar, ProductCard, StarRating, route guards
        ├── pages/                     all user-facing pages
        ├── pages/admin/               all admin pages
        └── utils/                     api.js (axios + JWT interceptor), format.js
```

---

## 6. How the key flows work

**Auth (JWT):** `/register` and `/login` return a token, stored in `localStorage` and attached to every request via an Axios interceptor. `requireAuth` middleware verifies it server-side; `requireAdmin` additionally checks `role === "admin"`.

**Search & filtering:** MongoDB text index on `name/description/brand/category` powers `?search=`. Combinable with `category`, `brand`, `minPrice`/`maxPrice`, `rating`, and `sort`.

**Cart → Checkout → Payment:**
1. Cart is stored server-side per user (not just client state), so it survives across devices/sessions.
2. At checkout, the server **recomputes prices server-side from the live product data** — it never trusts client-sent totals. This prevents price tampering.
3. A Razorpay order is created and its widget opens client-side.
4. On payment success, the server **verifies the payment signature** (HMAC-SHA256) before marking the order paid — this is the step that actually proves the payment is genuine, not just "the browser said so."
5. Stock is deducted per-item with an atomic `$gte` guard to prevent overselling under concurrent checkouts.

**Reviews:** One review per user per product, recalculates the product's average rating on each new review.

**Coupons:** Percentage or flat discount, with optional min order amount, max discount cap, expiry, and usage limit — validated both at "apply coupon" time and again at order placement (in case something changed in between).

**Admin dashboard:** Uses MongoDB aggregation pipelines for revenue totals, order-status breakdown, daily revenue trend, and top-selling products by revenue.

---

## 7. Known limitations / what to harden before production

- **MongoDB transactions:** stock deduction during payment verification uses sequential atomic per-item updates rather than a multi-document transaction, because transactions require MongoDB to run as a **replica set**, and a default local `mongod` doesn't. If a payment succeeds but a stock race occurs (extremely rare — same item bought simultaneously by two people checking out at the exact same moment), the order is still marked paid (correct — money moved) and flagged in `statusHistory` for manual admin review, rather than silently failing on the customer. If you move to MongoDB Atlas (always a replica set) you can upgrade this to real transactions for stronger atomicity.
- **Image uploads:** products take image **URLs** (e.g. paste an Unsplash link), not file uploads. Wiring up actual file upload (e.g. via `multer` + local disk or S3) is a natural next step — `multer` is already in `package.json` for this.
- **JWT_SECRET / Razorpay keys / email credentials** in `.env` are placeholders — replace before deploying anywhere public.
- **Razorpay webhooks:** payment verification currently happens via the client-side `handler` callback + signature check, which is standard for Razorpay's Checkout.js flow. For extra robustness in production, also set up a Razorpay webhook endpoint as a backup in case the browser closes before the callback fires.
- **Rate limiting** is only applied to `/api/auth/*`. Consider extending to other write-heavy endpoints if this goes live publicly.

---

## 8. Verification notes

This was built and reviewed in a sandboxed environment without internet access, so I was able to:
- Syntax-check every backend `.js` file with Node's parser
- Verify every relative import across all 32 frontend files resolves to a real file
- Verify every named/default import matches an actual export in its target file (including Redux Toolkit's `export const { x, y } = slice.actions` pattern)

I was **not** able to:
- Run `npm install` (no network access in this sandbox)
- Actually boot the app or click through it in a browser

Please run it locally and report back anything that breaks — happy to debug.
