import { Link } from 'react-router-dom';

export default function SupabaseSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
      <div className="surface-card grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div>
          <p className="eyebrow">Operasional toko</p>

          <h2 className="section-title mt-3">
            Produk bisa dirawat dari dashboard admin.
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist">
            Admin dapat membuat, mengubah, menghapus, dan mengatur status produk dari dashboard tanpa mengganggu pengalaman customer.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
          <Link to="/products" className="btn-primary w-full text-center md:w-auto">
            Buka Katalog
          </Link>

          <Link to="/admin" className="btn-secondary w-full text-center md:w-auto">
            Dashboard Admin
          </Link>
        </div>
      </div>
    </section>
  );
}
