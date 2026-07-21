import { Link } from 'react-router-dom';
import { RouteSeo } from '../lib/seo';

const NOT_FOUND_SEO = {
  title: 'Halaman Tidak Ditemukan | Adzani Store',
  description: 'Halaman yang kamu buka tidak tersedia. Kembali ke Home atau buka katalog Adzani Store untuk melanjutkan belanja.',
  noIndex: true,
};

export default function NotFound() {
  return (
    <section className="narrow-shell flex items-center" aria-labelledby="not-found-title">
      <RouteSeo meta={NOT_FOUND_SEO} />
      <div className="surface-card w-full p-6 text-center sm:p-8">
        <p className="eyebrow">404</p>
        <h1 id="not-found-title" className="mt-3 text-3xl font-semibold tracking-tight text-porcelain sm:text-4xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-mist sm:text-base">
          Link yang kamu buka tidak tersedia atau sudah berubah. Silakan kembali ke halaman utama atau lihat katalog produk.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary w-full text-center sm:w-auto" aria-label="Kembali ke halaman Home">
            Home
          </Link>
          <Link to="/products" className="btn-secondary w-full text-center sm:w-auto" aria-label="Buka halaman Produk">
            Produk
          </Link>
        </div>
      </div>
    </section>
  );
}
