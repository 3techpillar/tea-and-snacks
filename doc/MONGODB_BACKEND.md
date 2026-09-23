# MongoDB Backend — Implementation Notes

## 1. Status

This is the **implemented** backend for Easy Food, replacing the `localStorage`
demo described in [`BACKEND_REQUIREMENTS.md`](./BACKEND_REQUIREMENTS.md). That
document specified a Postgres/Supabase stack; this build uses **MongoDB**
instead, per a deliberate stack choice (see §2). Treat this file as the
source of truth for what's actually running; `BACKEND_REQUIREMENTS.md` stays
as historical context for the schema/API shape this was modeled on.

Orders, users/auth, and vendor actions are fully backed by MongoDB. The
product catalog (vendors/products/offers) is seeded into MongoDB and served
through the same server-function layer, so the frontend no longer imports
static data arrays for any of it.

## 2. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Server logic | TanStack Start `createServerFn` | Already the app's framework; no separate process to run in dev. |
| Database | MongoDB (Mongoose) | Explicit requirement for this build. |
| Auth | JWT in an httpOnly cookie | "Full auth" was chosen over a no-login demo; a signed JWT is issued at login/register and stored httpOnly (not `localStorage`) so it can't be read by page JS. |
| Real-time | Socket.io, attached to the Vite dev server | Push order updates to vendor dashboards and the customer tracking page. Dev-only — see §8. |
| Password hashing | bcryptjs | |
| Validation | Zod | Already a project dependency; used for every server-fn input. |

These three decisions (server-fn-only, full JWT auth, Socket.io push) were
asked and answered explicitly before implementation — they're not the only
valid choices, just the ones this build follows.

## 3. Directory layout

```text
src/backend/            # server-only code — imported ONLY from src/lib/api/*
  env.ts                # reads MONGODB_URI / JWT_SECRET / JWT_EXPIRES_IN
  db.ts                 # cached Mongoose connection (survives Vite HMR)
  orderMapper.ts         # Mongoose OrderDoc -> wire-format DemoOrder
  models/
    User.ts             # { name, email, passwordHash, role, vendorId? }
    Vendor.ts            # _id is the slug ("tea-point"), matches existing frontend ids
    Product.ts           # _id is the slug ("p1"), vendorId references Vendor._id
    Offer.ts
    Order.ts             # embeds items[] + payment fields; ALLOWED_TRANSITIONS state machine
    Counter.ts           # atomic order-number sequence (see §5)
  auth/
    password.ts          # bcrypt hash/compare
    jwt.ts                # sign/verify
    cookie.ts             # httpOnly cookie get/set (AUTH_COOKIE = "easy_food_token")
    middleware.ts         # authMiddleware + requireUser/requireVendor/requireVendorAccess
  realtime.ts             # Socket.io singleton + emitOrderUpdated()
  seed-data.ts            # canonical vendors/products/offers + demo vendor accounts
  seed.ts                 # `bun run seed` entry point

src/lib/api/             # createServerFn boundary — imported from CLIENT code
  auth.ts                # registerFn, loginFn, logoutFn, meFn
  catalog.ts              # getCatalogFn
  orders.ts               # placeOrderFn, getOrdersFn, getOrderFn, uploadPaymentProofFn
  vendor.ts               # getVendorOrdersFn, getVendorStatsFn, updateOrderStatusFn,
                          # confirmPaymentFn, rejectPaymentFn, addVendorNoteFn

src/lib/
  auth-client.tsx         # AuthProvider/useAuth (React Query wrapper over lib/api/auth)
  catalog-client.tsx      # useCatalog() (React Query wrapper over lib/api/catalog)
  realtime-client.ts       # useOrderRoomUpdates() Socket.io client hook
  orders.ts                # shared wire types (DemoOrder, OrderStatus) + vendorSlice()

vite-plugins/socketio.ts  # attaches Socket.io to Vite's dev http server
```

**Why `src/lib/api/` and not `src/lib/server/`:** TanStack Start's Vite
plugin (via `@lovable.dev/vite-tanstack-config`) hard-codes an import-protection
rule that denies **any** client-reachable import whose resolved path contains
a `server` directory segment — `**/server/**` — regardless of whether the
file is a legitimate `createServerFn` RPC boundary. The raw, truly
server-only code therefore lives under `src/backend/` (not `src/server/`),
and the RPC boundary files that *are* meant to be imported by client
components live under `src/lib/api/`. Neither path matches the denylist.

## 4. Data model

Mongo is document-oriented, so this intentionally **denormalizes** relative
to the original Postgres design: an order embeds its `items[]` and payment
fields directly (no separate `order_items`/`payments` tables), and there's no
`vendor_staff` join table — a vendor's `User` document just carries a single
`vendorId`.

