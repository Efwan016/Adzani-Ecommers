# Adzani E-commerce

## Short Summary

Adzani E-commerce is a production-demo ready online storefront for an electronics, phone accessories, voucher, and counter-service shop. The project combines a public shopping experience, WhatsApp-based checkout, Supabase order recording, and an admin dashboard for managing products, orders, stock, and order status history.

I built the application as a full-stack frontend-focused MVP using React, TypeScript, Tailwind CSS, and Supabase. The final result supports a realistic small-business workflow: customers browse and checkout through WhatsApp, while admins manage product data and process incoming orders from a secured admin area.

## Problem

Small shops often sell through WhatsApp but still manage products, stock, and order notes manually. This creates several operational problems:

- Customers need a clearer catalog before chatting with admin.
- Admins need structured order data instead of relying only on WhatsApp messages.
- Stock can become inaccurate when orders are confirmed or cancelled manually.
- Stored cart data can become stale when product price, stock, or active status changes.
- Admin-only data must not be visible to public users.

## Goal

The goal was to build a production-ready demo that keeps WhatsApp as the checkout channel while adding enough structure for real operations:

- Give customers a simple catalog and cart flow.
- Save every checkout as a pending order in Supabase.
- Let admins review, search, filter, export, and update orders.
- Keep stock accurate when orders are processed or cancelled.
- Protect admin routes and database access with a clear RLS model.
- Keep the app deployable on Vercel and runnable locally or through Docker.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| Backend | Supabase Database, Auth, Storage, Realtime |
| Auth | Supabase Google OAuth |
| Data Security | Supabase RLS, admin helper function, RPC |
| Checkout | WhatsApp deep link |
| Deployment | Vercel |
| Local Runtime | Node.js, Docker, Docker Compose |

## Key Features

- Public storefront with homepage, catalog, product detail, and cart.
- Product search, category filtering, and sorting.
- Local cart persistence with session isolation on auth changes.
- Cart recovery for stale product data.
- WhatsApp checkout with customer name, normalized phone, pickup method, and order note.
- Orders saved to Supabase before WhatsApp opens.
- Admin product CRUD.
- Admin orders page with realtime updates.
- Order detail drawer with full JSON item breakdown and WhatsApp message.
- Safer status transitions.
- Stock deduct/restore through Supabase RPC.
- Status audit log.
- CSV export for filtered order data.
- Customer phone normalization and direct WhatsApp chat link.

## Architecture Overview

The app uses a Vite React frontend connected directly to Supabase through the official JavaScript SDK. Public pages read active products from Supabase, while admin pages are protected by both frontend guards and database policies.

At a high level:

```txt
Customer Browser
  -> React storefront
  -> Supabase products read
  -> localStorage cart
  -> Supabase orders insert
  -> WhatsApp checkout link

Admin Browser
  -> React admin dashboard
  -> Supabase Auth Google OAuth
  -> RLS-protected products/orders
  -> process_order_status RPC
  -> Realtime order changes
```

The most important boundary is order processing. Stock changes are not trusted to the browser. Admin status updates call the `process_order_status` RPC, and the database handles deduct, restore, audit logging, and double-action prevention.

## Public Customer Flow

Customers can browse the homepage, open the product catalog, search or filter products, view product details, and add items to the cart. Quantity controls are limited by product stock so customers cannot add more than the available stock shown in the catalog.

The cart is stored in `localStorage`, which keeps checkout lightweight and login-free. Before checkout, customers can refresh the cart against current Supabase product data. If a product becomes inactive, missing, out of stock, or has changed price, the cart shows warnings and disables checkout until the issue is addressed.

Checkout collects optional customer data:

- customer name
- WhatsApp phone
- pickup method
- order note

The phone number is normalized to Indonesian WhatsApp format. The customer can preview the WhatsApp message before checkout. When checkout is clicked, the app saves a pending order to Supabase first, then opens WhatsApp with the generated message.

## Admin Flow

Admin access uses Supabase Google OAuth. The frontend checks `VITE_ADMIN_EMAILS`, while Supabase RLS uses `public.is_admin()` to enforce database-level access.

Admin product management includes:

- product list
- create product
- edit product
- active/inactive toggle
- delete product
- product image storage support

The admin dashboard also provides a quick summary of product and order activity so the admin does not need to open the order page for every quick check.

## Order Management Flow

Every checkout creates a pending order in Supabase. Admins can open `/admin/orders` to see incoming orders in realtime.

The order management page includes:

- realtime refresh on order insert, update, and delete
- status filters
- search by customer, order ID, item name, or phone
- status badges
- stock sync badges
- detail drawer
- audit timeline
- CSV export

Status updates follow safer transitions:

```txt
pending -> confirmed | completed | cancelled
confirmed -> completed | cancelled
completed -> cancelled
cancelled -> confirmed
```

This keeps the UI from offering confusing jumps while still allowing operational rollback when needed.

## Security/RLS Approach

The app uses layered security:

