import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetOrderByToken = vi.fn();

vi.mock('../services/trackOrderService', () => ({
  getOrderByToken: (token: string) => mockGetOrderByToken(token),
  buildTrackingUrl: (token: string) => `/track?token=${encodeURIComponent(token)}`,
}));

import TrackOrder from '../pages/TrackOrder';

describe('TrackOrder page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input and submit button', () => {
    render(
      <MemoryRouter>
        <TrackOrder />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/token pelacakan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lacak/i })).toBeInTheDocument();
  });

  it('auto-loads order from ?token= query param', async () => {
    mockGetOrderByToken.mockResolvedValue({
      tracking_token: 'tok123',
      status: 'pending',
      total: 150000,
      items: [{ product_id: 'x', name: 'Item A', slug: 'item-a', category: 'cat', price: 75000, qty: 2, subtotal: 150000, image_url: null }],
      pickup_method: null,
      customer_note: null,
      shipping_address: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/track?token=tok123']}>
        <TrackOrder />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/total/i)).toBeInTheDocument();
    expect(screen.getByText('Item A')).toBeInTheDocument();
  });

  it('shows not found message when token invalid', async () => {
    mockGetOrderByToken.mockResolvedValue(null);
    render(
      <MemoryRouter>
        <TrackOrder />
      </MemoryRouter>,
    );
    const input = screen.getByLabelText(/token pelacakan/i);
    await userEvent.type(input, 'bad-token');
    await userEvent.click(screen.getByRole('button', { name: /lacak/i }));

    expect(await screen.findByText(/tidak ditemukan/i)).toBeInTheDocument();
  });

  it('shows error when lookup throws', async () => {
    mockGetOrderByToken.mockRejectedValue(new Error('DB Error'));
    render(
      <MemoryRouter>
        <TrackOrder />
      </MemoryRouter>,
    );
    const input = screen.getByLabelText(/token pelacakan/i);
    await userEvent.type(input, 'tok');
    await userEvent.click(screen.getByRole('button', { name: /lacak/i }));

    expect(await screen.findByText(/DB Error/i)).toBeInTheDocument();
  });
});
