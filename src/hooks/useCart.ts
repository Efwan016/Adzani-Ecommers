import { useEffect, useMemo, useState } from 'react';
import type { CartItem, Product } from '../types/types';

const STORAGE_KEY = 'adzani_cart';
const CART_CHANGE_EVENT = 'adzani_cart_change';

function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent<CartItem[]>(CART_CHANGE_EVENT, { detail: items }));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  useEffect(() => {
    const syncCart = (event: Event) => {
      if (event instanceof CustomEvent && Array.isArray(event.detail)) {
        setItems(event.detail as CartItem[]);
        return;
      }

      setItems(readStoredCart());
    };

    window.addEventListener('storage', syncCart);
    window.addEventListener(CART_CHANGE_EVENT, syncCart);

    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener(CART_CHANGE_EVENT, syncCart);
    };
  }, []);

  const updateCart = (updater: (current: CartItem[]) => CartItem[]) => {
    setItems((current) => {
      const next = updater(current);
      queueMicrotask(() => writeStoredCart(next));
      return next;
    });
  };

  const addToCart = (product: Product, qty = 1) => {
    updateCart((current) => {
      const nextQty = Math.max(1, qty);
      const availableQty = Math.min(nextQty, product.stock);
      const existing = current.find((item) => item.product.id === product.id);

      if (!existing) {
        return product.stock > 0
          ? [...current, { product, qty: availableQty }]
          : current;
      }

      const updatedQty = Math.min(existing.qty + availableQty, product.stock);
      if (updatedQty <= 0 || product.stock <= 0) return current;

      return current.map((item) =>
        item.product.id === product.id
          ? { ...item, qty: updatedQty }
          : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    updateCart((current) => current.filter((item) => item.product.id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    updateCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) return item;

          const nextQty = Math.max(1, qty);
          return { ...item, qty: Math.min(nextQty, item.product.stock) };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const clearCart = () => updateCart(() => []);

  const replaceCart = (nextItems: CartItem[]) => updateCart(() => nextItems);

  const getSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [items]
  );

  const getTotalItems = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    replaceCart,
    getSubtotal,
    getTotalItems,
  };
}
