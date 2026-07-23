# PRD — Adzani Store: Customer Order Tracking, Test Coverage, Admin Orders, Product Grid, Error Monitoring

Dokumen ini memetakan 5 inisiatif yang diminta user, grounded di kondisi kode riil
(di-inspect dari `src/`, `supabase/*.sql`, `vite.config.ts`, `package.json`).

Status awal (fakta dari codebase, bukan asumsi):
- Stack: React 19 + Vite 5 + React Router 7 + Supabase JS 2 + Tailwind 4 (vite plugin).
- Order sudah tersimpan ke tabel `public.orders` via `orderService.createOrder` (anon INSERT, status=pending).
- RLS `orders.sql`: SELECT/UPDATE/DELETE hanya `authenticated` + `public.is_admin()`. Anon TIDAK BISA baca order.
- AdminOrders.tsx SUDAH punya search + status filter + realtime Supabase + CSV export. Yang kurang = pagination.
- Product grid (`Products.tsx`) render semua produk sekaligus, gambar tanpa `loading="lazy"`.
- Test: hanya `useCart.test.ts` dan `phone.test.ts`. Alur order/checkout/whatsapp/grid BELUM di-test.
- index.html sudah link `/manifest.webmanifest` tapi TIDAK ADA service worker (PWA offline belum jalan) — ini di luar 5 request user, dicatat sebagai follow-up opsional.
- Tim peduli CSP-clean (commit "remove external Unsplash deps") → analytics wajib privacy-friendly, tanpa script external.

---

## Phase 1 — Product Grid: Lazy-load + Pagination
**Tujuan:** Turunkan payload awal & waktu interaktif saat katalog membesar.

**Perubahan:**
- Tambah `loading="lazy"` + `decoding="async"` pada `<img>` di `Products.tsx` (grid) dan `Cart.tsx` (thumbnail).
- Tambah pagination client-side di `Products.tsx` (state `currentPage`, `PAGE_SIZE = 12`), dengan reset ke halaman 1 saat filter/search berubah. Tampilkan kontrol prev/next + nomor halaman + label "Menampilkan X–Y dari N".
- Gunakan kembali konvensi `state-panel`, `btn-secondary`, `surface-card` yang sudah ada.

**Tidak diubah:** sorting, filter kategori, search, skeleton — biarkan apa adanya.

**Kriteria selesai:**
- Gambar grid & cart pakai `loading="lazy"`.
- Pagination muncul saat `filteredProducts.length > PAGE_SIZE`; filter berubah → halaman reset.
- `npm run build` + `npm run test` hijau.

---

## Phase 2 — Admin Orders: Pagination
**Tujuan:** Hindari render ratusan baris order sekaligus di AdminOrders.

**Perubahan:**
- Tambah pagination client-side pada `visibleOrders` (hasil filter+search yang sudah ada) di `AdminOrders.tsx`. State `currentPage`, `PAGE_SIZE = 15`.
- Reset halaman ke 1 saat `searchQuery`/`statusFilter` berubah atau saat data realtime reload.
- Jaga ekspor CSV tetap mengekspor SELURUH `visibleOrders` (bukan hanya halaman aktif) — jangan ubah behaviour export.

**Kriteria selesai:**
- Tabel order dipaginasi; kontrol prev/next + info "X–Y dari N".
- Search/filter/realtime tetap berfungsi; CSV export tidak berubah.
- `npm run build` + `npm run test` hijau.

---

## Phase 3 — Customer Order Tracking (fitur utama)
**Masalah:** Order tersimpan di DB tapi customer cuma "chat admin". Order ID (UUID) terlalu sensitif untuk dibagikan & tidak bisa dibaca anon (RLS).

**Desain akses (aman, tanpa ubah model auth):**
- Tambah kolom `tracking_token text UNIQUE` di `public.orders` (diisi otomatis via trigger `set_tracking_token` pakai `gen_random_uuid()`/`encode` saat INSERT). Token ini yang dibagikan ke customer, BUKAN order UUID.
- Tambah RLS policy `orders_select_tracking`: `FOR SELECT TO anon, authenticated USING (tracking_token = current_setting('request.jwt.claims', true)::json->>'tracking_token' ... )` — pola aman: token dikirim lewat header/query param khusus yang dibaca di policy. Implementasi praktis: simpan token di kolom, dan policy mengizinkan SELECT bila `tracking_token = current_setting('app.tracking_token', true)`. Frontend meng-set `app.tracking_token` via `supabase.rpc`/session setter tidak didukung anon — MAKAN pendekatan yang dipakai: buka akses SELECT `TO anon, authenticated USING (true)` HANYA pada kolom yg sudah aman? TIDAK. Solusi final yang dipakai (lihat implementasi): buat policy `orders_select_tracking` `USING (tracking_token = current_setting('request.headers', true)::json->>'x-tracking-token')` — tapi anon fetch lewat JS SDK tidak bisa set header per-row.

