# Backend Requirements Specification

> **Superseded.** This document proposed a Postgres/Supabase (Lovable Cloud)
> stack. The backend that was actually built uses **MongoDB** instead — see
> [`MONGODB_BACKEND.md`](./MONGODB_BACKEND.md) for the implemented schema,
> API surface, and setup instructions. This file is kept for historical
> context (the entity model and API shape here are what the Mongo version
> was modeled on) but the specific SQL/Supabase details below are no longer
> current.

## 1. Overview

This document defines the backend requirements for migrating the current **Easy Food** demo from browser `localStorage` to a real production backend. The frontend is already complete; the backend should preserve the same UX while adding persistence, multi-device support, real-time updates, and secure role-based access.

## 2. Goals

- Persist vendors, products, offers, users, carts, orders and payments.
- Allow customers to browse, search, order and track from any device.
- Allow vendors to manage their stall's orders and verify payments on any device.
- Support real-time order updates for vendor dashboards without polling.
- Store payment proof screenshots securely.
- Provide authentication with role-based access (customer, vendor, admin).
- Lay groundwork for an admin panel that can manage vendors, menus and offers.

## 3. Recommended Stack

| Layer               | Recommendation                                   | Notes                                                                     |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Backend platform    | **Lovable Cloud** (Supabase under the hood)      | Provides DB, auth, storage and server functions with zero external setup. |
| Database            | PostgreSQL                                       | Fits relational order/item/vendor data.                                   |
| ORM / query builder | Supabase Data API (PostgREST) + `createServerFn` | Use generated Supabase clients; no need for Prisma in this stack.         |
| Auth                | Supabase Auth                                    | Email/OTP, Google, Apple, anonymous.                                      |
| Real-time           | Supabase Realtime                                | Listen to order changes per vendor.                                       |
| Storage             | Supabase Storage                                 | Payment proof screenshots.                                                |
| Server logic        | `createServerFn` from TanStack Start             | Edge-compatible server functions.                                         |
| Payments            | UPI deep links + optional Razorpay/Stripe        | UPI is the primary demo flow; add gateway later.                          |

## 4. Entity Relationship Diagram

```text
users (Supabase Auth)
  │
  ├── profile (user_profiles) — name, phone, role_id
  │
  ├── role (user_roles) — customer | vendor | admin
  │
  ├── cart (carts) — one active cart per user
  │     └── cart_items
  │
  └── order (orders) — placed by customer
        ├── order_items
        ├── payment (payments) — proof, status, amount
        └── order_status_logs (audit trail)

vendors
  ├── vendor_staff (links users to vendors with role)
  ├── products
  └── offers
```

## 5. Database Schema

### 5.1 Users & Roles

```sql
-- Roles must be a separate table per project security rules.
create type public.app_role as enum ('customer', 'vendor', 'admin');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- Security definer helper to check roles.
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Public profiles.
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text,
    phone text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Users can manage their own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

### 5.2 Vendors

```sql
create table public.vendors (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    name text not null,
    cuisine text,
    emoji text,
    rating numeric(3,2) default 0,
    eta text,
    accent text check (accent in ('mango','chili','mint','berry','sky','grape')),
    image_url text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

grant select on public.vendors to anon, authenticated;
grant all on public.vendors to service_role;
alter table public.vendors enable row level security;

create policy "Vendors are publicly readable"
  on public.vendors
  for select
  to anon, authenticated
  using (is_active = true);
```

### 5.3 Products

```sql
create table public.products (
    id uuid primary key default gen_random_uuid(),
    vendor_id uuid references public.vendors(id) on delete cascade not null,
    name text not null,
    price numeric(10,2) not null,
    emoji text,
    veg boolean default true,
    tag text,
    image_url text,
    is_active boolean default true,
    created_at timestamptz default now()
);

grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "Active products are publicly readable"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);
```

### 5.4 Offers

```sql
create table public.offers (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    detail text,
    code text,
    accent text,
    vendor_id uuid references public.vendors(id) on delete set null,
    is_active boolean default true,
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz default now()
);

grant select on public.offers to anon, authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
```

### 5.5 Carts

```sql
create table public.carts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (user_id)
);

grant select, insert, update, delete on public.carts to authenticated;
grant all on public.carts to service_role;
alter table public.carts enable row level security;

