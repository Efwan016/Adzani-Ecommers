import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { formatCurrency } from '../lib/formatCurrency';
import type { Product } from '../types/types';
import { getOptimizedImageUrl } from '../services/productImageService';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'stock-high';

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price-low', label: 'Harga termurah' },
  { value: 'price-high', label: 'Harga termahal' },
  { value: 'stock-high', label: 'Stok terbanyak' },
];

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

function sortProducts(products: Product[], sortBy: SortOption) {
  return [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'stock-high') return b.stock - a.stock;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function ProductImageFallback({ name }: { name: string }) {
  return (
    <div className="flex h-52 w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(166,216,194,0.16),rgba(226,196,130,0.08))] text-center">
      <span className="grid h-14 w-14 place-items-center rounded-lg border border-sage/30 bg-ink/60 text-lg font-black text-sage">
        {getProductInitials(name) || 'AZ'}
      </span>
      <span className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Foto menyusul</span>
    </div>
  );
}

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="surface-card min-h-full overflow-hidden p-2">
          <div className="h-52 animate-pulse rounded-md border border-white/10 bg-white/7" />
          <div className="space-y-4 p-3">
            <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-white/7" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/7" />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-white/7" />
            </div>
            <div className="h-11 w-full animate-pulse rounded-md bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

import { RouteSeo, buildBreadcrumbJsonLd, absoluteUrl } from '../lib/seo';

const PRODUCTS_SEO = {
  title: 'Katalog Produk | Adzani Store',
  description:
    'Lihat katalog aktif Adzani Store: elektronik, aksesoris HP, voucher, dan layanan konter lain yang siap dipesan via WhatsApp.',
  ogTitle: 'Katalog Produk Adzani Store',
  ogDescription:
    'Temukan gadget dan aksesoris yang siap dipesan dari katalog Adzani Store dengan stok yang selalu ditandai.',
  canonical: absoluteUrl('/products'),
  jsonLd: buildBreadcrumbJsonLd([
    { name: 'Beranda', url: '/' },
    { name: 'Katalog', url: '/products' },
  ]),
};

export default function Products() {
  const { products, isLoading, error, loadProducts } = useProducts();
  const { items, addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [cartFeedback, setCartFeedback] = useState('');
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((product) => product.category.trim()).filter(Boolean)));
    return ['Semua', ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const nextProducts = products.filter((product) => {
      const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
      const description = product.description ?? '';
      const matchesSearch = !query || product.name.toLowerCase().includes(query) || description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    return sortProducts(nextProducts, sortBy);
  }, [products, searchQuery, selectedCategory, sortBy]);

  const cartQtyByProductId = useMemo(() => {
    return new Map(items.map((item) => [item.product.id, item.qty]));
  }, [items]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setSortBy('newest');
    setCartFeedback('');
  };

  const markImageAsBroken = (productId: string) => {
    setBrokenImageIds((current) => {
      if (current.has(productId)) return current;

      const next = new Set(current);
      next.add(productId);
      return next;
    });
  };

  const handleQuickAdd = (product: Product) => {
    const currentQty = cartQtyByProductId.get(product.id) ?? 0;
    const remainingStock = product.stock - currentQty;

    if (product.stock <= 0) {
      setCartFeedback(`${product.name} sedang stok habis.`);
      return;
    }

    if (remainingStock <= 0) {
      setCartFeedback(`${product.name} sudah mencapai batas stok di keranjang.`);
      return;
    }

    addToCart(product, 1);
    setCartFeedback(`${product.name} ditambahkan ke keranjang.`);
  };

  return (
    <section className="page-wide">
      <RouteSeo meta={PRODUCTS_SEO} />
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

      {isLoading && <ProductSkeletonGrid />}

      {error && (
        <div className="error-panel mb-6 p-5">
          <p className="text-lg font-semibold text-porcelain">Katalog belum bisa dimuat.</p>
          <p className="mt-2 text-sm leading-6 text-blush">
            {error}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={loadProducts} className="btn-primary">
              Coba Lagi
            </button>
            <Link to="/" className="btn-secondary text-center">
              Kembali ke Home
            </Link>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="surface-card mb-6 space-y-4 p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <label htmlFor="product-search" className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Cari produk</span>
              <input
                id="product-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Contoh: charger, voucher, headset"
                className="field-control min-h-12 text-base"
              />
            </label>

            <label htmlFor="product-sort" className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Urutkan</span>
              <select
                id="product-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="field-control min-h-12 text-base"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {categories.map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={isActive}
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

      {!isLoading && !error && cartFeedback && (
        <div className="mb-5 rounded-md border border-sage/30 bg-sage/10 px-4 py-3 text-sm font-semibold text-sage" role="status" aria-live="polite">
          {cartFeedback}
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="state-panel border-dashed p-10 text-center">
          <p className="text-lg font-semibold text-porcelain">Belum ada produk aktif.</p>
          <p className="mt-2 text-sm text-smoke">Produk yang aktif dari admin akan tampil di sini.</p>
          <button type="button" onClick={loadProducts} className="btn-secondary mt-5">
            Muat Ulang Katalog
          </button>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 text-sm text-smoke sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan <span className="font-semibold text-mist">{filteredProducts.length}</span> produk
          </p>
          <p className="text-xs uppercase tracking-[0.14em]">Klik foto atau nama produk untuk lihat detail</p>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length === 0 && products.length > 0 && (
        <div className="state-panel border-dashed p-8 text-center sm:p-10">
          <p className="text-lg font-semibold text-porcelain">Produk tidak ditemukan.</p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-smoke">
            Coba kata kunci lain, pilih kategori berbeda, atau reset filter untuk melihat semua produk aktif.
          </p>
          <button type="button" onClick={resetFilters} className="btn-secondary mt-5">
            Reset Filter
          </button>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const stockMeta = getStockMeta(product.stock);
            const description = product.description || 'Detail produk akan dikonfirmasi oleh admin saat checkout.';
            const cartQty = cartQtyByProductId.get(product.id) ?? 0;
            const remainingStock = product.stock - cartQty;
            const isOutOfStock = product.stock <= 0;
            const isAtCartLimit = product.stock > 0 && remainingStock <= 0;
            const canQuickAdd = product.stock > 0 && remainingStock > 0;
            const shouldShowImage = Boolean(product.image_url) && !brokenImageIds.has(product.id);

            return (
              <article
                key={product.id}
                className="surface-card group flex min-h-full flex-col overflow-hidden p-2 transition hover:-translate-y-1 hover:border-sage/35 hover:bg-white/8"
              >
                <Link to={`/products/${product.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-sage">
                  <div className="relative overflow-hidden rounded-md border border-white/10 bg-ink/70">
                    {shouldShowImage ? (
                      <img
                        src={(getOptimizedImageUrl(product.image_url ?? '', { width: 480, quality: 70 }) || product.image_url) ?? ''}
                        alt={product.name}
                        onError={() => markImageAsBroken(product.id)}
                        className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
                      />
                    ) : (
                      <ProductImageFallback name={product.name} />
                    )}

                    <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-ink/78 px-3 py-1 text-xs font-semibold text-mist backdrop-blur">
                      {product.category}
                    </div>

                    {isOutOfStock && (
                      <div className="absolute inset-x-3 bottom-3 rounded-md border border-blush/30 bg-ink/82 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-blush backdrop-blur">
                        Produk sedang habis
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col gap-4 p-3">
                  <div>
                    <Link to={`/products/${product.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-sage">
                      <h3 className="line-clamp-2 text-xl font-semibold leading-snug text-porcelain group-hover:text-sage">
                        {product.name}
                      </h3>
                    </Link>
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
                      <span className={isOutOfStock ? 'font-semibold text-blush' : 'font-semibold text-mist'}>
                        {product.stock} item
                      </span>
                    </div>

                    {cartQty > 0 && (
                      <p className="text-xs font-semibold text-smoke">
                        Di keranjang: <span className="text-mist">{cartQty}</span>
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product)}
                      disabled={!canQuickAdd}
                      aria-label={`Tambah ${product.name} ke keranjang`}
                      aria-describedby={!canQuickAdd ? `product-${product.id}-disabled-reason` : undefined}
                      className={`w-full rounded-md border px-4 py-3 text-sm font-bold transition ${
                        canQuickAdd
                          ? 'border-sage/30 bg-sage text-ink shadow-lg shadow-sage/10 hover:bg-[#b7e3d0]'
                          : 'cursor-not-allowed border-white/10 bg-white/5 text-smoke'
                      }`}
                    >
                      {isOutOfStock ? 'Stok Habis' : isAtCartLimit ? 'Stok Maksimal' : 'Tambah'}
                    </button>
                    {!canQuickAdd && (
                      <p id={`product-${product.id}-disabled-reason`} className="sr-only">
                        {isOutOfStock ? 'Produk sedang stok habis.' : 'Jumlah produk di keranjang sudah mencapai stok toko.'}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
