# Release Notes

## MVP / Phase 2

Adzani E-commerce has reached a production-demo ready milestone. This release covers the public storefront, WhatsApp checkout, Supabase order recording, admin product management, and admin order operations.

### MVP Storefront

- Added public homepage for Adzani Store.
- Added product catalog with active products from Supabase.
- Added search, category filter, and sorting.
- Added product detail pages.
- Added responsive customer-facing UI.
- Added loading, empty, and error states for public pages.

### Admin Products

- Added Google OAuth admin login.
- Added admin route protection.
- Added admin dashboard.
- Added product list for active and inactive products.
- Added product create, edit, delete, and active/inactive toggle.
- Added Supabase Storage support for product images.
- Hardened product access with admin RLS policies.

### Checkout WhatsApp

- Added cart with `localStorage` persistence.
- Added quantity controls with stock limits.
- Added cart recovery for stale product data.
- Added optional customer name, phone, pickup method, and note.
- Added WhatsApp message preview.
- Added post-checkout guidance without automatically clearing cart.

### Orders Supabase

- Added `orders` table.
- Checkout now saves pending orders to Supabase before opening WhatsApp.
- Orders include customer data, items JSON, total, status, and WhatsApp message.
- Public users can insert orders but cannot browse all orders.

### Realtime Admin Orders

- Added `/admin/orders`.
- Added realtime refresh for `INSERT`, `UPDATE`, and `DELETE`.
- Added order list, status filter, search, loading, empty, and error states.
- Added detail drawer for full order inspection.

### Stock Sync Deduct/Restore

- Added `process_order_status` RPC.
- Stock deducts once when an order becomes `confirmed` or `completed`.
- Stock does not double deduct when moving from `confirmed` to `completed`.
- Stock restores once when a processed order becomes `cancelled`.
- Cancelled orders can be confirmed again if stock is available.
- Stock operations remain server-side and admin-only.

### Audit Log

- Added `order_status_logs`.
- Status changes are logged through the RPC.
- Logs record previous status, next status, admin user, admin email, and timestamp.
- Admin order detail drawer shows a status history timeline.

### Export CSV

- Added CSV export from Admin Orders.
- Export follows the current search and status filter.
- CSV includes order ID, customer data, status, total, stock sync fields, item summary, and timestamps.
- CSV values are escaped for commas, quotes, and newlines.

### Customer Phone

- Added optional customer WhatsApp phone field.
- Phone is normalized to Indonesian format.
- Admin pages display phone in a clean format.
- Admin order detail includes a `Chat customer` WhatsApp link.
- Export CSV keeps the normalized phone number.

### Final QA

- Production build passed.
- Public routes passed smoke checks.
- Direct nested route refresh works through Vercel SPA rewrite.
- Guest admin routes redirect to login.
- Public product read and order privacy behavior were checked.
- No frontend service role key or private Supabase key is used.

## Notes

- Payment gateway is not included.
- Shipping/ongkir automation is not included.
- Checkout remains WhatsApp-first, with Supabase orders used for admin order management.
