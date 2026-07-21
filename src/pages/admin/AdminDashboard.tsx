import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../lib/formatCurrency';
import {
  ORDER_STATUS,
  ORDER_STATUS_TONES,
  countOrdersByStatus,
  formatOrderDateTime,
  getCustomerLabel,
  getShortOrderId,
} from '../../lib/orderStatus';
import { formatPhoneDisplay } from '../../lib/phone';
import { getOrdersAdmin } from '../../services/orderService';
import { getAllProductsForAdmin } from '../../services/productService';
import type { Order, OrderStatus, Product } from '../../types/types';
import { RouteSeo } from '../../lib/seo';

const ADMIN_DASHBOARD_SEO = {
  title: 'Admin Dashboard | Adzani Store',
  description: 'Ringkasan produk, stok, dan order WhatsApp untuk operasional toko Adzani Store.',
  noIndex: true,
};

const shortcuts = [
  {
    title: 'Manajemen Produk',
    copy: 'Lihat, edit, atur status, dan hapus produk toko.',
    href: '/admin/products',
    tone: 'text-sage',
  },
  {
    title: 'Tambah Produk',
    copy: 'Buat item baru untuk masuk ke katalog customer.',
    href: '/admin/products/new',
    tone: 'text-porcelain',
  },
  {
    title: 'Order WhatsApp',
    copy: 'Lihat order masuk dan ubah status prosesnya.',
    href: '/admin/orders',
    tone: 'text-champagne',
  },
  {
    title: 'Lihat Katalog',
    copy: 'Cek tampilan produk dari sisi customer.',
    href: '/products',
    tone: 'text-mist',
  },
  {
    title: 'Kembali ke Website',
    copy: 'Buka halaman depan Adzani Store.',
    href: '/',
    tone: 'text-mist',
  },
];