- Public users can read active products.
- Public users can insert checkout orders.
- Public users cannot browse all orders.
- Public users cannot read order status logs.
- Admin users can read, update, and delete orders.
- Admin users can manage products.
- Admin-only checks are enforced by Supabase RLS and `public.is_admin()`.
- The frontend never uses a Supabase service role key.

The frontend guard improves UX by hiding admin links from non-admin users. The real enforcement remains in Supabase policies and RPC validation.

## Stock Sync Challenge

The main inventory challenge was avoiding incorrect stock changes when order statuses change multiple times.

For example:

- pending -> confirmed should reduce stock once.
- confirmed -> completed should not reduce stock again.
- completed -> cancelled should restore stock once.
- cancelled -> confirmed should deduct again only if stock is available.

I solved this with database fields such as `stock_deducted`, `stock_deducted_at`, `stock_restored`, and `stock_restored_at`, then centralized the logic in the `process_order_status` RPC. This keeps stock operations transactional and prevents the browser from becoming the source of truth for inventory.

## What I Built

I implemented the project end to end across the public storefront, admin panel, and Supabase layer:

- Designed and built the public storefront pages.
- Implemented product catalog, search, filters, detail page, and stock-aware cart.
- Built cart persistence and session isolation.
- Added WhatsApp checkout and message preview.
- Added Supabase order creation before WhatsApp handoff.
- Built admin product management.
- Built admin order management with realtime updates.
- Added order detail drawer, status filters, search, export, and audit log display.
- Implemented SQL migrations for orders, stock sync, audit log, and customer phone.
- Implemented stock deduct/restore through Supabase RPC.
- Added final QA checks for routes, build, RLS behavior, mobile smoke, and console errors.
- Wrote README and release notes for handoff and portfolio use.

## Technical Decisions

- Keep checkout WhatsApp-first to match the business workflow.
- Store orders in Supabase before opening WhatsApp so admin has structured data.
- Keep cart public and local so customers do not need accounts.
- Add cart recovery instead of silently deleting stale items.
- Use Supabase RPC for stock changes instead of frontend updates.
- Use audit logs for status history and accountability.
- Keep admin-only links hidden in the UI while relying on RLS for actual access control.
- Use CSV export instead of a heavier reporting module for the MVP.
- Normalize customer phone numbers for consistent WhatsApp links and exports.

## Challenges Solved

- Prevented stale carts from silently producing invalid checkouts.
- Preserved WhatsApp checkout while adding database-backed orders.
- Prevented double stock deduction.
- Added stock restoration for cancelled orders.
- Supported status rollback without creating inventory drift.
- Added status audit history for operational visibility.
- Kept public users from reading private order data.
- Kept admin order UX usable on mobile with cards and a detail drawer.
- Added route refresh support for Vercel SPA deployment.

## Screenshots Placeholder

Add screenshots to `docs/screenshots/` using the checklist in `docs/screenshots/README.md`.

> These image links are placeholders until the actual screenshot files are captured.

![Home page](docs/screenshots/01-homepage-desktop.png)
![Product catalog](docs/screenshots/02-product-catalog-desktop.png)
![Product detail](docs/screenshots/03-product-detail-desktop.png)
![Cart checkout form](docs/screenshots/04-cart-checkout-desktop.png)
![Checkout success state](docs/screenshots/05-checkout-success-desktop.png)
![Login page](docs/screenshots/06-login-desktop.png)
![Admin dashboard](docs/screenshots/07-admin-dashboard-desktop.png)
![Admin products](docs/screenshots/08-admin-products-desktop.png)
![Product create or edit form](docs/screenshots/09-product-form-desktop.png)
![Admin orders list](docs/screenshots/10-admin-orders-list-desktop.png)
![Admin order detail drawer](docs/screenshots/11-admin-order-detail-drawer-desktop.png)
![Order audit log](docs/screenshots/12-order-audit-log-desktop.png)
![Export CSV state](docs/screenshots/13-export-csv-desktop.png)
![Mobile navbar](docs/screenshots/14-mobile-navbar.png)
![Mobile product catalog](docs/screenshots/15-mobile-product-catalog.png)
![Mobile cart checkout](docs/screenshots/16-mobile-cart-checkout.png)
![Mobile admin order card](docs/screenshots/17-mobile-admin-order-card.png)

## What I Learned

This project reinforced the importance of matching technical architecture to real business workflow. A small shop may not need a payment gateway immediately, but it still benefits from structured orders, clear stock handling, admin visibility, and secure database rules.

The most valuable technical lesson was keeping critical inventory behavior in the database. Moving stock deduct/restore into an RPC made the system safer than relying on UI state alone.

The project also highlighted how much production readiness comes from small UX details: clear empty states, disabled reasons, recovery actions, mobile layouts, export tools, and post-checkout guidance.

## Future Improvements

- Add admin order analytics.
- Add printable invoice or receipt view.
- Add admin-editable internal order notes.
- Add customer order tracking by order ID.
- Add automated tests for checkout and order status flows.
- Add image optimization for product media.
- Add optional payment gateway integration.
- Add optional shipping or delivery cost integration.
- Add role management beyond email whitelisting.
