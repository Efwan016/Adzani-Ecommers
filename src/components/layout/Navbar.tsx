import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import AuthButton from '../ui/AuthButton';

export default function Navbar() {
  const { getTotalItems } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-sage/30 bg-sage/12 text-sm font-black text-sage">
            AZ
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-[0.18em] text-porcelain uppercase">Adzani</span>
            <span className="block text-xs text-smoke">Electronic Store</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto text-sm text-mist sm:order-none sm:w-auto md:gap-3">
          <Link to="/" className="rounded-md px-3 py-2 hover:bg-white/7 hover:text-porcelain">Home</Link>
          <Link to="/products" className="rounded-md px-3 py-2 hover:bg-white/7 hover:text-porcelain">Produk</Link>
          <Link to="/admin" className="rounded-md px-3 py-2 hover:bg-white/7 hover:text-porcelain">Admin</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-porcelain hover:bg-white/10"
            aria-label="Buka keranjang"
          >
            Cart
            {getTotalItems > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-champagne px-1.5 py-0.5 text-[0.68rem] font-black text-ink">
                {getTotalItems}
              </span>
            )}
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
