# Screenshot Pack

Use this checklist to capture safe portfolio screenshots for `CASE_STUDY.md`, GitHub, LinkedIn, or interview material.

## Safety Notes

- Use dummy customer data only.
- Do not show real customer names, real customer phone numbers, real admin emails, or private order notes.
- Replace or blur the real WhatsApp admin number if it appears in the UI.
- Prefer seeded/demo products and demo orders.
- If capturing admin screens, use a demo admin account and demo order data.
- Keep browser zoom at 100% unless a specific crop requires otherwise.

## Recommended Viewports

| Label | Size |
| --- | --- |
| Desktop | `1440 x 1000` |
| Mobile | `390 x 844` |

## Screenshot Checklist

| Screenshot | Suggested file | Route | Viewport | Safe dummy data | Purpose |
| --- | --- | --- | --- | --- | --- |
| Home page | `01-homepage-desktop.png` | `/` | Desktop | Demo product cards only | Show storefront branding, hero, and shopping flow entry point. |
| Product catalog | `02-product-catalog-desktop.png` | `/products` | Desktop | Demo products with safe names/prices | Show catalog grid, search, category filter, sort, and stock-aware product cards. |
| Product detail | `03-product-detail-desktop.png` | `/products/:slug` | Desktop | Demo product such as charger, cable, or powerbank | Show product media, price, stock, quantity selector, and add-to-cart CTA. |
| Cart checkout form | `04-cart-checkout-desktop.png` | `/cart` | Desktop | Customer name `Demo Customer`, phone `08123456789`, neutral note | Show cart items, checkout step indicator, order summary, and WhatsApp preview. |
| Checkout success / WhatsApp redirect state | `05-checkout-success-desktop.png` | `/cart` | Desktop | Demo order ID only, no real customer data | Show post-checkout guidance, order ID short, reopen WhatsApp, continue shopping, and manual clear cart actions. |
| Login page | `06-login-desktop.png` | `/login` | Desktop | No account details visible | Show Google admin login entry point. |
| Admin dashboard | `07-admin-dashboard-desktop.png` | `/admin` | Desktop | Demo totals and demo recent orders only | Show admin monitoring summary for products and orders. |
| Admin products | `08-admin-products-desktop.png` | `/admin/products` | Desktop | Demo products only | Show admin CRUD list, status badges, and product management controls. |
| Product create/edit form | `09-product-form-desktop.png` | `/admin/products/new` or `/admin/products/:id/edit` | Desktop | Demo product values only | Show product form fields, image URL/upload area, active status, and save flow. |
| Admin orders list | `10-admin-orders-list-desktop.png` | `/admin/orders` | Desktop | Demo orders with masked phone such as `+62812xxxx789` | Show realtime indicator, filters, search, status badges, stock sync badges, and export action. |
| Admin order detail drawer | `11-admin-order-detail-drawer-desktop.png` | `/admin/orders` | Desktop | Demo order with masked phone and neutral note | Show order details, items, customer info, stock sync, and WhatsApp message section. |
| Order audit log section | `12-order-audit-log-desktop.png` | `/admin/orders` | Desktop | Demo status changes and demo admin email masked | Show status history timeline and accountability trail. |
| Export CSV button/state | `13-export-csv-desktop.png` | `/admin/orders` | Desktop | Demo filtered order list | Show export CSV button and filtered result count/feedback state. |
| Mobile navbar | `14-mobile-navbar.png` | `/` | Mobile | No private data | Show mobile header, cart shortcut, and hamburger menu state. |
| Mobile product catalog | `15-mobile-product-catalog.png` | `/products` | Mobile | Demo products only | Show responsive product grid/cards and filters on mobile. |
| Mobile cart checkout | `16-mobile-cart-checkout.png` | `/cart` | Mobile | Demo Customer, masked phone, neutral note | Show mobile checkout form, order summary, and compact WhatsApp preview. |
| Mobile admin order card | `17-mobile-admin-order-card.png` | `/admin/orders` | Mobile | Demo order with masked phone | Show mobile admin order card layout, status controls, and detail action. |

## Suggested Capture Flow

1. Start from a clean demo environment.
2. Create or seed demo products.
3. Add one or two demo cart items.
4. Fill checkout with safe values:
   - Name: `Demo Customer`
   - Phone: `08123456789` or masked display value
   - Note: `Demo order for portfolio screenshot`
5. Create a demo order.
6. In admin, update statuses with demo data:
   - `pending`
   - `confirmed`
   - `completed`
   - `cancelled`
7. Capture desktop screenshots first.
8. Switch viewport to mobile and capture responsive states.

## Optional Editing Before Publishing

- Blur phone numbers.
- Blur admin emails.
- Crop browser chrome if not needed.
- Keep consistent aspect ratio for portfolio cards.
- Use compressed PNG or WebP for README display.
