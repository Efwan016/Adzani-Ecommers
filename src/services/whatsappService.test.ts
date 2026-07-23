import { describe, expect, it } from 'vitest';
import type { CartItem, Product } from '../types/types';
import {
  generateWhatsAppOrderMessage,
  getWhatsAppCheckoutUrl,
  getWhatsAppUrlForMessage,
} from './whatsappService';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Voucher 50rb',
    slug: 'voucher-50rb',
    description: '',
    category: 'voucher',
    price: 50000,
    cost_price: null,
    stock: 100,
    image_url: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCartItem(qty = 2): CartItem {
  return { product: makeProduct(), qty };
}

describe('whatsappService', () => {
  it('generateWhatsAppOrderMessage includes items and total', () => {
    const message = generateWhatsAppOrderMessage([makeCartItem(3)], {
      customerName: 'Budi',
      customerPhone: '08123456789',
      pickupMethod: 'Ambil di toko',
    });
    expect(message).toContain('Halo Admin Adzani');
    expect(message).toContain('Voucher 50rb');
    expect(message).toContain('Budi');
    expect(message).toContain('Total:');
    expect(message).toContain('Rp');
    expect(message).toContain('150.000');
  });

  it('getWhatsAppUrlForMessage builds wa.me link with encoded text', () => {
    const url = getWhatsAppUrlForMessage('Halo Admin');
    expect(url).toContain('https://wa.me/');
    expect(url).toContain('text=');
  });

  it('getWhatsAppCheckoutUrl throws on empty cart', () => {
    expect(() => getWhatsAppCheckoutUrl([])).toThrow(/kosong/);
  });

  it('getWhatsAppUrlForMessage throws when no admin phone configured', () => {
    const prev = import.meta.env.VITE_WHATSAPP_ADMIN;
    (import.meta.env as Record<string, unknown>).VITE_WHATSAPP_ADMIN = '';
    expect(() => getWhatsAppUrlForMessage('hi')).toThrow(/admin/);
    (import.meta.env as Record<string, unknown>).VITE_WHATSAPP_ADMIN = prev;
  });
});
