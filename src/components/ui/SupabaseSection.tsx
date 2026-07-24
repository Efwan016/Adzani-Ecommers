import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdminUser } from '../../lib/adminAccess';

export default function SupabaseSection() {
  const { user, isLoading } = useAuth();
  const canOpenAdmin = !isLoading && isAdminUser(user);

  return (
    <section className="w-full px-4 py-14 sm:px-6 lg:px-8">
      <div className="surface-card grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8 w-full">
        <div>
          <p className="eyebrow">{canOpenAdmin ? 'Operasional toko' : 'Katalog Adzani'}</p>

          <h2 className="section-title mt-3">
            {canOpenAdmin ? 'Produk bisa dirawat dari dashboard admin.' : 'Temukan produk elektronik dan voucher dengan cepat.'}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist">
            {canOpenAdmin
              ? 'Admin dapat membuat, mengubah, menghapus, dan mengatur status produk dari dashboard tanpa mengganggu pengalaman customer.'
              : 'Jelajahi katalog, simpan produk ke keranjang, lalu checkout langsung melalui WhatsApp.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
          <Link to="/products" className="btn-primary w-full text-center md:w-auto">
            Buka Katalog
          </Link>

          {canOpenAdmin && (
            <Link to="/admin" className="btn-secondary w-full text-center md:w-auto">
              Dashboard Admin
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
