import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative isolate min-h-[72vh] overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80"
        alt="Smartphone premium di meja display"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,21,19,0.94)_0%,rgba(15,21,19,0.78)_43%,rgba(15,21,19,0.38)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-ink to-transparent" />

      <div className="mx-auto flex min-h-[72vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="eyebrow">Konter elektronik dan aksesoris</p>

          <h1 className="mt-4 text-5xl font-semibold leading-[0.98] text-porcelain sm:text-6xl lg:text-7xl">
            Adzani Store
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-mist sm:text-lg">
            Jelajahi katalog produk, masukkan item ke cart, lalu checkout cepat ke WhatsApp admin dengan format order otomatis.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="btn-primary">
              Lihat Produk
            </Link>

            <Link to="#features" className="btn-secondary">
              Alur Belanja
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-sm text-mist sm:grid-cols-3">
            <div className="surface-muted px-3 py-3">
              <p className="font-semibold text-porcelain">Katalog aktif</p>
              <p className="mt-1 text-xs text-smoke">Pilihan produk yang siap dipesan</p>
            </div>

            <div className="surface-muted px-3 py-3">
              <p className="font-semibold text-porcelain">Keranjang cepat</p>
              <p className="mt-1 text-xs text-smoke">Tambah produk tanpa login</p>
            </div>

            <div className="surface-muted px-3 py-3">
              <p className="font-semibold text-porcelain">Checkout WA</p>
              <p className="mt-1 text-xs text-smoke">Order langsung ke admin</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