**Keputusan implementasi (simpel & aman):**
Gunakan **Secure View + token**: buat `public.order_public_view` yang hanya menampilkan kolom aman (id pendek, status, items, total, created_at, tracking_token) dan function `public.get_order_by_token(p_token text)` yang `SECURITY DEFINER` mengembalikan 1 baris bila token cocok. Frontend memanggil `supabase.rpc('get_order_by_token', { p_token })`. Ini menghindari ubah RLS anon SELECT mentah & tidak expose UUID.

**Alur fitur:**
1. Setelah `createOrder` sukses di Cart, ambil `tracking_token` dari hasil insert (tambah return field di `CreateOrderResult { id, tracking_token }`).
2. Cart menampilkan "Salin link lacak: `/track?token=XXX`" + tombol copy + link ke `/track`.
3. Halaman baru `/track`:
   - Input token (atau baca dari `?token=`) → panggil `get_order_by_token`.
   - Tampilkan status order (pakai `ORDER_STATUS_LABELS`/`TONES` yang sudah ada), items, total, waktu, dan link WhatsApp admin bila perlu.
   - Handle: token kosong, token salah, order tidak ditemukan, error jaringan (reuse pola `error-panel`/`state-panel`).
4. Navbar: tambah menu "Lacak Pesanan" (semua user, bukan cuma admin).

**SQL baru (`supabase/order-tracking.sql`):**
- `ALTER TABLE orders ADD COLUMN tracking_token text UNIQUE;`
- Trigger isi token saat INSERT (jika null).
- `CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token text) RETURNS ... SECURITY DEFINER` (hanya kolom aman).
- GRANT EXECUTE ke `anon, authenticated`.

**Kriteria selesai:**
- Customer bisa lacak order hanya dengan token (tidak butuh login).
- UUID order tidak terekspos ke customer.
- Admin/RLS tidak melemah.
- `build` + `test` hijau.

---

## Phase 4 — Test Coverage
**Target:** naikkan coverage pada alur krusial yang belum di-test.

**File test baru:**
- `src/services/orderService.test.ts` — `createOrder` (sukses, item kosong, no supabase), `getOrdersAdmin`, `updateOrderStatus` (RPC), `deleteOrder`. Mock `supabase` via `vi.mock('../services/supabaseClient')`.
- `src/services/whatsappService.test.ts` — `generateWhatsAppOrderMessage` format, `getWhatsAppCheckoutUrl` (empty cart throw, no phone throw), `getWhatsAppUrlForMessage` encode.
- `src/components/product/ProductGrid.test.tsx` — paginasi memotong list, lazy attribute, tombol disabled saat stok 0 (reuse `ProductGrid` bila sudah di-abstraksi; bila belum, test lewat `Products` dengan mock `useProducts`).
- `src/pages/TrackOrder.test.tsx` — render input, submit token → panggil rpc, tampilkan status / error.
- `src/services/trackOrderService.test.ts` — wrapper `getOrderByToken`.

Catatan: test harus jalan tanpa Supabase nyata (mock). Ikuti pola `src/test/setup.ts` + `vitest` config yang sudah ada.

**Kriteria selesai:**
- `npm run test` hijau; minimal alur order/checkout/tracking ter-cover.

---

## Phase 5 — Error Monitoring / Privacy-friendly Analytics
**Masalah:** tidak ada visibilitas error runtime / behaviour user, dan tim anti script external (CSP).

**Desain:**
- `src/lib/monitor.ts`:
  - `captureError(err, context)` → kirim ke endpoint internal bila `VITE_MONITOR_URL` diset; fallback `console.error`. Tanpa external SDK.
  - `trackEvent(name, props?)` → endpoint internal yang sama (atau no-op bila tidak diset). Payload kecil, tanpa PII.
- Hook ke `window.onerror` + `window.addEventListener('unhandledrejection')` di `main.tsx` (opt-in via env).
- Reuse `ErrorBoundary.tsx`: panggil `captureError` saat terjadi render error.
- ENV: `VITE_MONITOR_URL` (opsional). Bila kosong → no-op (tidak break CSP, tidak network call).

**Kriteria selesai:**
- Tanpa `VITE_MONITOR_URL`: tidak ada network call, tidak ada error.
- Dengan env: error + event terkirim ke endpoint internal, tanpa PII.
- `build` + `test` hijau.

---

## Diluar scope (follow-up, tidak dikerjakan sekarang)
- PWA service worker / offline (manifest ada, SW belum).
- Customer account / login.
- Payment gateway (tetap WhatsApp flow).

## Urutan eksekusi
Phase 1 → 2 → 3 → 4 → 5, tiap phase diakhiri `npm run build` + `npm run test` hijau sebelum lanjut.
