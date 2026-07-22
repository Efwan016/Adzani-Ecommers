import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80"
        alt="Smartphone premium di meja display"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,21,19,0.94)_0%,rgba(15,21,19,0.78)_43%,rgba(15,21,19,0.38)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-ink to-transparent" />

      <div className="grid min-h-[72vh] md:grid-cols-2">
        <div className="flex items-center px-4 py-16 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Konter elektronik dan aksesoris</p>

            <h1 className="mt-4 text-5xl font-semibold leading-[0.98] text-porcelain sm:text-6xl lg:text-7xl">
              Adzani Store
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-mist sm:text-lg">
              Belanja elektronik, aksesoris HP, dan voucher lebih praktis. Pilih produk dari katalog, cek stok, lalu checkout ke WhatsApp admin.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary">
                Belanja Sekarang
              </Link>

              <Link to="/cart" className="btn-secondary">
                Lihat Cart
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-sm text-mist sm:grid-cols-3">
              <div className="surface-muted px-3 py-3">
                <p className="font-semibold text-porcelain">Katalog online</p>
                <p className="mt-1 text-xs text-smoke">Produk aktif siap dipilih</p>
              </div>

              <div className="surface-muted px-3 py-3">
                <p className="font-semibold text-porcelain">Checkout WhatsApp</p>
                <p className="mt-1 text-xs text-smoke">Order terkirim rapi ke admin</p>
              </div>

              <div className="surface-muted px-3 py-3">
                <p className="font-semibold text-porcelain">Stok jelas</p>
                <p className="mt-1 text-xs text-smoke">Qty dibatasi sesuai stok</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block" aria-hidden="true" />
      </div>
    </section>
  );
}