create policy "Users own their cart"
  on public.carts
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table public.cart_items (
    id uuid primary key default gen_random_uuid(),
    cart_id uuid references public.carts(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete cascade not null,
    qty integer not null check (qty > 0),
    created_at timestamptz default now(),
    unique (cart_id, product_id)
);

grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;

create policy "Cart items belong to user's cart"
  on public.cart_items
  for all
  to authenticated
  using (
    cart_id in (select id from public.carts where user_id = auth.uid())
  )
  with check (
    cart_id in (select id from public.carts where user_id = auth.uid())
  );
```

### 5.6 Orders

```sql
create type public.order_status as enum (
  'Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'
);

create table public.orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    display_id text unique not null,        -- e.g. 1001, 1002
    token text not null,                    -- e.g. A21, A22
    customer_name text not null,
    customer_phone text not null,
    status order_status default 'Pending',
    total numeric(10,2) not null,
    vendor_note text,
    payment_confirmed boolean default false,
    payment_rejected boolean default false,
    placed_at timestamptz default now(),
    updated_at timestamptz default now()
);

grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create policy "Customers see their own orders"
  on public.orders
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Vendors see orders containing their products"
  on public.orders
  for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'vendor')
    and exists (
      select 1 from public.order_items
      where order_id = orders.id
        and vendor_id in (
          select vendor_id from public.vendor_staff where user_id = auth.uid()
        )
    )
  );

create policy "Admins see all orders"
  on public.orders
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));
```

### 5.7 Order Items

```sql
create table public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete set null,
    vendor_id uuid references public.vendors(id) on delete set null,
    name text not null,
    emoji text,
    qty integer not null,
    price numeric(10,2) not null
);

grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
```

### 5.8 Payments

```sql
create type public.payment_status as enum ('Pending', 'Confirmed', 'Rejected');

create table public.payments (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders(id) on delete cascade not null,
    status payment_status default 'Pending',
    amount numeric(10,2) not null,
    proof_url text,
    proof_name text,
    verified_by uuid references auth.users(id) on delete set null,
    verified_at timestamptz,
    created_at timestamptz default now()
);

grant select, insert on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
```

### 5.9 Vendor Staff

```sql
create table public.vendor_staff (
    id uuid primary key default gen_random_uuid(),
    vendor_id uuid references public.vendors(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique (vendor_id, user_id)
);

grant select, insert, delete on public.vendor_staff to authenticated;
grant all on public.vendor_staff to service_role;
alter table public.vendor_staff enable row level security;

create policy "Admins manage vendor staff"
  on public.vendor_staff
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));
```

### 5.10 Order Status Logs

```sql
create table public.order_status_logs (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders(id) on delete cascade not null,
    status order_status not null,
    changed_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now()
);

