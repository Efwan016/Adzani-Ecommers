import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteProduct, getAllProductsForAdmin, updateProductStatus } from '../../services/productService';
import type { Product } from '../../types/types';
import { formatCurrency } from '../../lib/formatCurrency';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProducts = products.filter((product) => product.is_active).length;
  const inactiveProducts = products.length - activeProducts;
  const outOfStockProducts = products.filter((product) => product.stock <= 0).length;

  const stats = [
    { label: 'Total produk', value: products.length, tone: 'text-porcelain' },
    { label: 'Produk aktif', value: activeProducts, tone: 'text-sage' },
    { label: 'Nonaktif', value: inactiveProducts, tone: 'text-champagne' },
    { label: 'Stok habis', value: outOfStockProducts, tone: 'text-blush' },
  ];

  useEffect(() => {
    const loadProducts = async () => {
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
    };

    loadProducts();
  }, []);

  const handleToggleStatus = async (product: Product) => {
    setUpdatingProductId(product.id);
    setError(null);

    try {
      const updatedProduct = await updateProductStatus(product.id, !product.is_active);
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct,
        ),
      );
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

    try {
      await deleteProduct(product.id);
      setProducts((currentProducts) =>
        currentProducts.filter((currentProduct) => currentProduct.id !== product.id),
      );
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
          <p className="text-sm text-smoke">Menampilkan {products.length} produk admin</p>
        )}
      </div>

      {isLoading && <div className="state-panel">Memuat produk admin...</div>}

      {error && <div className="error-panel mb-4">{error}</div>}

      {!isLoading && !error && products.length === 0 && (
        <div className="state-panel border-dashed p-10 text-center">Belum ada produk untuk ditampilkan.</div>
      )}

      {!isLoading && products.length > 0 && (
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
                {products.map((product) => {
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
                            Edit
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
          {products.map((product) => {
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