function getCustomerPhoneDisplay(order: Order) {
  return formatPhoneDisplay(order.customer_phone);
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-pill ${ORDER_STATUS_TONES[status]}`}>{status}</span>;
}

function StockSyncBadge({ order }: { order: Order }) {
  if (order.stock_restored) {
    return (
      <span className="inline-flex w-fit rounded-full border border-blush/30 bg-blush/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-blush">
        Stok restore
      </span>
    );
  }

  return (
    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${
      order.stock_deducted
        ? 'border-sage/30 bg-sage/10 text-sage'
        : 'border-champagne/30 bg-champagne/10 text-champagne'
    }`}
    >
      {order.stock_deducted ? 'Stok sync' : 'Stok belum sync'}
    </span>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const activeProducts = products.filter((product) => product.is_active).length;
  const inactiveProducts = products.length - activeProducts;
  const outOfStockProducts = products.filter((product) => product.stock <= 0).length;
  const totalOrderNominal = orders.reduce((sum, order) => sum + order.total, 0);
  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: 'Total produk', value: products.length, tone: 'text-porcelain' },
    { label: 'Produk aktif', value: activeProducts, tone: 'text-sage' },
    { label: 'Nonaktif', value: inactiveProducts, tone: 'text-champagne' },
    { label: 'Stok habis', value: outOfStockProducts, tone: 'text-blush' },
  ];

  const orderStats = [
    { label: 'Total orders', value: orders.length, tone: 'text-porcelain' },
    { label: 'Pending orders', value: countOrdersByStatus(orders, ORDER_STATUS.pending), tone: 'text-champagne' },
    { label: 'Confirmed orders', value: countOrdersByStatus(orders, ORDER_STATUS.confirmed), tone: 'text-sage' },
    { label: 'Completed orders', value: countOrdersByStatus(orders, ORDER_STATUS.completed), tone: 'text-porcelain' },
    { label: 'Cancelled orders', value: countOrdersByStatus(orders, ORDER_STATUS.cancelled), tone: 'text-blush' },
    { label: 'Total nominal order', value: formatCurrency(totalOrderNominal), tone: 'text-sage' },
  ];

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllProductsForAdmin();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan produk');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    setOrdersError(null);

    try {
      const data = await getOrdersAdmin();
      setOrders(data);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Gagal memuat ringkasan order');
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (logoutError) {
      console.error(logoutError);
    }
  };

  return (
    <section className="page-shell">
      <RouteSeo meta={ADMIN_DASHBOARD_SEO} />
      <div className="surface-card mb-6 overflow-hidden">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-start md:p-7 lg:p-8">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1 className="page-title">Pusat Kontrol Adzani Store</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist md:text-base">
              Pantau ringkasan produk, order WhatsApp terbaru, dan akses operasional toko dari satu halaman.
            </p>
          </div>

          <button type="button" onClick={handleLogout} className="btn-danger w-full md:w-auto">
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="surface-card p-5 md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Ringkasan produk</p>
                <h2 className="mt-2 text-2xl font-semibold text-porcelain">Status Inventori</h2>
              </div>
              {isLoading && <p className="text-sm text-smoke">Memuat ringkasan...</p>}
            </div>

            {error && (
              <div className="error-panel mt-4 text-sm">
                <p className="font-semibold text-porcelain">Ringkasan belum bisa dimuat.</p>
                <p className="mt-1">{error}</p>
                <button type="button" onClick={loadProducts} className="btn-secondary mt-4">
                  Coba Lagi
                </button>
              </div>
            )}

            {!error && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="surface-muted px-4 py-4">
                    <p className={`text-3xl font-semibold ${stat.tone}`}>
                      {isLoading ? '-' : stat.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && products.length === 0 && (
              <div className="state-panel mt-5 border-dashed text-center">
                <p className="text-lg font-semibold text-porcelain">Belum ada produk.</p>
                <p className="mt-2 text-sm text-smoke">Mulai isi katalog dengan membuat produk pertama.</p>
                <Link to="/admin/products/new" className="btn-primary mt-5">
                  Tambah Produk
                </Link>
              </div>
            )}
          </div>

          <div className="surface-card p-5 md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Ringkasan order</p>
                <h2 className="mt-2 text-2xl font-semibold text-porcelain">Order WhatsApp</h2>
              </div>
              {isOrdersLoading && <p className="text-sm text-smoke">Memuat order...</p>}
            </div>

            {ordersError && (
              <div className="error-panel mt-4 text-sm">
                <p className="font-semibold text-porcelain">Ringkasan order belum bisa dimuat.</p>
                <p className="mt-1">{ordersError}</p>
                <button type="button" onClick={loadOrders} className="btn-secondary mt-4">
                  Coba Lagi
                </button>
              </div>
            )}

            {!ordersError && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {orderStats.map((stat) => (
                  <div key={stat.label} className="surface-muted px-4 py-4">
                    <p className={`text-3xl font-semibold ${stat.tone}`}>
                      {isOrdersLoading ? '-' : stat.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Order terbaru</p>
                <h2 className="mt-2 text-2xl font-semibold text-porcelain">Masuk dari WhatsApp</h2>
              </div>
              <Link to="/admin/orders" className="btn-secondary w-full sm:w-auto">
                Lihat Semua
              </Link>
            </div>

            {isOrdersLoading && <div className="state-panel text-sm">Memuat order terbaru...</div>}

            {!isOrdersLoading && ordersError && (
              <div className="error-panel text-sm">
                <p className="font-semibold text-porcelain">Order terbaru belum bisa dimuat.</p>
                <p className="mt-1">{ordersError}</p>
                <button type="button" onClick={loadOrders} className="btn-secondary mt-4">
                  Coba Lagi
                </button>
              </div>
            )}

            {!isOrdersLoading && !ordersError && orders.length === 0 && (
              <div className="state-panel border-dashed text-center">
                <p className="text-lg font-semibold text-porcelain">Belum ada order WhatsApp.</p>
                <p className="mt-2 text-sm text-smoke">Order akan muncul setelah customer checkout dari cart.</p>
                <Link to="/admin/orders" className="btn-primary mt-5">
                  Buka Halaman Orders
                </Link>
              </div>
            )}

            {!isOrdersLoading && !ordersError && recentOrders.length > 0 && (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to="/admin/orders"
                    className="surface-muted grid gap-3 p-4 hover:border-sage/35 hover:bg-white/8 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-porcelain">#{getShortOrderId(order.id)}</p>
                        <StatusBadge status={order.status} />
                        <StockSyncBadge order={order} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-mist">{getCustomerLabel(order)}</p>
                      {getCustomerPhoneDisplay(order) && (
                        <p className="mt-1 break-all text-xs font-semibold text-smoke">{getCustomerPhoneDisplay(order)}</p>
                      )}
                      <p className="mt-1 text-xs text-smoke">{formatOrderDateTime(order.created_at)}</p>
                    </div>
                    <p className="text-lg font-semibold text-sage">{formatCurrency(order.total)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card p-5 md:p-6">
            <div className="mb-5">
              <p className="eyebrow">Shortcut</p>
              <h2 className="mt-2 text-2xl font-semibold text-porcelain">Aksi Cepat</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {shortcuts.map((shortcut) => (
                <Link
                  key={shortcut.href}
                  to={shortcut.href}
                  className="surface-muted block p-5 hover:border-sage/35 hover:bg-white/8"
                >
                  <p className={`text-sm font-semibold ${shortcut.tone}`}>{shortcut.title}</p>
                  <p className="mt-2 text-sm leading-6 text-mist">{shortcut.copy}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="surface-card p-5">
            <p className="eyebrow">Sesi admin</p>
            <h2 className="mt-2 text-xl font-semibold text-porcelain">Login aktif</h2>

            {user ? (
              <div className="surface-muted mt-4 p-4 text-sm text-mist">
                <p className="text-smoke">Email admin</p>
                <p className="mt-1 break-all font-semibold text-porcelain">{user.email ?? 'Tidak tersedia'}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-mist">Data user tidak tersedia.</p>
            )}
          </div>

          <div className="surface-card p-5">
            <p className="eyebrow">Catatan operasional</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-mist">
              <p>Produk aktif tampil di katalog customer.</p>
              <p>Produk nonaktif tetap bisa dikelola dari admin.</p>
              <p>Stok habis sebaiknya dinonaktifkan atau diperbarui sebelum promosi.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