grant select on public.order_status_logs to authenticated;
grant all on public.order_status_logs to service_role;
alter table public.order_status_logs enable row level security;
```

## 6. API / Server Functions

All functions should be implemented with `createServerFn` from `@tanstack/react-start`. Public reads can use the Supabase Data API directly; writes and privileged reads should go through server functions.

### 6.1 Customer-facing

| Function                            | Purpose                                              | Auth     |
| ----------------------------------- | ---------------------------------------------------- | -------- |
| `listVendors()`                     | Return active vendors with offers.                   | Public   |
| `listProducts(vendorId)`            | Return active products for a vendor.                 | Public   |
| `search(query)`                     | Full-text search across vendors/products.            | Public   |
| `getCart()`                         | Return current user's cart with products.            | Required |
| `addToCart(productId, qty)`         | Upsert cart item.                                    | Required |
| `removeFromCart(productId)`         | Remove cart item.                                    | Required |
| `clearCart()`                       | Empty cart.                                          | Required |
| `placeOrder(input)`                 | Create order + items + payment row; clear cart.      | Required |
| `getOrders()`                       | List user's order history.                           | Required |
| `getOrder(orderId)`                 | Single order details + status + payment.             | Required |
| `uploadPaymentProof(orderId, file)` | Store image in Supabase Storage, update payment row. | Required |

### 6.2 Vendor-facing

| Function                             | Purpose                                      | Auth                   |
| ------------------------------------ | -------------------------------------------- | ---------------------- |
| `getVendorOrders(vendorId)`          | Orders containing products from this vendor. | Required + vendor role |
| `updateOrderStatus(orderId, status)` | Update order status, log change.             | Required + vendor role |
| `confirmPayment(orderId)`            | Mark payment confirmed.                      | Required + vendor role |
| `rejectPayment(orderId)`             | Mark payment rejected.                       | Required + vendor role |
| `addVendorNote(orderId, note)`       | Update vendor-facing note.                   | Required + vendor role |
| `getVendorStats(vendorId)`           | Live/pending/unverified/earned stats.        | Required + vendor role |

### 6.3 Admin-facing (future)

| Function                           | Purpose              | Auth                  |
| ---------------------------------- | -------------------- | --------------------- |
| `createVendor(input)`              | Add vendor.          | Required + admin role |
| `updateVendor(id, input)`          | Edit vendor.         | Required + admin role |
| `createProduct(vendorId, input)`   | Add product.         | Required + admin role |
| `updateProduct(id, input)`         | Edit product.        | Required + admin role |
| `createOffer(input)`               | Add offer.           | Required + admin role |
| `addVendorStaff(vendorId, userId)` | Link user to vendor. | Required + admin role |
| `listUsers()`                      | Search/filter users. | Required + admin role |

## 7. Real-time Updates

- Use Supabase Realtime channels on the vendor dashboard.
- Subscribe to `orders` and `order_items` changes filtered by `vendor_id`.
- On insert/update, refresh the local order list via TanStack Query invalidation.
- Replace the current `setInterval` polling in `vendor.$vendorId.tsx` with a Realtime listener.

## 8. File Storage

- Store payment proof screenshots in a private Supabase Storage bucket (e.g. `payment-proofs`).
- Enforce RLS so only the customer who uploaded and the vendor receiving the order can read.
- Generate short-lived signed URLs on the server for previews.
- Limit file size to ~5 MB and accept only images (`image/*`).

## 9. Authentication & Roles

- Use Supabase Auth.
- Sign-in options: email OTP, Google, Apple.
- After signup, default role is `customer`.
- Vendors are created by admins and linked via `vendor_staff`.
- Role checks must happen server-side in RLS policies and `createServerFn` middleware; never trust client-side storage.
- Admins can be seeded manually via a secure SQL script or dashboard invite.

## 10. Payment Integration

### Phase 1 — UPI (current demo)

- Checkout shows a UPI QR/deep link (`upi://pay?pa=...&pn=...&am=...`).
- Customer uploads screenshot of payment success.
- Vendor confirms or rejects the payment.

### Phase 2 — Payment gateway (optional)

- Integrate Razorpay or Stripe for online payment capture.
- On success, mark payment `Confirmed` automatically and skip manual verification.
- Keep UPI fallback for cashless counter pickups.

## 11. Migration from Demo

1. **Enable Lovable Cloud** in the project.
2. Run the schema migrations above.
3. Seed vendors/products/offers with the same demo data currently in `src/lib/data.ts`.
4. Replace `localStorage` helpers with Supabase queries / server functions.
5. Update cart context to sync with the server.
6. Update order pages to use server-side loaders.
7. Add Realtime subscriptions on vendor dashboards.
8. Implement authentication screens and role assignment.

## 12. Environment Variables

```bash
# Supabase / Lovable Cloud
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Storage
STORAGE_PAYMENT_PROOFS_BUCKET=payment-proofs

# Payments (Phase 2)
# RAZORPAY_KEY_ID=...
# RAZORPAY_KEY_SECRET=...
```

## 13. Security Checklist

- [ ] RLS enabled on every public table.
- [ ] `GRANT` statements present for every new table.
- [ ] Roles stored in a separate `user_roles` table.
- [ ] Admin checks use `has_role()` security definer function.
- [ ] Payment proofs stored in a private bucket.
- [ ] File uploads validated by type/size server-side.
- [ ] No sensitive keys exposed to the browser.
- [ ] Order status transitions validated server-side.
- [ ] Vendor can only update orders containing their products.
- [ ] Customer can only view their own orders.

## 14. Open Questions

- Should customers be allowed to order from multiple vendors in one order (current demo does) or split into separate vendor orders?
- Should the app support delivery addresses or remain counter-pickup only?
- Which payment gateway should be integrated (Razorpay, Stripe, PhonePe)?
- Should vendors receive push notifications for new orders?
- Should we add an admin dashboard now or after customer/vendor flows are live?
