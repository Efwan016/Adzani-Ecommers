# Adzani E-commerce

Adzani E-commerce is a production-ready MVP storefront for an electronics, phone accessories, voucher, and counter-service shop. Customers can browse active products, add items to a local cart, submit a WhatsApp checkout, and have the order recorded in Supabase for admin processing.

> Live demo: `https://your-adzani-demo.vercel.app`

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| Backend | Supabase Database, Auth, Storage, Realtime |
| Auth | Supabase Google OAuth |
| Checkout | WhatsApp deep link + Supabase orders |
| Deployment | Vercel |
| Local runtime | Node.js, Docker, Docker Compose |

## Main Features

- Public storefront with homepage, catalog, product detail, and cart.
- Supabase-backed product data with active/inactive visibility.
- Cart persistence with `localStorage`.
- Cart recovery UX for stale product price, stock, inactive, or missing products.
- WhatsApp checkout with customer name, phone, pickup method, note, and message preview.
- Orders saved to Supabase before WhatsApp opens.
- Admin product management.
- Admin order management with realtime updates, detail drawer, status transitions, audit log, stock sync, and CSV export.

## Public Features

- Homepage with shopping flow and product discovery.
- Product catalog at `/products`.
- Product search, category filter, and sorting.
- Product detail at `/products/:slug`.
- Stock-aware add to cart.
- Quantity controls that prevent exceeding product stock.
- Empty, loading, and error states.
- Cart page at `/cart` with:
  - checkout step indicator
  - order summary
  - optional customer data
  - Indonesian phone normalization
  - WhatsApp message preview
  - cart refresh/recovery
  - post-checkout guidance

## Admin Features

- Google OAuth login through Supabase Auth.
- Admin route guard using `VITE_ADMIN_EMAILS`.
- Admin dashboard at `/admin`.
- Product CRUD at `/admin/products`.
- Add product at `/admin/products/new`.
- Edit product at `/admin/products/:id/edit`.
- Active/inactive product management.
- Product image storage through Supabase Storage policies.
- Dashboard summaries for product and order activity.

## Order Management Features

- Admin orders page at `/admin/orders`.
- New WhatsApp checkout orders are saved as `pending`.
- Realtime refresh for order `INSERT`, `UPDATE`, and `DELETE`.
- Status filter and search by customer, order ID, item name, or phone.
- Detail drawer with customer data, items, WhatsApp message, stock sync state, and audit timeline.
- Safer status transitions:
  - `pending` -> `confirmed`, `cancelled`, `completed`
  - `confirmed` -> `completed`, `cancelled`
  - `completed` -> `cancelled`
  - `cancelled` -> `confirmed`
- Stock deduct once when order becomes `confirmed` or `completed`.
- Stock restore once when processed order becomes `cancelled`.
- Cancelled order can be confirmed again if stock is available.
- Status audit log records from/to status, admin user, email, and timestamp.
- CSV export follows the current search/filter view.
- Customer WhatsApp phone is normalized and linked to `wa.me`.

## Security And RLS Notes

- Do not use a Supabase service role key in the frontend.
- Frontend uses only Supabase URL and anon/publishable key.
- Public users can read active products only.
- Public users can insert checkout orders.
- Public users cannot browse orders or order status logs.
- Admin access is enforced in two layers:
  - frontend admin guard through `VITE_ADMIN_EMAILS`
  - Supabase RLS and `public.is_admin()`
- Order status processing is handled by the `process_order_status` RPC.
- Stock deduct/restore logic is server-side in SQL to avoid double deduct or double restore.

## Environment Variables

Create `.env` locally from `.env.example`. Never commit real secrets.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
VITE_WHATSAPP_ADMIN=628xxxxxxxxxx
VITE_ADMIN_EMAILS=admin@example.com
```

Notes:

- `VITE_WHATSAPP_ADMIN` should use international format without `+`.
- `VITE_ADMIN_EMAILS` supports comma-separated emails.
- Keep Supabase service role keys only in secure server-side environments, not in this Vite app.

## Local Setup

```bash
npm install
npm run dev
```

Development server:

```txt
http://localhost:3000
```

Production build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## Docker Setup

Run the Vite development server in Docker:

```bash
docker compose up --build
```

Then open:

```txt
http://localhost:3000
```

Make sure the required Vite environment variables are available to Docker through your shell or `.env` file.

## Supabase Setup

Run the SQL files in this order from the Supabase SQL Editor:

1. `supabase/products.sql`
2. `supabase/storage.sql`
3. `supabase/orders.sql`
4. `supabase/order-stock-sync.sql`
5. `supabase/order-audit-log.sql`
6. `supabase/order-customer-phone.sql`

Important setup notes:

- Replace placeholder admin emails inside SQL helper functions with the same emails used in `VITE_ADMIN_EMAILS`.
- Enable Google OAuth in Supabase Auth.
- Add local and production redirect URLs in Supabase Auth settings.
- Ensure the `product-images` storage bucket exists before using product image upload flows.

## Build Command

```bash
npm run build
```

The production output directory is:

```txt
dist
```

## Deployment Notes

Vercel setup (one-click import from GitHub):

- Framework preset: Vite
- Build command: `npm run build` (or `vercel-build`)
- Output directory: `dist`
- Install command: `npm ci`
- Environment variables (set in Vercel dashboard, all injected at build time):
  - `VITE_SITE_URL` — **required**; absolute production URL (no trailing slash), e.g. `https://adzani-store.vercel.app`. Drives canonical links, sitemap, OG image, and JSON-LD absolute URLs.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_WHATSAPP_ADMIN`
  - `VITE_ADMIN_EMAILS`

Copy `.env.production.example` to your Vercel env values (prefix must be `VITE_` for anything used in the browser).

This repo ships a `vercel.json` that:

- Adds an SPA rewrite so direct refresh on nested routes (`/products/:slug`, `/admin/*`) works.
- Sets security headers on every response: `Content-Security-Policy` (strict, allows only the Supabase origin for img/connect), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` (HSTS, preload).
- Sends `Cache-Control: immutable` (1y) for `/assets/*` so hashed bundles cache forever.

After the first deploy, re-run Lighthouse against the production URL (not localhost) — the CSP, HSTS, long-cache headers, and Supabase image CDN transforms only take effect there, which is what lifts the Performance score above the localhost baseline.

## Current Status

MVP/Phase 2 is production-demo ready:

- Customer storefront is usable.
- WhatsApp checkout records orders to Supabase.
- Admin can manage products and orders.
- Order stock sync is protected by RPC.
- Status audit log and CSV export are available.
- Final build and route QA have passed.

Admin live testing still requires a valid Google account listed in `VITE_ADMIN_EMAILS` and in the Supabase `public.is_admin()` helper.

## Roadmap

- Admin order analytics.
- Printable invoice or receipt view.
- Order note updates from admin.
- Better image optimization pipeline.
- Optional payment gateway integration.
- Optional shipping/ongkir integration.
- Customer order tracking page.
- Automated test coverage for critical checkout and admin flows.
