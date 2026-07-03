import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { isAdminUser } from '../../lib/adminAccess';
import AuthButton from '../ui/AuthButton';

type NavItem = {
  label: string;
  to: string;
};

function getNavLinkClass(isActive: boolean) {
  return `rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-sage/14 text-sage'
      : 'text-mist hover:bg-white/7 hover:text-porcelain'
  }`;
}

function CartLink({ totalItems, onClick, isMobile = false }: { totalItems: number; onClick?: () => void; isMobile?: boolean }) {
  return (
    <NavLink
      to="/cart"
      onClick={onClick}
      aria-label={`Buka keranjang${totalItems > 0 ? `, ${totalItems} item` : ''}`}
      className={({ isActive }) =>
        `relative inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition ${
          isMobile ? 'w-full justify-between' : ''
        } ${
          isActive
            ? 'border-sage/35 bg-sage/14 text-sage'
            : 'border-white/10 bg-white/6 text-porcelain hover:bg-white/10'
        }`
      }
    >
      <span>Cart</span>
      {totalItems > 0 && (
        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-champagne px-1.5 py-0.5 text-[0.68rem] font-black text-ink">
          {totalItems}
        </span>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const { getTotalItems } = useCart();
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canOpenAdmin = !isLoading && isAdminUser(user);

  const navItems: NavItem[] = [
    { label: 'Home', to: '/' },
    { label: 'Katalog', to: '/products' },
    ...(canOpenAdmin ? [
      { label: 'Admin', to: '/admin' },
      { label: 'Orders', to: '/admin/orders' },
    ] : []),
  ];

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/86 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2">
          <Link to="/" onClick={closeMenu} className="group flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-sage/30 bg-sage/12 text-sm font-black text-sage">
              AZ
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold tracking-[0.18em] text-porcelain uppercase">Adzani Store</span>
              <span className="block truncate text-xs text-smoke">Electronic & Voucher</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <CartLink totalItems={getTotalItems} />
            <AuthButton />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <CartLink totalItems={getTotalItems} />
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label={isMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/6 text-porcelain transition hover:bg-white/10"
            >
              <span className="flex h-4 w-5 flex-col justify-between" aria-hidden="true">
                <span className={`h-0.5 rounded-full bg-current transition ${isMenuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
                <span className={`h-0.5 rounded-full bg-current transition ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 rounded-full bg-current transition ${isMenuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div id="mobile-navigation" className="pb-3 md:hidden">
            <nav className="surface-card space-y-2 p-3" aria-label="Navigasi mobile">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeMenu}
                  className={({ isActive }) => `${getNavLinkClass(isActive)} flex w-full items-center justify-between`}
                >
                  {item.label}
                </NavLink>
              ))}

              <CartLink totalItems={getTotalItems} onClick={closeMenu} isMobile />

              <div className="border-t border-white/10 pt-3">
                <AuthButton fullWidth onActionComplete={closeMenu} />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
