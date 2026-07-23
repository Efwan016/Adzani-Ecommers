import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../lib/formatCurrency';
import { absoluteUrl, RouteSeo } from '../lib/seo';
import { getOrderByToken, type TrackedOrder } from '../services/trackOrderService';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, formatOrderDateTime } from '../lib/orderStatus';

const TRACK_SEO = {
  title: 'Lacak Pesanan | Adzani Store',
  description: 'Cek status pesanan Adzani Store secara mandiri menggunakan token pelacakan dari checkout.',
  canonical: absoluteUrl('/track'),
  noIndex: true,
};

function StatusPill({ status }: { status: string }) {
  const label = (ORDER_STATUS_LABELS as Record<string, string>)[status] ?? status;
  const tone = (ORDER_STATUS_TONES as Record<string, string>)[status] ?? 'bg-white/10 text-mist';
  return <span className={`status-pill ${tone}`}>{label}</span>;
}

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialToken = searchParams.get('token') ?? '';
  const [token, setToken] = useState(initialToken);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const canSubmit = useMemo(() => token.trim().length > 0, [token]);

  const loadOrder = async (lookupToken: string) => {
    setIsLoading(true);
    setError('');
    setNotFound(false);
    try {
      const result = await getOrderByToken(lookupToken);
      if (!result) {
        setOrder(null);
        setNotFound(true);
        return;
      }
      setOrder(result);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Gagal melacak pesanan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken.trim()) {
      void loadOrder(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = token.trim();
    if (!clean) return;
    setSearchParams({ token: clean });
    void loadOrder(clean);
  };

  return (
    <section className="page-wide">
      <RouteSeo meta={TRACK_SEO} />
      <div className="surface-card mb-6 overflow-hidden">
        <div className="grid gap-6 p-5 md:p-7 lg:p-8">
          <div>
            <p className="eyebrow">Pesanan</p>
            <h1 className="page-title">Lacak Pesanan</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist md:text-base">
              Masukkan token pelacakan dari halaman checkout untuk melihat status pesanan kamu. Tidak perlu login.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label htmlFor="track-token" className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-smoke">Token pelacakan</span>
              <input
                id="track-token"
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Tempel token dari checkout"
                className="field-control min-h-12 text-base"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="btn-primary min-h-12 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Mencari...' : 'Lacak'}
            </button>
          </form>

          {error && (
            <div className="rounded-md border border-blush/30 bg-blush/10 p-4 text-sm text-blush">
              {error}
            </div>
          )}
        </div>
      </div>

      {notFound && (
        <div className="state-panel border-dashed p-10 text-center">
          <p className="text-lg font-semibold text-porcelain">Pesanan tidak ditemukan.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-smoke">
            Token mungkin salah atau pesanan belum tercatat. Cek kembali token dari halaman checkout.
          </p>
        </div>
      )}

      {order && (
        <div className="surface-card overflow-hidden p-5 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Status pesanan</p>
              <div className="mt-2">
                <StatusPill status={order.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Total</p>
              <p className="mt-1 text-2xl font-semibold text-sage">{formatCurrency(order.total)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="surface-muted px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Dibuat</p>
              <p className="mt-1 text-sm font-semibold text-porcelain">{formatOrderDateTime(order.created_at)}</p>
            </div>
            <div className="surface-muted px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Metode ambil</p>
              <p className="mt-1 text-sm font-semibold text-porcelain">{order.pickup_method || '-'}</p>
            </div>
          </div>

          {order.customer_note && (
            <div className="mt-3 rounded-md border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Catatan</p>
              <p className="mt-1 text-sm leading-6 text-mist">{order.customer_note}</p>
            </div>
          )}

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Items</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.product_id} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
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
          </div>

          <div className="mt-6 rounded-md border border-sage/20 bg-sage/8 p-4 text-sm leading-6 text-mist">
            Status akan diperbarui oleh admin. Jika ada pertanyaan, chat admin via WhatsApp dari halaman cart.
          </div>

          <div className="mt-5">
            <Link to="/products" className="btn-secondary">Kembali ke Katalog</Link>
          </div>
        </div>
      )}
    </section>
  );
}
