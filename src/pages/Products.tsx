import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { formatCurrency } from '../lib/formatCurrency';

function getProductInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function getStockMeta(stock: number) {
  if (stock <= 0) {
    return {
      label: 'Stok habis',
      className: 'border-blush/30 bg-blush/12 text-blush',
    };
  }

  if (stock <= 3) {
    return {
      label: `Sisa ${stock}`,
      className: 'border-champagne/30 bg-champagne/12 text-champagne',
    };
  }

  return {
    label: 'Stok tersedia',
    className: 'border-sage/30 bg-sage/12 text-sage',
  };
}

export default function Products() {
  const { products, isLoading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((product) => product.category.trim()).filter(Boolean)));
    return ['Semua', ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
      const description = product.description ?? '';
      const matchesSearch = !query || product.name.toLowerCase().includes(query) || description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <section className="page-shell">
      <div className="surface-card mb-6 overflow-hidden">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:p-7 lg:p-8">
          <div>
            <p className="eyebrow">Katalog aktif</p>
            <h1 className="page-title">Produk Konter & Aksesoris HP</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist md:text-base">
              Temukan gadget, voucher, dan aksesoris yang siap dipesan. Semua produk di sini tersambung ke data aktif toko.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 self-end sm:grid-cols-3 md:grid-cols-1">
            <div className="surface-muted px-4 py-3">
              <p className="text-2xl font-semibold text-porcelain">{products.length}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Produk aktif</p>
            </div>
            <div className="surface-muted px-4 py-3">
              <p className="text-2xl font-semibold text-porcelain">{categories.length - 1}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Kategori</p>
            </div>
            <Link to="/cart" className="btn-secondary col-span-2 h-full text-center sm:col-span-1 md:col-span-1">
              Buka Cart
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-7 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Katalog</p>
          <h2 className="section-title">Pilih barang yang kamu butuhkan</h2>
        </div>
      </div>

      {isLoading && (
        <div className="state-panel">Memuat produk...</div>
      )}

      {error && (
        <div className="error-panel">{error}</div>
      )}

      {!isLoading && !error && (
        <div className="surface-card mb-6 space-y-4 p-4 md:p-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Cari produk</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Contoh: charger, voucher, headset"
              className="field-control min-h-12 text-base"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {categories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-sage text-ink shadow-lg shadow-sage/10'
                      : 'border border-white/10 bg-white/5 text-mist hover:bg-white/10'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="state-panel border-dashed p-10 text-center">
          Belum ada produk aktif untuk ditampilkan.
        </div>
      )}

      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 text-sm text-smoke sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan <span className="font-semibold text-mist">{filteredProducts.length}</span> produk
          </p>
          <p className="text-xs uppercase tracking-[0.14em]">Klik produk untuk lihat detail</p>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length === 0 && products.length > 0 && (
        <div className="state-panel border-dashed p-10 text-center">
          Tidak ada produk yang cocok dengan pencarian atau kategori yang dipilih.
        </div>
      )}

      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const stockMeta = getStockMeta(product.stock);
            const description = product.description || 'Detail produk akan dikonfirmasi oleh admin saat checkout.';

            return (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="surface-card group flex min-h-full flex-col overflow-hidden p-2 hover:-translate-y-1 hover:border-sage/35 hover:bg-white/8"
              >
                <div className="relative overflow-hidden rounded-md border border-white/10 bg-ink/70">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
                    />
                  ) : (
                    <div className="flex h-52 w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(166,216,194,0.16),rgba(226,196,130,0.08))] text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-lg border border-sage/30 bg-ink/60 text-lg font-black text-sage">
                        {getProductInitials(product.name) || 'AZ'}
                      </span>
                      <span className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Foto menyusul</span>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-ink/78 px-3 py-1 text-xs font-semibold text-mist backdrop-blur">
                    {product.category}
                  </div>

                  {product.stock <= 0 && (
                    <div className="absolute inset-x-3 bottom-3 rounded-md border border-blush/30 bg-ink/82 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-blush backdrop-blur">
                      Produk sedang habis
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-4 p-3">
                  <div>
                    <h3 className="line-clamp-2 text-xl font-semibold leading-snug text-porcelain">
                      {product.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-mist">{description}</p>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Harga</p>
                        <p className="mt-1 text-2xl font-semibold text-sage">{formatCurrency(product.price)}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${stockMeta.className}`}>
                        {stockMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                      <span className="text-smoke">Stok toko</span>
                      <span className={product.stock <= 0 ? 'font-semibold text-blush' : 'font-semibold text-mist'}>
                        {product.stock} item
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
