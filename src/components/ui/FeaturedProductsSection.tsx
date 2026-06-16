import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/formatCurrency';
import { getFeaturedActiveProducts } from '../../services/productService';
import type { Product } from '../../types/types';

function getProductInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function ProductImageFallback({ name }: { name: string }) {
  return (
    <div className="flex h-44 w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(166,216,194,0.16),rgba(226,196,130,0.08))] text-center">
      <span className="grid h-12 w-12 place-items-center rounded-lg border border-sage/30 bg-ink/60 text-base font-black text-sage">
        {getProductInitials(name) || 'AZ'}
      </span>
      <span className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Foto menyusul</span>
    </div>
  );
}

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);
      setHasLoadError(false);

      try {
        const data = await getFeaturedActiveProducts(3);
        if (isMounted) setProducts(data);
      } catch {
        if (isMounted) {
          setProducts([]);
          setHasLoadError(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const markImageAsBroken = (productId: string) => {
    setBrokenImageIds((current) => {
      if (current.has(productId)) return current;

      const next = new Set(current);
      next.add(productId);
      return next;
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Produk terbaru</p>
          <h2 className="section-title mt-3">Intip barang yang siap dipesan.</h2>
        </div>

        <Link to="/products" className="btn-secondary w-fit">
          Lihat Semua Produk
        </Link>
      </div>

      {isLoading && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="surface-card p-3">
              <div className="h-44 animate-pulse rounded-md bg-white/7" />
              <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/7" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div className="state-panel mt-8 border-dashed p-8 text-center">
          <p className="text-lg font-semibold text-porcelain">
            {hasLoadError ? 'Preview produk belum bisa dimuat.' : 'Produk aktif belum tersedia.'}
          </p>
          <p className="mt-2 text-sm text-smoke">
            {hasLoadError
              ? 'Homepage tetap bisa digunakan. Buka katalog untuk mencoba memuat daftar produk lengkap.'
              : 'Katalog akan otomatis menampilkan produk yang sudah diaktifkan admin.'}
          </p>
          <Link to="/products" className="btn-primary mt-5">
            Buka Katalog
          </Link>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {products.map((product) => {
            const shouldShowImage = Boolean(product.image_url) && !brokenImageIds.has(product.id);

            return (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="surface-card group overflow-hidden p-3 transition hover:-translate-y-1 hover:border-sage/35 hover:bg-white/8"
              >
                <div className="relative overflow-hidden rounded-md border border-white/10 bg-ink/70">
                  {shouldShowImage ? (
                    <img
                      src={product.image_url ?? ''}
                      alt={product.name}
                      onError={() => markImageAsBroken(product.id)}
                      className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
                    />
                  ) : (
                    <ProductImageFallback name={product.name} />
                  )}

                  <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-ink/78 px-3 py-1 text-xs font-semibold text-mist backdrop-blur">
                    {product.category}
                  </span>
                </div>

                <div className="p-2 pt-4">
                  <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-porcelain group-hover:text-sage">
                    {product.name}
                  </h3>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-sage">{formatCurrency(product.price)}</span>
                    <span className={product.stock > 0 ? 'text-smoke' : 'text-blush'}>
                      {product.stock > 0 ? `${product.stock} stok` : 'Stok habis'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
