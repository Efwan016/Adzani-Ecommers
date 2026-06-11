import { Link } from 'react-router-dom'

const highlights = [
  {
    title: 'Cari produk',
    copy: 'Customer bisa filter kategori dan cari barang yang dibutuhkan.',
  },
  {
    title: 'Masuk keranjang',
    copy: 'Jumlah item dijaga sesuai stok agar order tetap realistis.',
  },
  {
    title: 'Konfirmasi admin',
    copy: 'Checkout membuka WhatsApp dengan detail order yang sudah rapi.',
  },
]

export default function FeatureSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Alur belanja</p>

          <h2 className="section-title mt-3">
            Dari katalog ke WhatsApp tanpa langkah yang berlebihan.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-mist">
            Customer memilih produk, memasukkannya ke keranjang, lalu checkout ke WhatsApp admin dengan format order otomatis.
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

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="surface-card p-5">
              <h3 className="text-lg font-semibold text-porcelain">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-mist">{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}