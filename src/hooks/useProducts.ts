import { useCallback, useEffect, useState } from 'react';
import { getActiveProducts } from '../services/productService';
import type { Product } from '../types/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getActiveProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat produk');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, isLoading, error, loadProducts };
}
