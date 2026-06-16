import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { deleteProduct, getAllProductsForAdmin, updateProductStatus } from '../../services/productService';
import type { Product } from '../../types/types';
import { formatCurrency } from '../../lib/formatCurrency';

type StatusFilter = 'all' | 'active' | 'inactive' | 'out-of-stock';
type SortOption = 'newest' | 'name-az' | 'price-low' | 'price-high' | 'stock-high';

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'out-of-stock', label: 'Stok Habis' },
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'name-az', label: 'Nama A-Z' },
  { value: 'price-low', label: 'Harga termurah' },
  { value: 'price-high', label: 'Harga termahal' },
  { value: 'stock-high', label: 'Stok terbanyak' },
];

function sortProducts(products: Product[], sortBy: SortOption) {
  return [...products].sort((a, b) => {
    if (sortBy === 'name-az') return a.name.localeCompare(b.name);
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'stock-high') return b.stock - a.stock;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function AdminProducts() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('Semua kategori');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const activeProducts = products.filter((product) => product.is_active).length;
  const inactiveProducts = products.length - activeProducts;
  const outOfStockProducts = products.filter((product) => product.stock <= 0).length;

  const stats = [
    { label: 'Total produk', value: products.length, tone: 'text-porcelain' },
    { label: 'Produk aktif', value: activeProducts, tone: 'text-sage' },
    { label: 'Nonaktif', value: inactiveProducts, tone: 'text-champagne' },
    { label: 'Stok habis', value: outOfStockProducts, tone: 'text-blush' },
  ];

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map((product) => product.category.trim()).filter(Boolean)));
    return ['Semua kategori', ...uniqueCategories];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filteredProducts = products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active) ||
        (statusFilter === 'out-of-stock' && product.stock <= 0);

      const matchesCategory = categoryFilter === 'Semua kategori' || product.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return sortProducts(filteredProducts, sortBy);
  }, [categoryFilter, products, searchQuery, sortBy, statusFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'Semua kategori' ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('Semua kategori');
    setSortBy('newest');
  };

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllProductsForAdmin();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat produk admin');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const state = location.state as { feedback?: string } | null;
    if (!state?.feedback) return;

    setFeedbackMessage(state.feedback);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleToggleStatus = async (product: Product) => {
    setUpdatingProductId(product.id);
    setError(null);
    setFeedbackMessage('');

    try {
      const updatedProduct = await updateProductStatus(product.id, !product.is_active);
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct,
        ),
      );
      setFeedbackMessage(`${updatedProduct.name} berhasil ${updatedProduct.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status produk');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const isConfirmed = window.confirm('Yakin ingin menghapus produk ini? Aksi ini tidak bisa dibatalkan.');

    if (!isConfirmed) {
      return;
    }

    setDeletingProductId(product.id);
    setError(null);
    setFeedbackMessage('');

    try {
      await deleteProduct(product.id);
      setProducts((currentProducts) =>
        currentProducts.filter((currentProduct) => currentProduct.id !== product.id),
      );
      setFeedbackMessage(`${product.name} berhasil dihapus.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus produk');
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <section className="page-shell">
      <div className="surface-card mb-6 overflow-hidden">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-7 lg:p-8">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 className="page-title">Manajemen Produk</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist md:text-base">
              Kelola produk yang tampil di katalog customer, termasuk status aktif, stok, harga, dan data produk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin" className="btn-secondary">Dashboard</Link>
            <Link to="/products" className="btn-secondary">Lihat Katalog</Link>
            <Link to="/admin/products/new" className="btn-primary">Tambah Produk</Link>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-muted px-4 py-4">
            <p className={`text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Inventori</p>
          <h2 className="section-title">Daftar Produk</h2>
        </div>
        {!isLoading && products.length > 0 && (
          <p className="text-sm text-smoke">
            Menampilkan <span className="font-semibold text-mist">{visibleProducts.length}</span> dari{' '}
            <span className="font-semibold text-mist">{products.length}</span> produk
          </p>
        )}
      </div>

      {isLoading && <div className="state-panel">Memuat produk admin...</div>}

      {feedbackMessage && (
        <div className="mb-4 rounded-md border border-sage/30 bg-sage/10 p-4 text-sm font-semibold text-sage">
          {feedbackMessage}
        </div>
      )}

      {error && (
        <div className="error-panel mb-4">
          <p className="font-semibold text-porcelain">Aksi admin gagal.</p>
          <p className="mt-1 text-sm">{error}</p>
          <button type="button" onClick={loadProducts} className="btn-secondary mt-4">
            Muat Ulang Produk
          </button>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="surface-card mb-6 space-y-4 p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_14rem_13rem]">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Cari produk</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama atau slug produk"
                className="field-control min-h-12 text-base"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="field-control min-h-12 text-base"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Kategori</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="field-control min-h-12 text-base"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Urutkan</span>
              <select
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

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-smoke sm:flex-row sm:items-center sm:justify-between">
            <p>
              Hasil tampil: <span className="font-semibold text-mist">{visibleProducts.length}</span> produk
            </p>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="state-panel border-dashed p-10 text-center">
          <p className="text-xl font-semibold text-porcelain">Belum ada produk untuk ditampilkan.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-smoke">
            Buat produk pertama agar katalog customer mulai terisi.
          </p>
          <Link to="/admin/products/new" className="btn-primary mt-5">
            Tambah Produk
          </Link>
        </div>
      )}

      {!isLoading && !error && products.length > 0 && visibleProducts.length === 0 && (
        <div className="state-panel border-dashed p-10 text-center">
          <p className="text-xl font-semibold text-porcelain">Tidak ada produk yang cocok.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-smoke">
            Coba kata kunci lain, ubah status/kategori, atau reset filter untuk melihat semua produk.
          </p>
          <button type="button" onClick={resetFilters} className="btn-secondary mt-5">
            Reset Filter
          </button>
        </div>
      )}

      {!isLoading && products.length > 0 && visibleProducts.length > 0 && (
        <>
        <div className="hidden surface-card overflow-hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-mist">
              <thead className="bg-white/6 text-smoke">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => {
                  const isUpdating = updatingProductId === product.id;
                  const isDeleting = deletingProductId === product.id;
                  const isRowBusy = isUpdating || isDeleting;

                  return (
                    <tr key={product.id} className="border-t border-white/10 align-middle hover:bg-white/4">
                      <td className="min-w-64 px-4 py-4">
                        <div className="font-semibold text-porcelain">{product.name}</div>
                        <div className="text-xs text-smoke">{product.slug}</div>
                      </td>
                      <td className="px-4 py-4">{product.category}</td>
                      <td className="px-4 py-4 font-semibold text-sage">{formatCurrency(product.price)}</td>
                      <td className={`px-4 py-4 font-semibold ${product.stock <= 0 ? 'text-blush' : 'text-mist'}`}>
                        {product.stock}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`status-pill ${product.is_active ? 'bg-sage/12 text-sage' : 'bg-blush/12 text-blush'}`}>
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-72 flex-wrap justify-end gap-2">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            aria-disabled={isRowBusy}
                            className={`rounded-md border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-porcelain hover:bg-white/10 ${
                              isRowBusy ? 'pointer-events-none opacity-55' : ''
                            }`}
                          >
                            {isRowBusy ? 'Tunggu...' : 'Edit'}
                          </Link>
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => handleToggleStatus(product)}
                            className={`rounded-md border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                              product.is_active
                                ? 'border-blush/30 bg-blush/10 text-blush hover:bg-blush/16'
                                : 'border-sage/30 bg-sage/10 text-sage hover:bg-sage/16'
                            }`}
                          >
                            {isUpdating
                              ? 'Memproses...'
                              : product.is_active
                                ? 'Nonaktifkan'
                                : 'Aktifkan'}
                          </button>
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => handleDeleteProduct(product)}
                            className="rounded-md border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 md:hidden">
          {visibleProducts.map((product) => {
            const isUpdating = updatingProductId === product.id;
            const isDeleting = deletingProductId === product.id;
            const isRowBusy = isUpdating || isDeleting;

            return (
              <article key={product.id} className="surface-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">{product.category}</p>
                    <h3 className="mt-1 text-xl font-semibold leading-snug text-porcelain">{product.name}</h3>
                    <p className="mt-1 text-xs text-smoke">{product.slug}</p>
                  </div>
                  <span className={`status-pill ${product.is_active ? 'bg-sage/12 text-sage' : 'bg-blush/12 text-blush'}`}>
                    {product.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="surface-muted px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Harga</p>
                    <p className="mt-1 font-semibold text-sage">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="surface-muted px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Stok</p>
                    <p className={`mt-1 font-semibold ${product.stock <= 0 ? 'text-blush' : 'text-porcelain'}`}>
                      {product.stock} item
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  <Link
                    to={`/admin/products/${product.id}/edit`}
                    aria-disabled={isRowBusy}
                    className={`btn-secondary w-full py-3 ${isRowBusy ? 'pointer-events-none opacity-55' : ''}`}
                  >
                    Edit Produk
                  </Link>
                  <button
                    type="button"
                    disabled={isRowBusy}
                    onClick={() => handleToggleStatus(product)}
                    className={`rounded-md border px-3 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                      product.is_active
                        ? 'border-blush/30 bg-blush/10 text-blush hover:bg-blush/16'
                        : 'border-sage/30 bg-sage/10 text-sage hover:bg-sage/16'
                    }`}
                  >
                    {isUpdating
                      ? 'Memproses...'
                      : product.is_active
                        ? 'Nonaktifkan Produk'
                        : 'Aktifkan Produk'}
                  </button>
                  <button
                    type="button"
                    disabled={isRowBusy}
                    onClick={() => handleDeleteProduct(product)}
                    className="rounded-md border border-red-400/35 bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? 'Menghapus...' : 'Hapus Produk'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        </>
      )}
    </section>
  );
}
