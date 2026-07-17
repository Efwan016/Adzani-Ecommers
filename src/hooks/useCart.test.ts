import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../types/types';
import { useCart } from './useCart';

vi.mock('../services/supabaseClient', () => ({
  supabase: null,
}));

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    name: 'Case Silicone iPhone 15',
    slug: 'case-silicone-iphone-15',
    description: 'Soft case',
    category: 'case',
    price: 75000,
    cost_price: null,
    stock: 5,
    image_url: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function updateCartInAct(action: () => void) {
  await act(async () => {
    action();
    await Promise.resolve();
  });
}

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds products and calculates totals', async () => {
    const { result } = renderHook(() => useCart());

    await updateCartInAct(() => {
      result.current.addToCart(makeProduct(), 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(2);
    expect(result.current.getTotalItems).toBe(2);
    expect(result.current.getSubtotal).toBe(150000);

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('adzani_cart') ?? '[]')).toHaveLength(1);
    });
  });

  it('does not add more than available stock', async () => {
    const { result } = renderHook(() => useCart());

    await updateCartInAct(() => {
      result.current.addToCart(makeProduct({ stock: 3 }), 10);
    });

    expect(result.current.items[0].qty).toBe(3);
  });

  it('updates, removes, and clears items', async () => {
    const { result } = renderHook(() => useCart());
    const product = makeProduct();

    await updateCartInAct(() => {
      result.current.addToCart(product, 2);
      result.current.updateQty(product.id, 4);
    });

    expect(result.current.items[0].qty).toBe(4);

    await updateCartInAct(() => {
      result.current.removeFromCart(product.id);
    });

    expect(result.current.items).toHaveLength(0);

    await updateCartInAct(() => {
      result.current.addToCart(product, 1);
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });
});
