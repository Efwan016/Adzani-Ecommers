import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { getProductBySlug } from '../services/productService';
import type { Product } from '../types/types';
import { formatCurrency } from '../lib/formatCurrency';

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
      copy: 'Produk ini belum bisa ditambahkan ke keranjang.',
      className: 'border-blush/30 bg-blush/12 text-blush',
    };
  }

  if (stock <= 3) {
    return {
      label: `Sisa ${stock} item`,
      copy: 'Stok terbatas, admin akan konfirmasi ulang saat checkout.',
      className: 'border-champagne/30 bg-champagne/12 text-champagne',
    };
  }

  return {
    label: `${stock} item tersedia`,
    copy: 'Stok mengikuti data yang dikelola admin.',
    className: 'border-sage/30 bg-sage/12 text-sage',
  };
}

function clampQty(value: number, maxQty: number) {
  if (maxQty <= 0) return 0;
  return Math.min(Math.max(1, value), maxQty);
}

function ProductImageFallback({ name }: { name: string }) {
  return (
    <div className="flex h-full min-h-[22rem] w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(166,216,194,0.16),rgba(226,196,130,0.08))] text-center sm:min-h-[28rem] lg:min-h-[34rem]">
      <span className="grid h-20 w-20 place-items-center rounded-lg border border-sage/30 bg-ink/60 text-2xl font-black text-sage">
        {getProductInitials(name) || 'AZ'}
      </span>
      <span className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Foto produk menyusul</span>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-5 w-36 animate-pulse rounded bg-white/10" />
      <div className="surface-card grid gap-6 overflow-hidden p-3 lg:grid-cols-[1.04fr_0.96fr] lg:p-4">
        <div className="min-h-[22rem] animate-pulse rounded-md border border-white/10 bg-white/7 sm:min-h-[28rem] lg:min-h-[34rem]" />
        <div className="space-y-6 p-2 sm:p-4 lg:p-5">
          <div className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-10 w-4/5 animate-pulse rounded bg-white/10" />
            <div className="h-10 w-2/3 animate-pulse rounded bg-white/7" />
          </div>
          <div className="h-24 animate-pulse rounded-md bg-white/7" />
          <div className="h-12 animate-pulse rounded-md bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-white/7" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-white/7" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/7" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-14 animate-pulse rounded-md bg-white/10" />
            <div className="h-14 animate-pulse rounded-md bg-white/7" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { items, addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartFeedback, setCartFeedback] = useState('');
  const [qty, setQty] = useState(1);
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);
      setCartFeedback('');
      setQty(1);
      setImageBroken(false);

      try {
        const data = await getProductBySlug(slug ?? '');
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat produk');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  const cartQty = useMemo(() => {
    if (!product) return 0;
    return items.find((item) => item.product.id === product.id)?.qty ?? 0;
  }, [items, product]);

  const availableToAdd = product ? Math.max(product.stock - cartQty, 0) : 0;
  const isOutOfStock = !product || product.stock <= 0;
  const canAddToCart = Boolean(product) && availableToAdd > 0;

  useEffect(() => {
    setQty((current) => clampQty(current, availableToAdd));
  }, [availableToAdd]);

  const updateQty = (nextQty: number) => {
    setQty(clampQty(nextQty, availableToAdd));
  };

  const handleAddToCart = () => {
    if (!product || !canAddToCart) {
      return;
    }

    const safeQty = clampQty(qty, availableToAdd);
    addToCart(product, safeQty);
    setCartFeedback(`${product.name} ditambahkan ke keranjang (${safeQty} item).`);
  };

  return (
    <section className="page-shell">
      {isLoading && <ProductDetailSkeleton />}

      {error && <div className="error-panel">{error}</div>}

      {!isLoading && !error && !product && (
        <div className="state-panel mx-auto max-w-2xl border-dashed p-8 text-center sm:p-10">
          <p className="text-xl font-semibold text-porcelain">Produk tidak ditemukan.</p>
          <p className="mt-3 text-sm leading-6 text-smoke">
            Produk mungkin sudah tidak aktif atau slug tidak tersedia. Kamu bisa kembali ke katalog untuk melihat produk yang masih bisa dipesan.
          </p>
          <Link to="/products" className="btn-secondary mt-6">
            Kembali ke Katalog
          </Link>
        </div>
      )}

      {!isLoading && !error && product && (() => {
        const stockMeta = getStockMeta(product.stock);
        const description = product.description || 'Detail produk akan dikonfirmasi oleh admin saat checkout.';
        const shouldShowImage = Boolean(product.image_url) && !imageBroken;

        const infoCards = [
          {
            title: product.stock > 0 ? 'Stok tersedia' : 'Stok habis',
            copy: product.stock > 0 ? `${availableToAdd} item masih bisa ditambahkan.` : 'Produk belum bisa masuk keranjang saat ini.',
          },
          {
            title: 'Checkout via WhatsApp',
            copy: 'Order dibuka dari halaman cart dan langsung dikirim ke admin.',
          },
          {
            title: 'Harga dikonfirmasi admin',
            copy: 'Harga katalog menjadi acuan, admin tetap konfirmasi ulang sebelum transaksi.',
          },
          {
            title: 'Status bisa berubah',
            copy: 'Produk bisa dinonaktifkan admin saat stok atau ketersediaan berubah.',
          },
        ];

        return (
          <div className="space-y-5">
            <Link to="/products" className="inline-flex text-sm font-semibold text-sage hover:text-porcelain">
              Kembali ke katalog
            </Link>

            <article className="surface-card grid gap-6 overflow-hidden p-3 lg:grid-cols-[1.04fr_0.96fr] lg:p-4">
              <div className="relative min-h-[22rem] overflow-hidden rounded-md border border-white/10 bg-ink/70 sm:min-h-[28rem] lg:min-h-[34rem]">
                {shouldShowImage ? (
                  <img
                    src={product.image_url ?? ''}
                    alt={product.name}
                    onError={() => setImageBroken(true)}
                    className="h-full min-h-[22rem] w-full object-cover sm:min-h-[28rem] lg:min-h-[34rem]"
                  />
                ) : (
                  <ProductImageFallback name={product.name} />
                )}

                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-ink/78 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-mist backdrop-blur">
                  {product.category}
                </div>

                {product.stock <= 0 && (
                  <div className="absolute inset-x-4 bottom-4 rounded-md border border-blush/30 bg-ink/84 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-blush backdrop-blur">
                    Produk sedang habis
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6 p-2 text-porcelain sm:p-4 lg:p-5">
                <div>
                  <p className="eyebrow">Detail produk</p>
                  <h1 className="mt-3 text-3xl font-semibold leading-tight text-porcelain sm:text-4xl lg:text-5xl">
                    {product.name}
                  </h1>
                </div>

                <div className="surface-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">Harga</p>
                  <p className="mt-2 text-3xl font-semibold text-sage sm:text-4xl">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-smoke">Harga akhir dikonfirmasi admin saat checkout WhatsApp.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                  <span className={`rounded-full border px-4 py-2 text-sm font-bold ${stockMeta.className}`}>
                    {stockMeta.label}
                  </span>
                  <p className="text-sm leading-6 text-mist">{stockMeta.copy}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-porcelain">Deskripsi</h2>
                  <p className="mt-3 whitespace-pre-line leading-8 text-mist">{description}</p>
                </div>

                <div className="surface-muted space-y-4 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-porcelain">Jumlah</p>
                      <p className="mt-1 text-xs text-smoke">
                        {cartQty > 0 ? `${cartQty} item sudah ada di keranjang.` : 'Pilih jumlah sebelum menambahkan.'}
                      </p>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-smoke">
                      Maks {availableToAdd} item
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                    <div className="grid grid-cols-[3rem_minmax(4rem,6rem)_3rem] overflow-hidden rounded-md border border-white/10 bg-ink/70">
                      <button
                        type="button"
                        onClick={() => updateQty(qty - 1)}
                        disabled={!canAddToCart || qty <= 1}
                        className="min-h-12 border-r border-white/10 text-lg font-bold text-porcelain transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-smoke"
                        aria-label="Kurangi jumlah"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={canAddToCart ? 1 : 0}
                        max={availableToAdd}
                        value={qty}
                        onChange={(event) => updateQty(Number(event.target.value))}
                        disabled={!canAddToCart}
                        className="min-h-12 bg-transparent px-2 text-center text-base font-bold text-porcelain outline-none disabled:text-smoke"
                        aria-label="Jumlah produk"
                      />
                      <button
                        type="button"
                        onClick={() => updateQty(qty + 1)}
                        disabled={!canAddToCart || qty >= availableToAdd}
                        className="min-h-12 border-l border-white/10 text-lg font-bold text-porcelain transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-smoke"
                        aria-label="Tambah jumlah"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!canAddToCart}
                      className={`rounded-md border px-5 py-4 text-sm font-bold transition ${
                        canAddToCart
                          ? 'border-sage/30 bg-sage text-ink shadow-lg shadow-sage/15 hover:bg-[#b7e3d0]'
                          : 'cursor-not-allowed border-white/10 bg-white/5 text-smoke'
                      }`}
                    >
                      {isOutOfStock ? 'Stok Habis' : availableToAdd <= 0 ? 'Stok Sudah di Cart' : 'Tambah ke Keranjang'}
                    </button>
                  </div>
                </div>

                {cartFeedback && (
                  <div className="rounded-md border border-sage/30 bg-sage/10 p-4 text-sm text-sage">
                    <p className="font-semibold">{cartFeedback}</p>
                    <Link to="/cart" className="mt-2 inline-flex font-semibold text-porcelain hover:text-sage">
                      Lanjut ke Cart
                    </Link>
                  </div>
                )}

                <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                  {infoCards.map((item) => (
                    <div key={item.title} className="surface-muted p-3">
                      <p className="text-sm font-semibold text-porcelain">{item.title}</p>
                      <p className="mt-2 text-xs leading-5 text-smoke">{item.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        );
      })()}
    </section>
  );
}
