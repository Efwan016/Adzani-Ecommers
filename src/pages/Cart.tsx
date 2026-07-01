import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/formatCurrency';
import { formatPhoneDisplay, isIndonesianPhoneTooShort, normalizeIndonesianPhone } from '../lib/phone';
import { useCart } from '../hooks/useCart';
import { getProductsByIds } from '../services/productService';
import { createOrder } from '../services/orderService';
import { generateWhatsAppOrderMessage, getWhatsAppCheckoutUrl, getWhatsAppUrlForMessage, type CheckoutInfo, type PickupMethod } from '../services/whatsappService';

type PriceChange = {
  previous: number;
  current: number;
};

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

function getCheckoutDisabledReason(options: {
  hasItems: boolean;
  isCartInvalid: boolean;
  isCustomerPhoneTooShort: boolean;
  isSavingOrder: boolean;
}) {
  if (!options.hasItems) return 'Keranjang masih kosong.';
  if (options.isSavingOrder) return 'Order sedang disimpan.';
  if (options.isCartInvalid) return 'Perbaiki item yang stoknya bermasalah sebelum checkout.';
  if (options.isCustomerPhoneTooShort) return 'Nomor WhatsApp terlalu pendek. Kosongkan atau isi nomor yang lebih lengkap.';

  return '';
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
  const { items, removeFromCart, updateQty, clearCart, replaceCart, getSubtotal } = useCart();
  const [errorMessage, setErrorMessage] = useState('');
  const [cartRefreshMessage, setCartRefreshMessage] = useState('');
  const [isRefreshingCart, setIsRefreshingCart] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState('');
  const [lastCheckoutUrl, setLastCheckoutUrl] = useState('');
  const [unavailableProductIds, setUnavailableProductIds] = useState<Set<string>>(() => new Set());
  const [priceChanges, setPriceChanges] = useState<Record<string, PriceChange>>({});
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo>({
    customerName: '',
    customerPhone: '',
    orderNote: '',
    pickupMethod: '',
  });
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const productTypes = items.length;
  const invalidItems = useMemo(() => {
    return items.filter((item) =>
      unavailableProductIds.has(item.product.id) ||
      !item.product.is_active ||
      item.product.stock <= 0 ||
      item.qty > item.product.stock
    );
  }, [items, unavailableProductIds]);
  const isCartInvalid = invalidItems.length > 0;
  const normalizedCustomerPhone = normalizeIndonesianPhone(checkoutInfo.customerPhone);
  const isCustomerPhoneTooShort = isIndonesianPhoneTooShort(normalizedCustomerPhone);
  const normalizedCheckoutInfo: CheckoutInfo = {
    ...checkoutInfo,
    customerPhone: normalizedCustomerPhone,
  };
  const customerName = checkoutInfo.customerName?.trim();
  const customerPhoneDisplay = formatPhoneDisplay(normalizedCustomerPhone);
  const pickupMethodLabel = checkoutInfo.pickupMethod?.trim() || 'Belum dipilih';
  const whatsappPreview = items.length > 0 ? generateWhatsAppOrderMessage(items, normalizedCheckoutInfo) : '';
  const isCheckoutDisabled = items.length === 0 || isCartInvalid || isSavingOrder || isCustomerPhoneTooShort;
  const checkoutDisabledReason = getCheckoutDisabledReason({
    hasItems: items.length > 0,
    isCartInvalid,
    isCustomerPhoneTooShort,
    isSavingOrder,
  });
  const shortOrderId = savedOrderId ? savedOrderId.slice(0, 8).toUpperCase() : '';

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
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
    setUnavailableProductIds((current) => {
      if (!current.has(productId)) return current;

      const next = new Set(current);
      next.delete(productId);
      return next;
    });
    setPriceChanges((current) => {
      if (!current[productId]) return current;

      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const handleRefreshCart = async () => {
    if (items.length === 0 || isRefreshingCart) return;

    setIsRefreshingCart(true);
    setErrorMessage('');
    setCartRefreshMessage('');

    try {
      const latestProducts = await getProductsByIds(items.map((item) => item.product.id));
      const latestById = new Map(latestProducts.map((product) => [product.id, product]));
      const nextUnavailableIds = new Set<string>();
      const nextPriceChanges: Record<string, PriceChange> = {};
      let updatedItemCount = 0;

      const refreshedItems = items.map((item) => {
        const latestProduct = latestById.get(item.product.id);

        if (!latestProduct) {
          nextUnavailableIds.add(item.product.id);
          return item;
        }

        const hasProductChanged =
          item.product.name !== latestProduct.name ||
          item.product.slug !== latestProduct.slug ||
          item.product.price !== latestProduct.price ||
          item.product.stock !== latestProduct.stock ||
          item.product.image_url !== latestProduct.image_url ||
          item.product.is_active !== latestProduct.is_active;

        if (hasProductChanged) {
          updatedItemCount += 1;
        }

        if (item.product.price !== latestProduct.price) {
          nextPriceChanges[item.product.id] = {
            previous: item.product.price,
            current: latestProduct.price,
          };
        }

        return {
          ...item,
          product: latestProduct,
        };
      });

      replaceCart(refreshedItems);
      setUnavailableProductIds(nextUnavailableIds);
      setPriceChanges(nextPriceChanges);

      const invalidCount = refreshedItems.filter((item) =>
        nextUnavailableIds.has(item.product.id) ||
        !item.product.is_active ||
        item.product.stock <= 0 ||
        item.qty > item.product.stock
      ).length;

      if (invalidCount > 0 || Object.keys(nextPriceChanges).length > 0) {
        setCartRefreshMessage('Keranjang diperbarui. Cek warning pada item sebelum checkout.');
      } else if (updatedItemCount > 0) {
        setCartRefreshMessage('Keranjang sudah diperbarui dengan data produk terbaru.');
      } else {
        setCartRefreshMessage('Keranjang sudah memakai data produk terbaru.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal refresh keranjang.');
    } finally {
      setIsRefreshingCart(false);
    }
  };

  const handleCheckout = async () => {
    setErrorMessage('');

    if (isCartInvalid) {
      setErrorMessage('Beberapa item tidak valid karena stok habis atau jumlah melebihi stok.');
      return;
    }

    if (isCustomerPhoneTooShort) {
      setErrorMessage('Nomor WhatsApp terlalu pendek. Kosongkan atau isi nomor yang lebih lengkap.');
      return;
    }

    if (items.length === 0 || isSavingOrder) return;

    setIsSavingOrder(true);

    try {
      const whatsappMessage = generateWhatsAppOrderMessage(items, normalizedCheckoutInfo);
      const url = getWhatsAppUrlForMessage(whatsappMessage);
      const order = await createOrder({
        items,
        checkoutInfo: normalizedCheckoutInfo,
        whatsappMessage,
      });

      setSavedOrderId(order.id);
      setLastCheckoutUrl(url);
      setHasOpenedWhatsApp(true);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Order gagal disimpan. Silakan coba lagi.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleReopenWhatsApp = () => {
    setErrorMessage('');

    try {
      const url = items.length > 0 && !isCartInvalid && !isCustomerPhoneTooShort
        ? getWhatsAppCheckoutUrl(items, normalizedCheckoutInfo)
        : lastCheckoutUrl;

      if (!url) return;

      setLastCheckoutUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      if (lastCheckoutUrl) {
        window.open(lastCheckoutUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'WhatsApp gagal dibuka ulang.');
    }
  };

  const handleClearCart = (confirmationMessage = 'Kosongkan semua item dari cart?') => {
    if (items.length === 0) return;

    const shouldClear = window.confirm(confirmationMessage);
    if (!shouldClear) return;

    clearCart();
    setUnavailableProductIds(new Set());
    setPriceChanges({});
    setCartRefreshMessage('');
    setSavedOrderId('');
    setErrorMessage('');
  };

  const handleClearCartAfterChat = () => {
    handleClearCart('Kosongkan cart sekarang? Pastikan pesanan sudah kamu chat ke admin.');
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

      {hasOpenedWhatsApp && (
        <div className="surface-card mb-6 border-sage/35 bg-sage/8 p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow text-sage">Order dicatat</p>
              <h2 className="mt-2 text-2xl font-semibold text-porcelain">Lanjutkan chat dengan admin Adzani</h2>
              <div className="mt-3 space-y-2 text-sm leading-7 text-mist">
                {shortOrderId && (
                  <p>
                    Order ID: <span className="font-semibold text-porcelain">#{shortOrderId}</span>
                  </p>
                )}
                <p>WhatsApp sudah dibuka untuk mengirim detail pesanan kamu.</p>
                <p>Admin akan konfirmasi ulang stok, harga, dan detail pengambilan sebelum pesanan diproses.</p>
                <p>Cart tidak otomatis dihapus, jadi kamu masih bisa cek ulang atau membuka WhatsApp lagi.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[22rem] lg:grid-cols-1">
              <button
                type="button"
                onClick={handleClearCartAfterChat}
                disabled={items.length === 0}
                className="rounded-md border border-blush/30 bg-blush/10 px-4 py-3 text-sm font-bold text-blush hover:bg-blush/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Saya sudah chat admin, kosongkan cart
              </button>
              <Link to="/products" className="btn-secondary text-center">
                Lanjut belanja
              </Link>
              <button
                type="button"
                onClick={handleReopenWhatsApp}
                disabled={!lastCheckoutUrl && isCheckoutDisabled}
                className="btn-primary text-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buka WhatsApp lagi
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p className="mt-1">Ada item yang stoknya bermasalah, tidak aktif, atau tidak tersedia lagi. Refresh, sesuaikan jumlah, atau hapus item sebelum checkout.</p>
              </div>
            )}

            {items.map((item) => {
              const isProductUnavailable = unavailableProductIds.has(item.product.id);
              const isProductInactive = !item.product.is_active;
              const isStockEmpty = item.product.stock <= 0;
              const isQtyOverStock = item.qty > item.product.stock;
              const isAtMaxStock = item.product.stock > 0 && item.qty >= item.product.stock;
              const priceChange = priceChanges[item.product.id];
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

                    {(isProductUnavailable || isProductInactive || isStockEmpty || isQtyOverStock || priceChange) && (
                      <div className="space-y-2 rounded-md border border-blush/30 bg-blush/10 px-3 py-3 text-sm leading-6 text-blush">
                        {isProductUnavailable && <p>Produk ini tidak ditemukan atau sudah tidak aktif di katalog.</p>}
                        {!isProductUnavailable && isProductInactive && <p>Produk ini sedang nonaktif dan belum bisa checkout.</p>}
                        {isStockEmpty && <p>Stok terbaru produk ini sedang kosong.</p>}
                        {isQtyOverStock && <p>Qty cart melebihi stok terbaru. Stok tersedia: {item.product.stock}.</p>}
                        {priceChange && (
                          <p>
                            Harga berubah dari {formatCurrency(priceChange.previous)} menjadi {formatCurrency(priceChange.current)}.
                          </p>
                        )}
                      </div>
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
                      onClick={() => handleRemoveItem(item.product.id)}
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
            <div>
              <p className="eyebrow">Checkout</p>
              <h2 className="mt-2 text-2xl font-semibold text-porcelain">Selesaikan Order</h2>
              <p className="mt-2 text-sm leading-6 text-mist">
                Harga dan stok akan dikonfirmasi kembali oleh admin. Checkout akan membuka WhatsApp.
              </p>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['1', 'Cek keranjang', isCartInvalid ? 'Perlu dicek' : 'Siap'],
                ['2', 'Isi data', customerName || customerPhoneDisplay ? 'Terisi opsional' : 'Opsional'],
                ['3', 'Chat admin', hasOpenedWhatsApp ? 'Sudah dibuka' : 'Lewat WhatsApp'],
              ].map(([step, label, status]) => (
                <div key={step} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-sage/30 bg-sage/10 text-sm font-black text-sage">
                    {step}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-porcelain">{label}</p>
                    <p className="mt-0.5 text-xs text-smoke">{status}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-4 text-sm text-mist">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Ringkasan order</p>
              <div className="flex items-center justify-between">
                <span>Total item</span>
                <strong className="text-porcelain">{productTypes}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Total qty</span>
                <strong className="text-porcelain">{totalQty}</strong>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <span>Total harga</span>
                <strong className="text-lg text-porcelain">{formatCurrency(getSubtotal)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Metode ambil</span>
                <strong className="text-right text-porcelain">{pickupMethodLabel}</strong>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>Nama customer</span>
                <strong className="text-right text-porcelain">{customerName || '-'}</strong>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>Nomor WhatsApp</span>
                <strong className="break-all text-right text-porcelain">{customerPhoneDisplay || '-'}</strong>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-sage/20 bg-sage/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage">Catatan checkout</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-mist">
                <li>Checkout akan membuka WhatsApp admin.</li>
                <li>Harga dan stok akan dikonfirmasi kembali oleh admin.</li>
                <li>Keranjang tidak otomatis dikosongkan setelah WhatsApp terbuka.</li>
                <li>Keranjang tersimpan di perangkat ini.</li>
                <li>Keranjang bisa direset saat berganti akun admin.</li>
              </ul>
            </div>

            <div className="mt-5 rounded-md border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Recovery cart</p>
              <p className="mt-2 text-sm leading-6 text-mist">
                Refresh untuk mengambil stok, harga, nama, foto, dan status produk terbaru dari katalog.
              </p>
              <button
                type="button"
                onClick={handleRefreshCart}
                disabled={items.length === 0 || isRefreshingCart}
                className="btn-secondary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRefreshingCart ? 'Refresh Keranjang...' : 'Refresh Keranjang'}
              </button>
              {cartRefreshMessage && (
                <p className="mt-3 text-sm leading-6 text-sage">{cartRefreshMessage}</p>
              )}
            </div>

            <div className="mt-5 space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">2. Isi data</p>
                <p className="mt-2 text-sm leading-6 text-mist">
                  Semua field opsional, tapi membantu admin memproses order lebih cepat.
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
                <span>Nomor WhatsApp</span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={checkoutInfo.customerPhone ?? ''}
                  onChange={(event) => setCheckoutInfo((current) => ({ ...current, customerPhone: event.target.value }))}
                  className="field-control"
                  placeholder="08xxxxxxxxxx"
                />
                <span className="text-xs leading-5 text-smoke">Contoh: 08xxxxxxxxxx</span>
                {isCustomerPhoneTooShort && (
                  <span className="text-xs leading-5 text-blush">
                    Nomor WhatsApp terlalu pendek. Kosongkan atau isi nomor yang lebih lengkap.
                  </span>
                )}
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-smoke">3. Preview WhatsApp</p>
                <span className="text-xs text-smoke">Scroll untuk cek detail</span>
              </div>
              <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-white/5 p-3 text-xs leading-6 text-mist sm:max-h-60 lg:max-h-72">
                {whatsappPreview}
              </pre>
            </div>

            {isCartInvalid && (
              <div className="mt-4 rounded-md border border-blush/30 bg-blush/10 p-4 text-sm leading-6 text-blush">
                <p className="font-semibold text-porcelain">Checkout dinonaktifkan.</p>
                <p className="mt-1">Perbaiki item bertanda warning agar WhatsApp checkout bisa digunakan.</p>
              </div>
            )}

            {errorMessage && <p className="error-panel mt-4 text-sm">{errorMessage}</p>}

            {isCheckoutDisabled && checkoutDisabledReason && (
              <p className="mt-4 rounded-md border border-champagne/30 bg-champagne/10 px-3 py-2 text-sm leading-6 text-champagne">
                {checkoutDisabledReason}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckoutDisabled}
              className="btn-primary mt-5 w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingOrder ? 'Menyimpan Order...' : isCartInvalid ? 'Perbaiki Keranjang Dulu' : isCustomerPhoneTooShort ? 'Periksa Nomor WhatsApp' : 'Checkout via WhatsApp'}
            </button>

            <button
              type="button"
              onClick={() => handleClearCart()}
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
