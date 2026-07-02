import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatCurrency';
import {
  ORDER_STATUS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  countOrdersByStatus,
  formatOrderDateTime,
  getCustomerLabel,
  getShortOrderId,
} from '../../lib/orderStatus';
import { formatPhoneDisplay, getWhatsAppChatUrl, normalizeIndonesianPhone } from '../../lib/phone';
import { deleteOrder, getOrdersAdmin, getOrderStatusLogs, updateOrderStatus } from '../../services/orderService';
import { supabase } from '../../services/supabaseClient';
import type { Order, OrderStatus, OrderStatusLog } from '../../types/types';

type StatusFilter = 'all' | OrderStatus;
type RealtimeStatus = 'connecting' | 'active' | 'unavailable';

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  ...ORDER_STATUSES.map((status) => ({ value: status, label: ORDER_STATUS_LABELS[status] })),
];

function getAllowedStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
  if (currentStatus === ORDER_STATUS.pending) {
    return [ORDER_STATUS.confirmed, ORDER_STATUS.cancelled, ORDER_STATUS.completed];
  }

  if (currentStatus === ORDER_STATUS.confirmed) {
    return [ORDER_STATUS.completed, ORDER_STATUS.cancelled];
  }

  if (currentStatus === ORDER_STATUS.completed) {
    return [ORDER_STATUS.cancelled];
  }

  return [ORDER_STATUS.confirmed];
}

function getStatusSelectOptions(currentStatus: OrderStatus): OrderStatus[] {
  return [currentStatus, ...getAllowedStatusTransitions(currentStatus)];
}