```text
User            { name, email, passwordHash, role: customer|vendor|admin, vendorId? }
Vendor          { _id: slug, name, cuisine, emoji, rating, eta, accent, tagline,
                  counter, hours, specialty, upiId, highlights[], isActive }
Product         { _id: slug, vendorId, name, price, emoji, veg, tag?, isActive }
Offer           { _id: slug, title, detail, code, accent, vendorId?, isActive }
Order           { displayId, token, userId, customerName, customerPhone, status,
                  items: [{ productId, vendorId, name, emoji, qty, price }],
                  total, paymentConfirmed, paymentRejected, paymentProofName?,
                  paymentProofUrl?, vendorNote?, placedAt }
Counter         { _id: "orderSequence", seq }   -- see §5
```

`Vendor`/`Product`/`Offer` use their existing slug (`"tea-point"`, `"p1"`) as
the Mongo `_id` instead of an `ObjectId`, so every existing frontend route
param, cart line, and order item continues to reference the same ids with no
renaming.

## 5. Order numbering (fixes a real bug from the localStorage demo)

The old demo derived the next order id from `orders.length` read from
`localStorage`, then wrote the whole array back — two tabs checking out at
once could read the same length and clobber each other's order.

`nextOrderNumber()` (`src/backend/models/Counter.ts`) uses a single atomic
`findByIdAndUpdate(..., { $inc: { seq: 1 } })` call, which MongoDB guarantees
is race-free even under concurrent checkouts. One nuance worth calling out
explicitly because it's easy to get wrong: **a Mongoose schema `default` does
not apply here**. `setDefaultsOnInsert` only backfills fields the update
doesn't touch, and `$inc` touches `seq` directly, so a brand-new counter
document starts at `1` regardless of any `default: 1000` on the schema. The
fix used here is to keep the counter itself default-free and add the
`+1000` offset in `nextOrderNumber()` instead of relying on the schema.

## 6. Auth

- `registerFn` / `loginFn` issue a JWT (`{ sub, role, vendorId }`, `jsonwebtoken`,
  `JWT_EXPIRES_IN` from env) and set it as an httpOnly, `sameSite: lax` cookie
  (`easy_food_token`). `logoutFn` clears it.
- `authMiddleware` (a `createMiddleware({ type: "function" }).server(...)`)
  reads that cookie, verifies the JWT, loads the `User`, and attaches
  `context.user` to any server fn that includes it.
- `requireUser` / `requireVendor` / `requireVendorAccess(user, vendorId)` are
  plain helper functions (not more middleware) called at the top of each
  handler that needs authorization. `requireVendorAccess` is the one that
  matters most: it only allows the vendor who owns `vendorId` (or an admin)
  through to that stall's dashboard actions.
- There's no self-serve vendor signup UI — vendor accounts are seeded (see
  §9) and log in through the same `/login` page as customers; a vendor
  account is routed straight to `/vendor/$vendorId` on success. This matches
  the original doc's own model ("vendors are created by admins").

## 7. Order status transitions and cross-vendor authority

`ALLOWED_TRANSITIONS` (`src/backend/models/Order.ts`) is an explicit state
machine — `Pending → Accepted → Preparing → Ready → Completed`, with
`Cancelled` reachable from any non-terminal state and nothing reachable from
`Completed`/`Cancelled`. `updateOrderStatusFn` rejects any other jump with a
clear error message, and additionally refuses to mark an order `Completed`
until `paymentConfirmed` is true. The old localStorage demo had no such
guard — any status button could fire from any state.

Every vendor-facing mutation (`updateOrderStatusFn`, `confirmPaymentFn`,
`rejectPaymentFn`, `addVendorNoteFn`) also re-verifies server-side that the
order actually contains an item for that vendor
(`loadOrderForVendor` in `src/lib/api/vendor.ts`), not just that the caller
is *a* vendor — this closes the hole where the old client-only app had no
way to stop a crafted request from acting on an unrelated order.

**Known, intentionally out-of-scope limitation carried over from the
original doc's own "Open Questions" section:** a single order can still span
multiple vendors (one checkout, one cart, items from different stalls), and
`status`/`paymentConfirmed` remain per-order, not per-vendor. So a vendor who
has *any* item in a mixed order can still move the whole order's status or
confirm/reject the whole payment — it's just no longer possible for a vendor
to touch an order they have *zero* items in. Splitting a mixed cart into one
order per vendor would fix this properly but is a real data-model change,
not a bug fix, and was flagged as an open question rather than decided here.

## 8. Real-time updates

`vite-plugins/socketio.ts` attaches a Socket.io server to Vite's dev HTTP
server via the `configureServer` hook, and stores it in a `globalThis`
singleton (`src/backend/realtime.ts`) that server functions call into after
a mutation:

- `order:<displayId>` room — the customer's tracking page.
- `vendor:<vendorId>` room — that stall's dashboard.

