import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatCurrency';
import { deleteOrder, getOrdersAdmin, updateOrderStatus } from '../../services/orderService';
import type { Order, OrderStatus } from '../../types/types';

type StatusFilter = 'all' | OrderStatus;

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const orderStatusOptions: OrderStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

const statusTone: Record<OrderStatus, string> = {
  pending: 'bg-champagne/12 text-champagne',
  confirmed: 'bg-sage/12 text-sage',
  completed: 'bg-porcelain/12 text-porcelain',
  cancelled: 'bg-blush/12 text-blush',
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getShortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function getCustomerLabel(order: Order) {
  return order.customer_name?.trim() || 'Customer WhatsApp';
}

function OrderItems({ order }: { order: Order }) {
  return (
    <div className="space-y-2">
      {order.items.map((item) => (
        <div key={`${order.id}-${item.product_id}`} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-porcelain">{item.name}</p>
              <p className="mt-1 text-xs text-smoke">{item.category}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-sage">{formatCurrency(item.subtotal)}</p>
          </div>
          <p className="mt-2 text-xs text-mist">
            {item.qty} x {formatCurrency(item.price)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      confirmed: orders.filter((order) => order.status === 'confirmed').length,
      completed: orders.filter((order) => order.status === 'completed').length,
    };
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getOrdersAdmin();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat order admin');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (order: Order, status: OrderStatus) => {
    if (order.status === status) return;

    setBusyOrderId(order.id);
    setError(null);
    setFeedbackMessage('');

    try {
      const updatedOrder = await updateOrderStatus(order.id, status);
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder,
        ),
      );
      setFeedbackMessage(`Order #${getShortOrderId(updatedOrder.id)} berhasil diubah ke ${updatedOrder.status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status order');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    const isConfirmed = window.confirm(`Hapus order #${getShortOrderId(order.id)}? Aksi ini tidak bisa dibatalkan.`);
    if (!isConfirmed) return;

    setDeletingOrderId(order.id);
    setError(null);
    setFeedbackMessage('');

    try {
      await deleteOrder(order.id);
      setOrders((currentOrders) => currentOrders.filter((currentOrder) => currentOrder.id !== order.id));
      setFeedbackMessage(`Order #${getShortOrderId(order.id)} berhasil dihapus.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus order');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const resetFilter = () => setStatusFilter('all');

  return (
    <section className="page-shell">
      <div className="surface-card mb-6 overflow-hidden">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-7 lg:p-8">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 className="page-title">Order WhatsApp</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist md:text-base">
              Pantau order yang dicatat dari checkout WhatsApp dan ubah status prosesnya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin" className="btn-secondary">Dashboard</Link>
            <Link to="/admin/products" className="btn-secondary">Produk</Link>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-muted px-4 py-4">
          <p className="text-3xl font-semibold text-porcelain">{stats.total}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Total order</p>
        </div>
        <div className="surface-muted px-4 py-4">
          <p className="text-3xl font-semibold text-champagne">{stats.pending}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Pending</p>
        </div>
        <div className="surface-muted px-4 py-4">
          <p className="text-3xl font-semibold text-sage">{stats.confirmed}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Confirmed</p>
        </div>
        <div className="surface-muted px-4 py-4">
          <p className="text-3xl font-semibold text-porcelain">{stats.completed}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Completed</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Daftar order</p>
          <h2 className="section-title">Order Terbaru</h2>
        </div>
        {!isLoading && orders.length > 0 && (
          <p className="text-sm text-smoke">
            Menampilkan <span className="font-semibold text-mist">{visibleOrders.length}</span> dari{' '}
            <span className="font-semibold text-mist">{orders.length}</span> order
          </p>
        )}
      </div>

      {isLoading && <div className="state-panel">Memuat order WhatsApp...</div>}

      {feedbackMessage && (
        <div className="mb-4 rounded-md border border-sage/30 bg-sage/10 p-4 text-sm font-semibold text-sage">
          {feedbackMessage}
        </div>
      )}

      {error && (
        <div className="error-panel mb-4">
          <p className="font-semibold text-porcelain">Aksi order gagal.</p>
          <p className="mt-1 text-sm">{error}</p>
          <button type="button" onClick={loadOrders} className="btn-secondary mt-4">
            Muat Ulang Order
          </button>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="surface-card mb-6 space-y-4 p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Filter status</span>
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

            <button
              type="button"
              onClick={resetFilter}
              disabled={statusFilter === 'all'}
              className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className="state-panel border-dashed p-10 text-center">
          <p className="text-xl font-semibold text-porcelain">Belum ada order.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-smoke">
            Order akan muncul setelah customer checkout WhatsApp dari halaman cart.
          </p>
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && visibleOrders.length === 0 && (
        <div className="state-panel border-dashed p-10 text-center">
          <p className="text-xl font-semibold text-porcelain">Tidak ada order dengan status ini.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-smoke">
            Ubah filter status untuk melihat order lainnya.
          </p>
          <button type="button" onClick={resetFilter} className="btn-secondary mt-5">
            Reset Filter
          </button>
        </div>
      )}

      {!isLoading && visibleOrders.length > 0 && (
        <>
          <div className="hidden surface-card overflow-hidden xl:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-mist">
                <thead className="bg-white/6 text-smoke">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => {
                    const isBusy = busyOrderId === order.id || deletingOrderId === order.id;

                    return (
                      <tr key={order.id} className="border-t border-white/10 align-top hover:bg-white/4">
                        <td className="min-w-44 px-4 py-4">
                          <p className="font-semibold text-porcelain">#{getShortOrderId(order.id)}</p>
                          <p className="mt-1 text-xs text-smoke">{formatDateTime(order.created_at)}</p>
                        </td>
                        <td className="min-w-56 px-4 py-4">
                          <p className="font-semibold text-porcelain">{getCustomerLabel(order)}</p>
                          {order.pickup_method && <p className="mt-1 text-xs text-sage">{order.pickup_method}</p>}
                          {order.customer_note && <p className="mt-2 max-w-xs text-xs leading-5 text-smoke">{order.customer_note}</p>}
                        </td>
                        <td className="min-w-80 px-4 py-4">
                          <OrderItems order={order} />
                        </td>
                        <td className="px-4 py-4 font-semibold text-sage">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-4">
                          <span className={`status-pill ${statusTone[order.status]}`}>{order.status}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="grid min-w-48 gap-2">
                            <select
                              value={order.status}
                              onChange={(event) => handleUpdateStatus(order, event.target.value as OrderStatus)}
                              disabled={isBusy}
                              className="field-control min-h-11 text-sm disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              {orderStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order)}
                              disabled={isBusy}
                              className="rounded-md border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingOrderId === order.id ? 'Menghapus...' : 'Hapus Order'}
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

          <div className="space-y-4 xl:hidden">
            {visibleOrders.map((order) => {
              const isBusy = busyOrderId === order.id || deletingOrderId === order.id;

              return (
                <article key={order.id} className="surface-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">#{getShortOrderId(order.id)}</p>
                      <h3 className="mt-1 text-xl font-semibold leading-snug text-porcelain">{getCustomerLabel(order)}</h3>
                      <p className="mt-1 text-xs text-smoke">{formatDateTime(order.created_at)}</p>
                    </div>
                    <span className={`status-pill w-fit ${statusTone[order.status]}`}>{order.status}</span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="surface-muted px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Total</p>
                      <p className="mt-1 font-semibold text-sage">{formatCurrency(order.total)}</p>
                    </div>
                    <div className="surface-muted px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Metode ambil</p>
                      <p className="mt-1 font-semibold text-porcelain">{order.pickup_method || '-'}</p>
                    </div>
                  </div>

                  {order.customer_note && (
                    <div className="mt-4 rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm leading-6 text-mist">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Catatan</p>
                      <p className="mt-2">{order.customer_note}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Items</p>
                    <OrderItems order={order} />
                  </div>

                  <div className="mt-4 grid gap-2">
                    <select
                      value={order.status}
                      onChange={(event) => handleUpdateStatus(order, event.target.value as OrderStatus)}
                      disabled={isBusy}
                      className="field-control min-h-12 text-base disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {orderStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order)}
                      disabled={isBusy}
                      className="rounded-md border border-red-400/35 bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingOrderId === order.id ? 'Menghapus...' : 'Hapus Order'}
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
