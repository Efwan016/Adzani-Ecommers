import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.fn();

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import { buildTrackingUrl, getOrderByToken } from './trackOrderService';

describe('trackOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOrderByToken returns order on match', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          tracking_token: 'tok123',
          status: 'pending',
          total: 100000,
          items: [],
          pickup_method: null,
          customer_note: null,
          shipping_address: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const order = await getOrderByToken('tok123');
    expect(order?.status).toBe('pending');
    expect(mockRpc).toHaveBeenCalledWith('get_order_by_token', { p_token: 'tok123' });
  });

  it('getOrderByToken returns null when not found', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const order = await getOrderByToken('missing');
    expect(order).toBeNull();
  });

  it('getOrderByToken throws on empty token', async () => {
    await expect(getOrderByToken('  ')).rejects.toThrow(/kosong/);
  });

  it('buildTrackingUrl encodes token', () => {
    expect(buildTrackingUrl('a b/c')).toBe('/track?token=a%20b%2Fc');
  });
});