function getStatusWarning(status: OrderStatus) {
  if (status === ORDER_STATUS.completed) {
    return 'Order selesai. Cancel akan mengembalikan stok jika sebelumnya sudah dikurangi.';
  }

  if (status === ORDER_STATUS.cancelled) {
    return 'Order dibatalkan. Confirm ulang akan mengurangi stok lagi jika stok tersedia.';
  }

  return '';
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-pill ${ORDER_STATUS_TONES[status]}`}>{status}</span>;
}

function StockSyncBadge({ order }: { order: Order }) {
  if (order.stock_restored) {
    return (
      <span className="inline-flex w-fit rounded-full border border-blush/30 bg-blush/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-blush">
        Stok dikembalikan
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
      {order.stock_deducted ? 'Stok sudah dikurangi' : 'Stok belum dikurangi'}
    </span>
  );
}

function getCustomerPhoneDisplay(order: Order) {
  return formatPhoneDisplay(order.customer_phone);
}

function getOrderActionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal mengubah status order';

  if (message.toLowerCase().includes('stok tidak cukup')) {
    return `Stok produk tidak cukup. ${message}`;
  }

  return message;
}

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function getLocalDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getItemsSummary(order: Order) {
  return order.items
    .map((item) => `${item.name} x${item.qty} @${item.price}`)
    .join('; ');
}

function buildOrdersCsv(ordersToExport: Order[]) {
  const headers = [
    'order_id',
    'order_id_short',
    'customer_name',
    'customer_phone',
    'pickup_method',
    'customer_note',
    'status',
    'total',
    'stock_deducted',
    'stock_deducted_at',
    'stock_restored',
    'stock_restored_at',
    'items_summary',
    'created_at',
    'updated_at',
  ];

  const rows = ordersToExport.map((order) => [
    order.id,
    getShortOrderId(order.id),
    order.customer_name,
    normalizeIndonesianPhone(order.customer_phone),
    order.pickup_method,
    order.customer_note,
    order.status,
    order.total,
    Boolean(order.stock_deducted),
    order.stock_deducted_at,
    Boolean(order.stock_restored),
    order.stock_restored_at,
    getItemsSummary(order),
    order.created_at,
    order.updated_at,
  ]);

  return [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  const [isReloading, setIsReloading] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderStatusLogs, setOrderStatusLogs] = useState<OrderStatusLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const [realtimeMessage, setRealtimeMessage] = useState('Menghubungkan realtime...');
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: countOrdersByStatus(orders, ORDER_STATUS.pending),
      confirmed: countOrdersByStatus(orders, ORDER_STATUS.confirmed),
      completed: countOrdersByStatus(orders, ORDER_STATUS.completed),
      cancelled: countOrdersByStatus(orders, ORDER_STATUS.cancelled),
    };
  }, [orders]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((order) => order.id === selectedOrderId) ?? null;
  }, [orders, selectedOrderId]);

  const visibleOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedPhoneQuery = normalizeIndonesianPhone(query);

    return orders.filter((order) => {
      const customerPhone = order.customer_phone ?? '';
      const normalizedCustomerPhone = normalizeIndonesianPhone(customerPhone);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch =
        !query ||
        getCustomerLabel(order).toLowerCase().includes(query) ||
        customerPhone.toLowerCase().includes(query) ||
        (normalizedPhoneQuery.length > 0 && normalizedCustomerPhone.includes(normalizedPhoneQuery)) ||
        order.id.toLowerCase().includes(query) ||
        getShortOrderId(order.id).toLowerCase().includes(query) ||
        order.items.some((item) => item.name.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchQuery, statusFilter]);

  const hasActiveFilters = statusFilter !== 'all' || searchQuery.trim() !== '';

  const loadOrders = useCallback(async (options: { silent?: boolean } = {}) => {
    if (options.silent) {
      setIsReloading(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await getOrdersAdmin();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat order admin');
    } finally {
      if (options.silent) {
        setIsReloading(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const loadOrderStatusLogs = useCallback(async (orderId: string) => {
    setIsLogsLoading(true);
    setLogsError(null);

    try {
      const data = await getOrderStatusLogs(orderId);
      setOrderStatusLogs(data);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'Gagal memuat riwayat status');
      setOrderStatusLogs([]);
    } finally {
      setIsLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!selectedOrderId) return;
    if (orders.some((order) => order.id === selectedOrderId)) return;

    setSelectedOrderId(null);
  }, [orders, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId) {
      setOrderStatusLogs([]);
      setLogsError(null);
      setIsLogsLoading(false);
      return;
    }

    void loadOrderStatusLogs(selectedOrderId);
  }, [loadOrderStatusLogs, selectedOrderId]);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setRealtimeStatus('unavailable');
      setRealtimeMessage('Realtime tidak aktif');
      return;
    }

    let isMounted = true;
    const handleRealtimeChange = (eventLabel: string) => {
      if (!isMounted) return;

      setRealtimeMessage(eventLabel);
      void loadOrders({ silent: true });
    };

    const channel = client
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => handleRealtimeChange('Order baru masuk'),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => handleRealtimeChange('Order diperbarui'),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        () => handleRealtimeChange('Order dihapus'),
      )
      .subscribe((status) => {
        if (!isMounted) return;

        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('active');
          setRealtimeMessage('Realtime aktif');
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('unavailable');
          setRealtimeMessage('Realtime tidak aktif, gunakan Muat ulang');
        }
      });

    return () => {
      isMounted = false;
      void client.removeChannel(channel);
    };
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
      const stockSyncMessage =
        (status === ORDER_STATUS.confirmed || status === ORDER_STATUS.completed) && updatedOrder.stock_deducted
          ? ' Stok produk sudah dikurangi.'
          : status === ORDER_STATUS.cancelled && updatedOrder.stock_restored
            ? ' Stok produk sudah dikembalikan.'
          : '';
      setFeedbackMessage(`Order #${getShortOrderId(updatedOrder.id)} berhasil diubah ke ${updatedOrder.status}.${stockSyncMessage}`);
      if (selectedOrderId === updatedOrder.id) {
        void loadOrderStatusLogs(updatedOrder.id);
      }
    } catch (err) {
      setError(getOrderActionErrorMessage(err));
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

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };

  const handleExportCsv = () => {
    if (visibleOrders.length === 0) {
      setFeedbackMessage('Tidak ada data untuk diexport.');
      return;
    }

    const csvContent = buildOrdersCsv(visibleOrders);
    const filename = `adzani-orders-${getLocalDateStamp()}.csv`;
    downloadCsv(filename, csvContent);
    setFeedbackMessage(`${visibleOrders.length} order berhasil diexport ke CSV.`);
  };

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
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isLoading || visibleOrders.length === 0}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              title={visibleOrders.length === 0 ? 'Tidak ada data untuk diexport' : 'Export order yang sedang tampil'}
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => loadOrders()}
              disabled={isLoading || isReloading}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isReloading ? 'Memuat...' : 'Muat ulang'}
            </button>
            <Link to="/admin" className="btn-secondary">Dashboard</Link>
            <Link to="/admin/products" className="btn-secondary">Produk</Link>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
        <div className="surface-muted px-4 py-4 sm:col-span-2 xl:col-span-1">
          <p className="text-3xl font-semibold text-blush">{stats.cancelled}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Cancelled</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Daftar order</p>
          <h2 className="section-title">Order Terbaru</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                realtimeStatus === 'active' ? 'bg-sage' : realtimeStatus === 'connecting' ? 'bg-champagne' : 'bg-blush'
              }`}
            />
            <span className={realtimeStatus === 'active' ? 'text-sage' : realtimeStatus === 'connecting' ? 'text-champagne' : 'text-blush'}>
              {realtimeMessage}
            </span>
            {isReloading && <span className="text-smoke">Sinkronisasi...</span>}
          </div>
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
          <button type="button" onClick={() => loadOrders()} className="btn-secondary mt-4">
            Muat Ulang Order
          </button>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="surface-card mb-6 space-y-4 p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem_auto_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Cari order</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Customer, nomor WhatsApp, order ID, atau nama item"
                className="field-control min-h-12 text-base"
              />
            </label>

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
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              Reset Filter
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={visibleOrders.length === 0}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              title={visibleOrders.length === 0 ? 'Tidak ada data untuk diexport' : 'Export order yang sedang tampil'}
            >
              Export CSV
            </button>
          </div>
          <p className="text-xs leading-5 text-smoke">
            Export mengikuti search dan filter status yang sedang aktif.
          </p>
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
          <p className="text-xl font-semibold text-porcelain">Tidak ada order yang cocok.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-smoke">
            Ubah kata kunci atau filter status untuk melihat order lainnya.
          </p>
          <button type="button" onClick={resetFilters} className="btn-secondary mt-5">
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
                    const allowedStatusOptions = getStatusSelectOptions(order.status);
                    const customerPhoneDisplay = getCustomerPhoneDisplay(order);

                    return (
                      <tr key={order.id} className="border-t border-white/10 align-top hover:bg-white/4">
                        <td className="min-w-44 px-4 py-4">
                          <p className="font-semibold text-porcelain">#{getShortOrderId(order.id)}</p>
                          <p className="mt-1 text-xs text-smoke">{formatOrderDateTime(order.created_at)}</p>
                          <div className="mt-2">
                            <StockSyncBadge order={order} />
                          </div>
                        </td>
                        <td className="min-w-56 px-4 py-4">
                          <p className="font-semibold text-porcelain">{getCustomerLabel(order)}</p>
                          {customerPhoneDisplay && <p className="mt-1 text-xs font-semibold text-mist">{customerPhoneDisplay}</p>}
                          {order.pickup_method && <p className="mt-1 text-xs text-sage">{order.pickup_method}</p>}
                          {order.customer_note && <p className="mt-2 max-w-xs text-xs leading-5 text-smoke">{order.customer_note}</p>}
                        </td>
                        <td className="min-w-80 px-4 py-4">
                          <OrderItems order={order} />
                        </td>
                        <td className="px-4 py-4 font-semibold text-sage">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="grid min-w-48 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderId(order.id)}
                              className="btn-secondary px-3 py-2 text-xs"
                            >
                              Detail
                            </button>
                            <select
                              value={order.status}
                              onChange={(event) => handleUpdateStatus(order, event.target.value as OrderStatus)}
                              disabled={isBusy}
                              className="field-control min-h-11 text-sm disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              {allowedStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {ORDER_STATUS_LABELS[status]}
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
              const allowedStatusOptions = getStatusSelectOptions(order.status);
              const customerPhoneDisplay = getCustomerPhoneDisplay(order);

              return (
                <article key={order.id} className="surface-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">#{getShortOrderId(order.id)}</p>
                      <h3 className="mt-1 text-xl font-semibold leading-snug text-porcelain">{getCustomerLabel(order)}</h3>
                      {customerPhoneDisplay && <p className="mt-1 text-sm font-semibold text-mist">{customerPhoneDisplay}</p>}
                      <p className="mt-1 text-xs text-smoke">{formatOrderDateTime(order.created_at)}</p>
                      <div className="mt-2">
                        <StockSyncBadge order={order} />
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
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
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="btn-secondary w-full py-3"
                    >
                      Detail Order
                    </button>
                    <select
                      value={order.status}
                      onChange={(event) => handleUpdateStatus(order, event.target.value as OrderStatus)}
                      disabled={isBusy}
                      className="field-control min-h-12 text-base disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {allowedStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
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

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
          <button
            type="button"
            aria-label="Tutup detail order"
            onClick={() => setSelectedOrderId(null)}
            className="absolute inset-0 cursor-default"
          />

          <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-white/10 bg-charcoal shadow-2xl sm:m-4 sm:h-[calc(100%-2rem)] sm:rounded-lg sm:border">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Detail Order</p>
                  <h2 id="order-detail-title" className="mt-2 text-2xl font-semibold text-porcelain">
                    #{getShortOrderId(selectedOrder.id)}
                  </h2>
                  <p className="mt-2 text-sm text-smoke">{formatOrderDateTime(selectedOrder.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  className="rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-porcelain hover:bg-white/10"
                >
                  Tutup
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={selectedOrder.status} />
                <StockSyncBadge order={selectedOrder} />
                <span className="text-sm font-semibold text-sage">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Transisi status</p>
                <p className="mt-2 text-sm leading-6 text-mist">
                  Status berikutnya yang tersedia: {' '}
                  <span className="font-semibold text-porcelain">
                    {getAllowedStatusTransitions(selectedOrder.status).map((status) => ORDER_STATUS_LABELS[status]).join(', ')}
                  </span>
                </p>
                {getStatusWarning(selectedOrder.status) && (
                  <p className="mt-3 rounded-md border border-champagne/30 bg-champagne/10 px-3 py-2 text-sm leading-6 text-champagne">
                    {getStatusWarning(selectedOrder.status)}
                  </p>
                )}
              </div>

              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Riwayat Status</p>
                    <p className="mt-1 text-sm text-mist">Histori perubahan status yang diproses lewat RPC admin.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadOrderStatusLogs(selectedOrder.id)}
                    disabled={isLogsLoading}
                    className="btn-secondary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLogsLoading ? 'Memuat...' : 'Refresh Log'}
                  </button>
                </div>

                {isLogsLoading && (
                  <div className="mt-4 rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-smoke">
                    Memuat riwayat status...
                  </div>
                )}

                {!isLogsLoading && logsError && (
                  <div className="mt-4 rounded-md border border-blush/30 bg-blush/10 px-3 py-3 text-sm leading-6 text-blush">
                    {logsError}
                  </div>
                )}

                {!isLogsLoading && !logsError && orderStatusLogs.length === 0 && (
                  <div className="mt-4 rounded-md border border-dashed border-white/15 bg-white/5 px-3 py-3 text-sm leading-6 text-smoke">
                    Belum ada riwayat perubahan status untuk order ini.
                  </div>
                )}

                {!isLogsLoading && !logsError && orderStatusLogs.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {orderStatusLogs.map((log) => (
                      <div key={log.id} className="rounded-md border border-white/10 bg-ink/40 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {log.from_status ? (
                            <StatusBadge status={log.from_status} />
                          ) : (
                            <span className="status-pill bg-white/8 text-smoke">Awal</span>
                          )}
                          <span className="text-sm font-semibold text-smoke">→</span>
                          <StatusBadge status={log.to_status} />
                        </div>
                        <div className="mt-3 grid gap-1 text-sm text-mist sm:grid-cols-[1fr_auto] sm:items-center">
                          <span className="break-all">
                            Oleh: <strong className="text-porcelain">{log.changed_by_email || 'Admin'}</strong>
                          </span>
                          <span className="text-smoke">{formatOrderDateTime(log.created_at)}</span>
                        </div>
                        {log.note && <p className="mt-2 text-sm leading-6 text-smoke">{log.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Sinkronisasi stok</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StockSyncBadge order={selectedOrder} />
                  {selectedOrder.stock_deducted_at && (
                    <span className="text-sm text-mist">
                      Dikurangi pada {formatOrderDateTime(selectedOrder.stock_deducted_at)}
                    </span>
                  )}
                  {selectedOrder.stock_restored_at && (
                    <span className="text-sm text-mist">
                      Dikembalikan pada {formatOrderDateTime(selectedOrder.stock_restored_at)}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-mist">
                  Stok produk otomatis dikurangi saat order masuk ke status confirmed atau completed. Jika order yang sudah mengurangi stok dibatalkan, stok dikembalikan satu kali. Order cancelled yang diproses lagi ke confirmed/completed akan mengurangi stok ulang jika stok tersedia.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="surface-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Customer</p>
                  <p className="mt-2 font-semibold text-porcelain">{getCustomerLabel(selectedOrder)}</p>
                </div>
                <div className="surface-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Nomor WhatsApp</p>
                  {getCustomerPhoneDisplay(selectedOrder) ? (
                    <div className="mt-2 space-y-3">
                      <p className="break-all font-semibold text-porcelain">{getCustomerPhoneDisplay(selectedOrder)}</p>
                      {getWhatsAppChatUrl(selectedOrder.customer_phone) && (
                        <a
                          href={getWhatsAppChatUrl(selectedOrder.customer_phone) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary inline-flex px-3 py-2 text-xs"
                        >
                          Chat customer
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 font-semibold text-porcelain">-</p>
                  )}
                </div>
                <div className="surface-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Metode ambil</p>
                  <p className="mt-2 font-semibold text-porcelain">{selectedOrder.pickup_method || '-'}</p>
                </div>
              </div>

              <div className="surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Catatan customer</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-mist">{selectedOrder.customer_note || '-'}</p>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Items lengkap</p>
                  <p className="text-sm font-semibold text-sage">{formatCurrency(selectedOrder.total)}</p>
                </div>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={`${selectedOrder.id}-detail-${item.product_id}`} className="rounded-md border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-porcelain">{item.name}</p>
                          <p className="mt-1 break-all text-xs text-smoke">{item.slug}</p>
                          <p className="mt-1 text-xs text-smoke">{item.category}</p>
                        </div>
                        <p className="text-sm font-semibold text-sage">{formatCurrency(item.subtotal)}</p>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-mist sm:grid-cols-3">
                        <span>Qty: <strong className="text-porcelain">{item.qty}</strong></span>
                        <span>Harga: <strong className="text-porcelain">{formatCurrency(item.price)}</strong></span>
                        <span className="break-all">ID: <strong className="text-porcelain">{item.product_id}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.whatsapp_message && (
                <div className="rounded-md border border-white/10 bg-ink/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">WhatsApp message</p>
                  <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-white/5 p-3 text-xs leading-6 text-mist">
                    {selectedOrder.whatsapp_message}
                  </pre>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
