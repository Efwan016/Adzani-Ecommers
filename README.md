# Adzani E-commerce

Adzani E-commerce adalah MVP toko online untuk katalog produk elektronik, aksesoris HP, voucher, dan kebutuhan konter. Aplikasi ini menampilkan produk aktif dari Supabase, menyediakan cart berbasis `localStorage`, checkout ke WhatsApp admin, serta panel admin untuk mengelola produk.

## Status MVP

MVP core sudah selesai dan siap masuk tahap push repository serta deploy production.

Yang sudah tersedia:

- Customer landing page yang terhubung ke flow belanja.
- Katalog produk dari Supabase.
- Search dan filter kategori.
- Halaman detail produk.
- Cart tersimpan di `localStorage`.
- Checkout WhatsApp dengan format pesan otomatis.
- Login admin menggunakan Google OAuth Supabase Auth.
- Protected route untuk area admin.
- Dashboard admin dengan ringkasan produk.
- CRUD produk lengkap untuk admin.
- Toggle produk aktif/nonaktif.
- Delete produk dengan konfirmasi.
- SEO basic dan app metadata.

## Fitur Customer

- Landing page untuk memperkenalkan Adzani Store dan alur belanja.
- Product catalog di `/products`.
- Search produk berdasarkan nama atau deskripsi.
- Filter produk berdasarkan kategori.
- Product detail di `/products/:slug`.
- Product card dan detail menampilkan harga, kategori, stok, gambar, dan fallback image.
- Cart berbasis `localStorage`, sehingga customer tidak perlu login.
- Update quantity, hapus item, dan kosongkan cart.
- Quantity cart dibatasi sesuai stok produk.
- Checkout via WhatsApp ke nomor admin dari environment variable.

## Fitur Admin

- Login dengan Google OAuth melalui Supabase Auth.
- Protected route untuk halaman admin.
- Dashboard summary:
  - total produk
  - produk aktif
  - produk nonaktif
  - stok habis
- Product list untuk semua produk, termasuk produk nonaktif.
- Create product.
- Edit product.
- Toggle active/inactive product.
- Delete product dengan `window.confirm`.
- Product form mendukung create dan edit mode.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Supabase JavaScript SDK
- Supabase Auth Google OAuth
- Supabase Database
- Cart `localStorage`
- WhatsApp checkout link

## Struktur Folder Singkat

```txt
src/
  components/
    auth/              # ProtectedRoute
    layout/            # Layout dan Navbar
    product/           # Section shortcut katalog
    ui/                # Landing page sections dan auth button
  hooks/
    useAuth.ts         # Supabase auth state dan OAuth action
    useCart.ts         # Cart localStorage
    useProducts.ts     # Load produk aktif
  lib/
    formatCurrency.ts  # Format Rupiah
    slugify.ts         # Helper slug produk
  pages/
    Home.tsx
    Products.tsx
    ProductDetail.tsx
    Cart.tsx
    Login.tsx
    admin/
      AdminDashboard.tsx
      AdminProducts.tsx
      ProductForm.tsx
  services/
    productService.ts
    supabaseClient.ts
    whatsappService.ts
  types/
    types.ts
supabase/
  products.sql         # SQL table products, RLS, policies, sample data
```

## Routes

Customer:

- `/` landing page
- `/products` katalog produk
- `/products/:slug` detail produk
- `/cart` cart dan checkout WhatsApp
- `/login` login admin

Admin:

- `/admin` dashboard admin
- `/admin/products` manajemen produk
- `/admin/products/new` tambah produk
- `/admin/products/:id/edit` edit produk

## Environment Variables

Buat file `.env` dari `.env.example`.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
VITE_WHATSAPP_ADMIN=628xxxxxxxxxx
```

Catatan keamanan:

- Jangan menulis secret asli di README.
- Jangan memakai atau mengekspos Supabase service role key di frontend.
- Frontend hanya membutuhkan Supabase URL, anon key, dan nomor WhatsApp admin.

## Cara Install

```bash
npm install
```

## Cara Run Development

```bash
npm run dev
```

Dev server default project berjalan di:

```txt
http://localhost:3000
```

## Cara Build Production

```bash
npm run build
```

Untuk preview hasil build:

```bash
npm run preview
```

## Supabase Setup Singkat

1. Buat project Supabase baru.
2. Buka SQL Editor di Supabase.
3. Jalankan isi file `supabase/products.sql`.
4. Pastikan table `products` sudah terbuat.
5. Pastikan RLS aktif.
6. Pastikan policy public hanya membaca produk aktif.
7. Pastikan authenticated user bisa insert, update, dan delete produk untuk kebutuhan MVP.
8. Isi `.env` dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.

Table utama:

```txt
products
- id
- name
- slug
- description
- category
- price
- cost_price
- stock
- image_url
- is_active
- created_at
- updated_at
```

Behavior data:

- Produk aktif tampil di customer catalog.
- Produk nonaktif tidak tampil di customer catalog.
- Produk nonaktif tetap tampil di admin product list.
- Produk stok `0` tampil sebagai stok habis.
- Produk stok `0` tidak bisa ditambahkan ke cart.

## Google OAuth Note

Admin login memakai Supabase Google OAuth.

Checklist konfigurasi:

- Enable Google provider di Supabase Auth.
- Isi Google Client ID dan Client Secret di dashboard Supabase.
- Tambahkan redirect URL sesuai environment development dan production.
- Development redirect umumnya mengarah ke `http://localhost:3000/admin`.
- Saat deploy nanti, tambahkan domain production Vercel ke allowed redirect URLs.

## WhatsApp Checkout

Checkout dibuat dari cart customer dan diarahkan ke:

```txt
https://wa.me/<VITE_WHATSAPP_ADMIN>?text=<encoded-order-message>
```

Pesan checkout berisi:

- nama produk
- quantity
- harga per item
- subtotal per item
- total order
- catatan konfirmasi ketersediaan

Tidak ada pembayaran otomatis di website pada MVP ini. Admin tetap mengonfirmasi stok dan pembayaran secara manual melalui WhatsApp.

## Deployment Note untuk Vercel

Project belum dideploy. Saat siap deploy ke Vercel:

1. Push repository ke GitHub.
2. Import project ke Vercel.
3. Set framework preset ke Vite.
4. Isi environment variables di Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WHATSAPP_ADMIN`
5. Pastikan Supabase Auth redirect URL production sudah ditambahkan.
6. Build command:

```bash
npm run build
```

7. Output directory:

```txt
dist
```

## Roadmap After MVP

- Order database agar checkout tersimpan di Supabase.
- Status order dan riwayat pesanan.
- Payment gateway.
- Ongkir otomatis.
- Upload gambar produk dari admin.
- Role admin yang lebih ketat.
- Dashboard analytics.
- Promo atau voucher discount.
- Wishlist.
- Review produk.
- Notifikasi order untuk admin.

## Quality Status

- Final manual QA berbasis PRD MVP sudah dilakukan.
- Production build berhasil dengan `npm run build`.
- Source frontend tidak memakai service role key.
- MVP siap masuk tahap GitHub dan deploy Vercel setelah konfigurasi production siap.
# Adzani-Ecommers
