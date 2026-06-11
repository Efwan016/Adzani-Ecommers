import { Link } from 'react-router-dom';

const categories = [
  {
    title: 'Smartphone',
    copy: 'Unit pilihan untuk kebutuhan harian, kerja, dan hiburan.',
    href: '/products',
  },
  {
    title: 'Aksesoris HP',
    copy: 'Case, charger, kabel, headset, dan pelengkap gadget.',
    href: '/products',
  },
  {
    title: 'Voucher',
    copy: 'Pulsa, paket data, dan kebutuhan digital cepat.',
    href: '/products',
  },
  {
    title: 'Layanan Konter',
    copy: 'Bantuan pembelian, rekomendasi, dan konfirmasi stok.',
    href: '/products',
  },
];

export default function ProductGrid() {
  return (
    <section id="products" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Pilihan katalog</p>
          <h2 className="section-title mt-3">Kategori produk Adzani</h2>
        </div>

        <div className="max-w-xl">
          <p className="text-sm leading-7 text-mist">
            Section ini hanya shortcut kategori. Produk asli tampil di halaman katalog dari data Supabase yang aktif.
          </p>

          <Link to="/products" className="mt-4 inline-flex text-sm font-semibold text-sage hover:text-porcelain">
            Buka semua produk
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((item, index) => (
          <Link
            key={item.title}
            to={item.href}
            className="surface-card block p-5 transition hover:-translate-y-1 hover:border-sage/35 hover:bg-white/8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">
              0{index + 1}
            </p>

            <h3 className="mt-5 text-xl font-semibold text-porcelain">
              {item.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-mist">
              {item.copy}
            </p>

            <p className="mt-5 text-sm font-semibold text-sage">
              Lihat katalog
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