`emitOrderUpdated()` pushes to both after any order create/update.
`useOrderRoomUpdates()` (`src/lib/realtime-client.ts`) joins the right room
and invalidates the relevant React Query cache on `order:updated`.

**Known limitation:** `configureServer` is a dev-server-only Vite hook — it
never runs for `vite build`/`vite preview`, and this project's production
build target defaults to Cloudflare Workers (see `vite.config.ts`'s
comment and `nitro`'s `cloudflare-module` preset), which doesn't support a
long-lived `socket.io` server or a raw TCP MongoDB driver at all. Every route
that depends on real-time also has a plain polling fallback
(`refetchInterval: 15_000` in the relevant `useQuery` calls), so the app
degrades to "chunky polling" rather than breaking if deployed somewhere
Socket.io can't attach. Shipping this to a real production target would mean
either: running a persistent Node server (Nitro's `node-server` preset) with
the same `configureServer`-style wiring, or replacing Socket.io with a
platform-native realtime primitive (Cloudflare Durable Objects, Ably,
Pusher, etc.) and swapping the Mongo driver for something that works over
HTTP (MongoDB Atlas Data API) if the target truly is edge/Workers.

## 9. Setup

```bash
cp .env.example .env      # fill in MONGODB_URI / JWT_SECRET for anything beyond local dev
bun install
bun run seed               # seeds vendors/products/offers + one vendor login per stall
bun run dev
```

`bun run seed` is idempotent (upserts by slug) and prints the seeded vendor
logins, e.g. `tea-point@vendors.easyfood.demo` / `vendor123`. Sign up as a
normal customer through `/register`; there's no seeded customer account.

## 10. What a customer/vendor session actually stores where

- **Cart** stays in `localStorage` (`easy-food-cart`) exactly as before —
  browsing and adding to cart is still anonymous/guest-friendly. This was a
  deliberate scope decision: the original doc's design ties the cart to a
  logged-in user from the start, but that would force a login before a
  customer can even look at their cart, which is a bigger UX change than
  "create the backend" asked for. Login is only required at checkout
  (`placeOrderFn` requires `context.user`), which is also when the order
  actually needs to be tied to an account for cross-device tracking.
- **Orders, users, catalog** live in MongoDB, fetched via the server
  functions above.
- **Auth session** is the httpOnly JWT cookie — never `localStorage`.

## 11. Known rough edges

- **SSR/React Query hydration**: the root route's loader prefetches the
  catalog query server-side, but that server-side `QueryClient` instance is
  never dehydrated into the HTML for the browser's `QueryClient` to pick up.
  In practice this means a hard page load briefly renders with an empty
  catalog/auth state before the client's own fetch resolves — you'll see a
  React hydration-mismatch warning in the console on a fresh load, and
  every catalog-dependent component defensively handles that brief empty
  window rather than crashing (this was fixed during testing — see
  `VendorMenu`'s loading guard). Doing this properly means wiring
  `@tanstack/react-query`'s `dehydrate`/`HydrationBoundary` (or
  `@tanstack/react-router-ssr-query`) through the router — a real but
  separate piece of work from standing up the backend itself.
- **Payment screenshots** are stored as base64 data URLs directly on the
  `Order` document (same representation the old demo used in
  `localStorage`), capped at 5MB in `uploadPaymentProofFn`. This works fine
  at demo scale but bloats the `orders` collection; moving to GridFS or S3
  (as `BACKEND_REQUIREMENTS.md` recommended) is the natural next step before
  any real traffic.
- **No admin panel / catalog CRUD API** — `Vendor`/`Product`/`Offer` are
  seeded and read-only from the API's perspective. Writing them requires a
  script (`bun run seed`) or direct DB access, matching the original doc's
  own "admin panel" item being explicitly future work.

## 12. Security checklist (adapted from BACKEND_REQUIREMENTS.md §13)

- [x] Passwords hashed with bcrypt, never stored/logged in plaintext.
- [x] Auth token is httpOnly + `sameSite: lax` — not readable by page JS, not sent cross-site.
- [x] Every write-capable server fn re-validates its input with Zod.
- [x] Order prices/names/vendorIds are looked up server-side from the DB at checkout, never trusted from the client request body.
- [x] Order status transitions validated server-side via `ALLOWED_TRANSITIONS`; `Completed` additionally requires `paymentConfirmed`.
- [x] A vendor can only act on orders that actually contain one of their items (`loadOrderForVendor`), and only on their own stall (`requireVendorAccess`).
- [x] A customer can only read their own orders (`getOrderFn`/`getOrdersFn` check `order.userId`).
- [ ] Payment proof storage is not access-controlled beyond "you must be signed in as the order's owner or a vendor on it" — there's no private-bucket/signed-URL layer since it's stored inline on the order document (see §11).
- [ ] Rate limiting / brute-force protection on `/login` — not implemented; fine for a demo, not for production.
