import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartItem, Product } from '../types/types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Charger 20W',
    slug: 'charger-20w',
    description: '',
    category: 'aksesoris',
    price: 100000,
    cost_price: null,
    stock: 10,
    image_url: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCartItem(overrides: Partial<Product> = {}, qty = 2): CartItem {
  return { product: makeProduct(overrides), qty };
}

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: () => mockFrom(),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import { createOrder, deleteOrder, getOrdersAdmin, updateOrderStatus, updateOrderAdminNote } from './orderService';

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () => ({ data: { id: 'order-1', tracking_token: 'tok123' }, error: null }),
        }),
      }),
      select: () => ({ order: () => ({ ascending: () => ({ data: [], error: null }) }) }),
      delete: () => ({ eq: () => ({ error: null }) }),
    });
    mockRpc.mockResolvedValue({ data: { id: 'order-1' }, error: null });
  });

  it('createOrder returns id and tracking_token', async () => {
    const result = await createOrder({ items: [makeCartItem()] });
    expect(result.id).toBe('order-1');
    expect(result.tracking_token).toBe('tok123');
  });

  it('createOrder throws when items empty', async () => {
    await expect(createOrder({ items: [] })).rejects.toThrow(/kosong/);
  });

  it('getOrdersAdmin returns orders', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        order: () => ({ data: [{ id: 'a' }], error: null }),
      }),
    });
    const orders = await getOrdersAdmin();
    expect(orders).toHaveLength(1);
  });

  it('updateOrderStatus calls rpc process_order_status', async () => {
    await updateOrderStatus('order-1', 'confirmed');
    expect(mockRpc).toHaveBeenCalledWith('process_order_status', {
      order_id: 'order-1',
      next_status: 'confirmed',
    });
  });

  it('deleteOrder calls delete with id', async () => {
    const eq = vi.fn(() => ({ error: null }));
    mockFrom.mockReturnValue({ delete: () => ({ eq }) });
    await deleteOrder('order-1');
    expect(eq).toHaveBeenCalledWith('id', 'order-1');
  });

  it('updateOrderAdminNote calls update with note', async () => {
    const single = vi.fn(() => ({ data: { id: 'order-1', admin_note: 'catatan baru' }, error: null }));
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });

    const result = await updateOrderAdminNote('order-1', 'catatan baru');
    expect(update).toHaveBeenCalledWith({ admin_note: 'catatan baru' });
    expect(eq).toHaveBeenCalledWith('id', 'order-1');
    expect(result.admin_note).toBe('catatan baru');
  });
});
