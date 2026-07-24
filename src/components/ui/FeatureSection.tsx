import { Link } from 'react-router-dom'

const highlights = [
  {
    title: 'Pilih produk',
    copy: 'Cari barang dari katalog aktif, filter kategori, dan buka detail produk.',
  },
  {
    title: 'Masukkan cart',
    copy: 'Tambahkan produk dan atur qty dengan batas sesuai stok toko.',
  },
  {
    title: 'Checkout WhatsApp',
    copy: 'Kirim format order otomatis ke WhatsApp admin dari halaman cart.',
  },
  {
    title: 'Admin konfirmasi',
    copy: 'Admin memastikan stok, harga akhir, dan kelanjutan transaksi.',
  },
]

export default function FeatureSection() {
  return (
    <section className="w-full px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] w-full">
        <div>
          <p className="eyebrow">Alur belanja</p>

          <h2 className="section-title mt-3">Alur belanja singkat dan jelas.</h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-mist">
            Dari halaman utama, customer bisa langsung menuju katalog, simpan item ke cart, lalu menyelesaikan order lewat WhatsApp.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/products" className="btn-primary">
              Mulai Belanja
            </Link>

            <Link to="/cart" className="btn-secondary">
              Lihat Keranjang
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 card-3d-wrapper">
          {highlights.map((item, index) => (
            <article key={item.title} className="surface-card p-5 card-3d">
              <div className="card-3d-content">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">0{index + 1}</p>
                <h3 className="text-lg font-semibold text-porcelain">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-mist">{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
