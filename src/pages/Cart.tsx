import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/formatCurrency';
import { useCart } from '../hooks/useCart';
import { getWhatsAppCheckoutUrl } from '../services/whatsappService';

function getProductInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export default function Cart() {
  const { items, removeFromCart, updateQty, clearCart, getSubtotal } = useCart();
  const [errorMessage, setErrorMessage] = useState('');
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = () => {
    setErrorMessage('');

    try {
      const url = getWhatsAppCheckoutUrl(items);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal membuka WhatsApp checkout.');
    }
  };

  return (
    <section className="page-shell">
      <div className="surface-card mb-6 overflow-hidden">
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-7 lg:p-8">
          <div>
            <p className="eyebrow">Keranjang</p>
            <h1 className="page-title">Checkout Order</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist md:text-base">
              Cek ulang item, jumlah barang, dan subtotal sebelum mengirim pesanan ke WhatsApp admin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="surface-muted px-4 py-3">
              <p className="text-2xl font-semibold text-porcelain">{totalItems}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Total item</p>
            </div>
            <div className="surface-muted px-4 py-3">
              <p className="text-2xl font-semibold text-porcelain">{items.length}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Produk</p>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="surface-card mx-auto max-w-2xl p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-sage/30 bg-sage/10 text-2xl font-black text-sage">
            AZ
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-porcelain">Keranjang masih kosong</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-mist">
            Pilih produk dari katalog dulu, lalu kembali ke halaman ini untuk checkout via WhatsApp.
          </p>
          <Link to="/products" className="btn-primary mt-6">
            Buka Katalog Produk
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.product.id} className="surface-card grid gap-4 p-4 md:grid-cols-[112px_1fr_auto] md:items-center">
                <div className="overflow-hidden rounded-md border border-white/10 bg-ink/70">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="h-28 w-full object-cover md:h-28 md:w-28" />
                  ) : (
                    <div className="flex h-28 w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(166,216,194,0.16),rgba(226,196,130,0.08))] text-sm text-smoke md:w-28">
                      <span className="grid h-10 w-10 place-items-center rounded-md border border-sage/30 bg-ink/60 font-black text-sage">
                        {getProductInitials(item.product.name) || 'AZ'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">{item.product.category}</p>
                  <h2 className="text-xl font-semibold leading-snug text-porcelain">{item.product.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold text-sage">{formatCurrency(item.product.price)} / item</span>
                    <span className={item.product.stock <= 0 ? 'text-blush' : 'text-smoke'}>
                      Stok toko: {item.product.stock}
                    </span>
                  </div>
                  <p className="text-sm text-mist">
                    Subtotal item: <span className="font-semibold text-porcelain">{formatCurrency(item.product.price * item.qty)}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <div className="inline-flex w-fit items-center rounded-md border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      className="grid h-9 w-9 place-items-center rounded-md text-lg font-semibold text-porcelain hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`Kurangi ${item.product.name}`}
                    >
                      -
                    </button>
                    <span className="min-w-11 text-center text-sm font-semibold text-porcelain">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, item.qty + 1)}
                      disabled={item.qty >= item.product.stock}
                      className="grid h-9 w-9 place-items-center rounded-md text-lg font-semibold text-porcelain hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`Tambah ${item.product.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="rounded-md border border-blush/30 bg-blush/8 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blush hover:bg-blush/14"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
            <p className="eyebrow">Ringkasan</p>
            <h2 className="mt-2 text-2xl font-semibold text-porcelain">Order Summary</h2>

            <div className="mt-5 space-y-4 text-sm text-mist">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <strong className="text-lg text-porcelain">{formatCurrency(getSubtotal)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Total item</span>
                <strong className="text-porcelain">{totalItems}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Metode checkout</span>
                <strong className="text-porcelain">WhatsApp</strong>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-sage/20 bg-sage/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">Catatan checkout</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-mist">
                <li>Checkout akan diarahkan ke WhatsApp.</li>
                <li>Stok dan harga akan dikonfirmasi admin.</li>
                <li>Tidak ada pembayaran otomatis di website.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="btn-primary mt-5 w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              Checkout via WhatsApp
            </button>

            <button
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
              className="mt-3 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-smoke hover:border-blush/30 hover:bg-blush/10 hover:text-blush disabled:cursor-not-allowed disabled:opacity-50"
            >
              Kosongkan Keranjang
            </button>

            {errorMessage && <p className="error-panel mt-4 text-sm">{errorMessage}</p>}
          </aside>
        </div>
      )}
    </section>
  );
}
