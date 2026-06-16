import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Katalog', href: '/products' },
  { label: 'Cart', href: '/cart' },
];

const categories = ['Elektronik', 'Aksesoris HP', 'Voucher', 'Layanan Konter'];

const trustItems = [
  'Stok dikonfirmasi admin',
  'Checkout cepat via WhatsApp',
  'Produk bisa berubah sesuai ketersediaan',
];

export default function Footer() {
  const whatsappNumber = (import.meta.env.VITE_WHATSAPP_ADMIN as string | undefined)?.trim();
  const whatsappHref = whatsappNumber ? `https://wa.me/6281218115660` : '/cart';

  return (
    <footer className="border-t border-white/10 bg-ink/92">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.85fr_1.1fr] lg:px-10">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-sage/30 bg-sage/12 text-sm font-black text-sage">
              AZ
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-[0.18em] text-porcelain uppercase">Adzani Store</span>
              <span className="block text-xs text-smoke">Electronic & Voucher</span>
            </span>
          </Link>

          <p className="mt-4 max-w-sm text-sm leading-7 text-mist">
            Toko elektronik, aksesoris HP, voucher, dan layanan konter dengan katalog online dan checkout cepat melalui WhatsApp.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-porcelain">Quick links</h2>
          <nav className="mt-4 flex flex-col items-start gap-3 text-sm text-mist" aria-label="Footer quick links">
            {quickLinks.map((item) => (
              <Link key={item.href} to={item.href} className="transition hover:text-sage">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-porcelain">Kategori</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-mist">
            {categories.map((category) => (
              <Link key={category} to="/products" className="transition hover:text-sage">
                {category}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-porcelain">Kontak & trust</h2>
          <p className="mt-4 text-sm leading-7 text-mist">
            Checkout diarahkan ke WhatsApp agar order bisa langsung dikonfirmasi admin.
          </p>

          {whatsappNumber ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-4 w-full text-center sm:w-fit"
            >
              Chat WhatsApp
            </a>
          ) : (
            <Link to={whatsappHref} className="btn-primary mt-4 w-full text-center sm:w-fit">
              Checkout dari Cart
            </Link>
          )}

          <div className="mt-5 grid gap-2">
            {trustItems.map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-smoke">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-smoke">
        © {new Date().getFullYear()} Adzani Store. Katalog dan stok mengikuti ketersediaan toko.
      </div>
    </footer>
  );
}
