import { useEffect, useState } from 'react';
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

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartFeedback, setCartFeedback] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);
      setCartFeedback('');

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

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      return;
    }

    addToCart(product, 1);
    setCartFeedback(`${product.name} masuk ke keranjang.`);
  };

  return (
    <section className="page-shell">
      {isLoading && <div className="state-panel">Memuat produk...</div>}

      {error && <div className="error-panel">{error}</div>}

      {!isLoading && !error && !product && (
        <div className="state-panel border-dashed p-10 text-center">
          Produk tidak ditemukan.
        </div>
      )}

      {!isLoading && !error && product && (() => {
        const stockMeta = getStockMeta(product.stock);
        const description = product.description || 'Detail produk akan dikonfirmasi oleh admin saat checkout.';

        return (
          <div className="space-y-5">
            <Link to="/products" className="inline-flex text-sm font-semibold text-sage hover:text-porcelain">
              Kembali ke katalog
            </Link>

            <article className="surface-card grid gap-6 overflow-hidden p-3 lg:grid-cols-[1.04fr_0.96fr] lg:p-4">
              <div className="relative min-h-[22rem] overflow-hidden rounded-md border border-white/10 bg-ink/70 sm:min-h-[28rem] lg:min-h-[34rem]">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full min-h-[22rem] w-full object-cover sm:min-h-[28rem] lg:min-h-[34rem]"
                  />
                ) : (
                  <div className="flex h-full min-h-[22rem] w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(166,216,194,0.16),rgba(226,196,130,0.08))] text-center sm:min-h-[28rem] lg:min-h-[34rem]">
                    <span className="grid h-20 w-20 place-items-center rounded-lg border border-sage/30 bg-ink/60 text-2xl font-black text-sage">
                      {getProductInitials(product.name) || 'AZ'}
                    </span>
                    <span className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Foto produk menyusul</span>
                  </div>
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

                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`rounded-md border px-5 py-4 text-sm font-bold transition ${
                      product.stock === 0
                        ? 'cursor-not-allowed border-white/10 bg-white/5 text-smoke'
                        : 'border-sage/30 bg-sage text-ink shadow-lg shadow-sage/15 hover:bg-[#b7e3d0]'
                    }`}
                  >
                    {product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                  </button>
                  <Link to="/cart" className="btn-secondary px-5 py-4">
                    Buka Keranjang
                  </Link>
                </div>

                {cartFeedback && (
                  <div className="rounded-md border border-sage/30 bg-sage/10 p-4 text-sm text-sage">
                    <p className="font-semibold">{cartFeedback}</p>
                    <Link to="/cart" className="mt-2 inline-flex font-semibold text-porcelain hover:text-sage">
                      Lanjut cek keranjang
                    </Link>
                  </div>
                )}

                <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
                  <div className="surface-muted p-3">
                    <p className="text-sm font-semibold text-porcelain">Checkout WhatsApp</p>
                    <p className="mt-2 text-xs leading-5 text-smoke">Order dibuka dari halaman cart.</p>
                  </div>
                  <div className="surface-muted p-3">
                    <p className="text-sm font-semibold text-porcelain">Stok admin</p>
                    <p className="mt-2 text-xs leading-5 text-smoke">Jumlah stok mengikuti dashboard.</p>
                  </div>
                  <div className="surface-muted p-3">
                    <p className="text-sm font-semibold text-porcelain">Konfirmasi manual</p>
                    <p className="mt-2 text-xs leading-5 text-smoke">Admin cek ketersediaan sebelum transaksi.</p>
                  </div>
                </div>
              </div>
            </article>
            </div>
          );
        })()}
    </section>
  );
}
