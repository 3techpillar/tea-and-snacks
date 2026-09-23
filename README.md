# Easy Food — Food Court Ordering App

A mobile-first, demo food-court ordering experience built with **TanStack Start**, **React 19**, **TypeScript** and **Tailwind CSS v4**. Customers can browse vendors, add items to a cart, place orders, and upload a UPI payment screenshot. Vendors can pick their stall and manage live orders, verify payments and move tokens through the kitchen workflow.

> **Status:** Backed by MongoDB (users, orders, catalog) with JWT auth and Socket.io real-time updates — see [Backend](#backend) below. Only the cart still lives in `localStorage`.

---

## Live Demo

- **Preview:** https://id-preview--e4414a69-4cc3-40af-b5b2-ee370f1d4254.lovable.app
- **Published:** https://snack-serve-dash.lovable.app

These hosted links serve the earlier frontend-only build described in
[`doc/BACKEND_REQUIREMENTS.md`](doc/BACKEND_REQUIREMENTS.md); the MongoDB backend
in this repo hasn't been deployed there yet — run it locally per [Quick Start](#quick-start).

---

## Features

### Customer flow

- **Home** — hero search, craving chips, live offers, top vendor cards.
- **Search** — type-ahead suggestions with keyword matching (tea, snacks, veg, etc.).
- **Vendor Menu** — product grid with tags, cart drawer and sticky cart bar.
- **Cart** — review items, adjust quantities, remove products.
- **Checkout** — customer name + phone, UPI QR payment screenshot upload.
- **Order Tracking** — live token status, payment confirmation, vendor notes.

### Vendor flow

- **Vendor Picker** (`/vendor`) — choose a stall, see live order counts.
- **Dashboard** (`/vendor/$vendorId`) —
  - Live stats (live orders, pending, unverified payments, collected earnings).
  - Filterable queue: Live / Pending / Preparing / Ready / All.
  - View / confirm / reject UPI payment screenshots.
  - Move tokens through the workflow: Pending → Accepted → Preparing → Ready → Completed.
  - Cancel orders and add customer-facing vendor notes.

---

## Tech Stack

| Layer        | Choice                                          |
| ------------ | ----------------------------------------------- |
| Framework    | TanStack Start v1 (full-stack React 19)         |
| Router       | TanStack Router (file-based routing)            |
| Styling      | Tailwind CSS v4 with custom OKLCH design tokens |
| Display font | Fredoka (Google Fonts)                          |
| Body font    | DM Sans (Google Fonts)                          |
| Database     | MongoDB (Mongoose)                              |
| Auth         | JWT in an httpOnly cookie                       |
| Real-time    | Socket.io (vendor dashboards, order tracking)   |
| State        | React Query + React Context; cart in `localStorage` |
| Build tool   | Vite 7                                          |

---

## Project Structure

```text
src/
├── backend/             # Server-only: DB connection, Mongoose models, auth, realtime, seed data
│   ├── models/          # User, Vendor, Product, Offer, Order, Counter
│   ├── auth/            # password hashing, JWT, cookie, authMiddleware
│   └── realtime.ts      # Socket.io singleton + emitOrderUpdated()
├── components/          # Shared UI components (Header, BottomNav, ProductCard, etc.)
├── hooks/               # Custom hooks (use-mobile)
├── lib/
│   ├── api/             # createServerFn RPC boundary (auth, catalog, orders, vendor)
│   ├── auth-client.tsx  # AuthProvider/useAuth
│   ├── catalog-client.tsx # useCatalog() — vendors/products/offers from MongoDB
│   ├── cart.tsx         # React Context cart + localStorage (still client-side)
│   ├── data.ts          # Vendor/Product/Offer types + accent color maps
│   ├── orders.ts        # Shared order types, status constants, vendorSlice()
│   ├── realtime-client.ts # Socket.io client hook
│   ├── search.ts        # Search logic + keyword maps
│   └── images.ts        # Photography asset map
├── routes/              # TanStack Router file routes
│   ├── __root.tsx       # Root layout (Header + BottomNav + Outlet); prefetches the catalog
│   ├── index.tsx        # Home page
│   ├── login.tsx / register.tsx # Auth (customer + vendor sign-in)
│   ├── cart.tsx         # Cart page
│   ├── checkout.tsx     # Checkout + UPI payment (requires sign-in)
│   ├── search.tsx       # Search results
│   ├── vendors.index.tsx   # Vendor list
│   ├── vendors.$vendorId.tsx  # Vendor menu
│   ├── orders.index.tsx     # Order history (requires sign-in)
│   ├── orders.$orderId.tsx  # Order tracking, live via Socket.io
│   ├── vendor.index.tsx     # Vendor sign-in gate
│   ├── vendor.$vendorId.tsx # Vendor dashboard, live via Socket.io
│   └── sitemap[.]xml.ts     # Sitemap route
├── styles.css           # Global CSS + Tailwind theme tokens
└── start.ts / server.ts # TanStack Start entry points

vite-plugins/socketio.ts # Attaches Socket.io to the Vite dev server
```

---

## Quick Start

```bash
# Install dependencies
bun install

# Configure MongoDB URI / JWT secret (defaults work for a local mongod)
cp .env.example .env

# Seed vendors/products/offers + one demo vendor login per stall
bun run seed

# Run dev server
bun run dev

# Production build
bun run build

# Typecheck
bun run typecheck
```

The dev server runs on `http://localhost:8080` by default. A local MongoDB
instance must be running (`mongodb://127.0.0.1:27017` by default) — see
[`doc/MONGODB_BACKEND.md`](doc/MONGODB_BACKEND.md) for the full setup and schema.

---

## Backend

Vendors, products, offers, users and orders are persisted in **MongoDB**;
only the cart stays in the browser's `localStorage` (`easy-food-cart`) so
browsing and adding to cart stays login-free — signing in is only required
at checkout. Auth is a JWT in an httpOnly cookie, and vendor dashboards get
live order updates over Socket.io (with a polling fallback).

```bash
cp .env.example .env   # MONGODB_URI / JWT_SECRET
bun run seed            # seeds vendors/products/offers + one vendor login per stall
```

See [`doc/MONGODB_BACKEND.md`](doc/MONGODB_BACKEND.md) for the implemented schema, API surface,
auth/real-time design, setup instructions and known limitations. The earlier
[`doc/BACKEND_REQUIREMENTS.md`](doc/BACKEND_REQUIREMENTS.md) is kept for
historical context — it specified a Postgres/Supabase stack that this build
does not use.

---

## Design Notes

- **Mobile-first:** fixed bottom navigation, thumb-friendly buttons, safe-area padding.
- **Vibrant palette:** mango, chili, mint, berry, sky, grape with soft/ink variants.
- **Glassmorphism:** translucent cards and overlays on photography.
- **Accessibility:** semantic headings, focus rings, alt text on images.

---

## License

This is a demo project generated by [Lovable](https://lovable.dev). Use it as a starting point for your own food-court or quick-commerce app.
