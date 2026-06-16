import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/formatCurrency';
import { useCart } from '../hooks/useCart';
import { generateWhatsAppOrderMessage, getWhatsAppCheckoutUrl, type CheckoutInfo, type PickupMethod } from '../services/whatsappService';

function getProductInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function clampQty(value: number, maxQty: number) {
  if (maxQty <= 0) return 1;
  return Math.min(Math.max(1, value), maxQty);
}

function ImageFallback({ name }: { name: string }) {
  return (
    <div className="flex h-28 w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(166,216,194,0.16),rgba(226,196,130,0.08))] text-sm text-smoke md:w-28">
      <span className="grid h-10 w-10 place-items-center rounded-md border border-sage/30 bg-ink/60 font-black text-sage">
        {getProductInitials(name) || 'AZ'}
      </span>
    </div>
  );
}

export default function Cart() {
  const { items, removeFromCart, updateQty, clearCart, getSubtotal } = useCart();
  const [errorMessage, setErrorMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo>({
    customerName: '',
    orderNote: '',
    pickupMethod: '',
  });
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const productTypes = items.length;
  const invalidItems = useMemo(() => {
    return items.filter((item) => item.product.stock <= 0 || item.qty > item.product.stock);
  }, [items]);
  const isCartInvalid = invalidItems.length > 0;
  const whatsappPreview = items.length > 0 ? generateWhatsAppOrderMessage(items, checkoutInfo) : '';

  const markImageAsBroken = (productId: string) => {
    setBrokenImageIds((current) => {
      if (current.has(productId)) return current;

      const next = new Set(current);
      next.add(productId);
      return next;
    });
  };

  const handleQtyChange = (productId: string, nextQty: number, stock: number) => {
    updateQty(productId, clampQty(nextQty, stock));
    setErrorMessage('');
    setCheckoutMessage('');
  };

  const handleCheckout = () => {
    setErrorMessage('');
    setCheckoutMessage('');

    if (isCartInvalid) {
      setErrorMessage('Beberapa item tidak valid karena stok habis atau jumlah melebihi stok.');
      return;
    }

    try {
      setCheckoutMessage('WhatsApp will be open new tab, chart stay save after your delete');
      const url = getWhatsAppCheckoutUrl(items, checkoutInfo);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setCheckoutMessage('');
      setErrorMessage(error instanceof Error ? error.message : 'WhatsApp Failed Open');
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="surface-muted px-4 py-3">
              <p className="text-2xl font-semibold text-porcelain">{productTypes}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Jenis produk</p>
            </div>
            <div className="surface-muted px-4 py-3">
              <p className="text-2xl font-semibold text-porcelain">{totalQty}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Qty item</p>
            </div>
            <div className="surface-muted col-span-2 px-4 py-3 sm:col-span-1">
              <p className="text-2xl font-semibold text-sage">{formatCurrency(getSubtotal)}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Subtotal</p>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="surface-card mx-auto max-w-2xl p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-sage/30 bg-sage/10 text-2xl font-black text-sage">
            AZ
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-porcelain">Keranjang masih kosong</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-mist">
            Pilih produk dari katalog, atur jumlahnya, lalu kembali ke sini untuk checkout via WhatsApp.
          </p>
          <Link to="/products" className="btn-primary mt-6">
            Kembali ke Katalog
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {isCartInvalid && (
              <div className="rounded-md border border-blush/30 bg-blush/10 p-4 text-sm leading-6 text-blush">
                <p className="font-semibold text-porcelain">Keranjang perlu disesuaikan.</p>
                <p className="mt-1">Ada item dengan stok habis atau jumlah melebihi stok. Sesuaikan jumlah atau hapus item sebelum checkout.</p>
              </div>
            )}

            {items.map((item) => {
              const isStockEmpty = item.product.stock <= 0;
              const isQtyOverStock = item.qty > item.product.stock;
              const isAtMaxStock = item.product.stock > 0 && item.qty >= item.product.stock;
              const shouldShowImage = Boolean(item.product.image_url) && !brokenImageIds.has(item.product.id);

              return (
                <article key={item.product.id} className="surface-card grid gap-4 p-4 md:grid-cols-[112px_1fr] lg:grid-cols-[112px_1fr_auto] lg:items-center">
                  <Link to={`/products/${item.product.slug}`} className="overflow-hidden rounded-md border border-white/10 bg-ink/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage">
                    {shouldShowImage ? (
                      <img
                        src={item.product.image_url ?? ''}
                        alt={item.product.name}
                        onError={() => markImageAsBroken(item.product.id)}
                        className="h-28 w-full object-cover md:h-28 md:w-28"
                      />
                    ) : (
                      <ImageFallback name={item.product.name} />
                    )}
                  </Link>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">{item.product.category}</p>
                      <Link to={`/products/${item.product.slug}`} className="mt-1 block text-xl font-semibold leading-snug text-porcelain hover:text-sage">
                        {item.product.name}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-semibold text-sage">{formatCurrency(item.product.price)} / item</span>
                      <span className={isStockEmpty ? 'font-semibold text-blush' : 'text-smoke'}>
                        Stok toko: {item.product.stock}
                      </span>
                      {isAtMaxStock && !isStockEmpty && (
                        <span className="rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-semibold text-champagne">
                          Qty sudah maksimal
                        </span>
                      )}
                    </div>

                    {(isStockEmpty || isQtyOverStock) && (
                      <p className="rounded-md border border-blush/30 bg-blush/10 px-3 py-2 text-sm text-blush">
                        {isStockEmpty ? 'Item ini sedang stok habis.' : 'Jumlah item melebihi stok tersedia.'}
                      </p>
                    )}

                    <p className="text-sm text-mist">
                      Subtotal item: <span className="font-semibold text-porcelain">{formatCurrency(item.product.price * item.qty)}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 md:col-start-2 lg:col-start-auto lg:items-end">
                    <div className="grid w-fit grid-cols-[2.75rem_minmax(4rem,5.5rem)_2.75rem] overflow-hidden rounded-md border border-white/10 bg-white/5">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.product.id, item.qty - 1, item.product.stock)}
                        disabled={item.qty <= 1 || isStockEmpty}
                        className="grid min-h-11 place-items-center border-r border-white/10 text-lg font-semibold text-porcelain hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={`Kurangi ${item.product.name}`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(item.product.stock, 1)}
                        value={item.qty}
                        onChange={(event) => handleQtyChange(item.product.id, Number(event.target.value), item.product.stock)}
                        disabled={isStockEmpty}
                        className="min-h-11 bg-transparent px-2 text-center text-sm font-semibold text-porcelain outline-none disabled:text-smoke"
                        aria-label={`Jumlah ${item.product.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.product.id, item.qty + 1, item.product.stock)}
                        disabled={item.qty >= item.product.stock || isStockEmpty}
                        className="grid min-h-11 place-items-center border-l border-white/10 text-lg font-semibold text-porcelain hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={`Tambah ${item.product.name}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-fit rounded-md border border-blush/30 bg-blush/8 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blush hover:bg-blush/14"
                    >
                      Hapus
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
            <p className="eyebrow">Ringkasan</p>
            <h2 className="mt-2 text-2xl font-semibold text-porcelain">Order Summary</h2>

            <div className="mt-5 space-y-4 text-sm text-mist">
              <div className="flex items-center justify-between">
                <span>Jenis produk</span>
                <strong className="text-porcelain">{productTypes}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Total qty</span>
                <strong className="text-porcelain">{totalQty}</strong>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span>Subtotal</span>
                <strong className="text-lg text-porcelain">{formatCurrency(getSubtotal)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Metode checkout</span>
                <strong className="text-porcelain">WhatsApp</strong>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-sage/20 bg-sage/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">Catatan checkout</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-mist">
                <li>Checkout akan diarahkan ke WhatsApp admin.</li>
                <li>Harga dan stok akan dikonfirmasi ulang oleh admin.</li>
                <li>Keranjang tidak otomatis dikosongkan setelah WhatsApp terbuka.</li>
              </ul>
            </div>

            <div className="mt-5 space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Info tambahan</p>
                <p className="mt-2 text-sm leading-6 text-mist">
                  Opsional, tapi membantu admin memproses order lebih cepat.
                </p>
              </div>

              <label className="field-label">
                <span>Nama customer</span>
                <input
                  type="text"
                  value={checkoutInfo.customerName ?? ''}
                  onChange={(event) => setCheckoutInfo((current) => ({ ...current, customerName: event.target.value }))}
                  className="field-control"
                  placeholder="Nama kamu"
                />
              </label>

              <label className="field-label">
                <span>Metode ambil</span>
                <select
                  value={checkoutInfo.pickupMethod ?? ''}
                  onChange={(event) => setCheckoutInfo((current) => ({ ...current, pickupMethod: event.target.value as PickupMethod }))}
                  className="field-control"
                >
                  <option value="">Pilih jika perlu</option>
                  <option value="Ambil di toko">Ambil di toko</option>
                  <option value="Tanya admin dulu">Tanya admin dulu</option>
                </select>
              </label>

              <label className="field-label">
                <span>Catatan pesanan</span>
                <textarea
                  value={checkoutInfo.orderNote ?? ''}
                  onChange={(event) => setCheckoutInfo((current) => ({ ...current, orderNote: event.target.value }))}
                  rows={4}
                  className="field-control resize-y"
                  placeholder="Contoh: warna hitam kalau ada, konfirmasi stok dulu ya"
                />
              </label>
            </div>

            <div className="mt-5 rounded-md border border-white/10 bg-ink/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Pesan yang akan dikirim</p>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-white/5 p-3 text-xs leading-6 text-mist">
                {whatsappPreview}
              </pre>
            </div>

            {isCartInvalid && (
              <div className="mt-4 rounded-md border border-blush/30 bg-blush/10 p-4 text-sm leading-6 text-blush">
                <p className="font-semibold text-porcelain">Checkout dinonaktifkan.</p>
                <p className="mt-1">Perbaiki item bertanda stok bermasalah agar WhatsApp checkout bisa digunakan.</p>
              </div>
            )}

            {checkoutMessage && (
              <div className="mt-4 rounded-md border border-sage/30 bg-sage/10 p-4 text-sm leading-6 text-sage">
                {checkoutMessage}
              </div>
            )}

            {errorMessage && <p className="error-panel mt-4 text-sm">{errorMessage}</p>}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={items.length === 0 || isCartInvalid}
              className="btn-primary mt-5 w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCartInvalid ? 'Perbaiki Keranjang Dulu' : 'Checkout via WhatsApp'}
            </button>

            <button
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
              className="mt-3 w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-smoke hover:border-blush/30 hover:bg-blush/10 hover:text-blush disabled:cursor-not-allowed disabled:opacity-50"
            >
              Kosongkan Keranjang
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
