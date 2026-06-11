import type { CartItem } from '../types/types';
import { formatCurrency } from '../lib/formatCurrency';

export function generateWhatsAppOrderMessage(items: CartItem[]): string {
  const lines = items.map((item, index) => {
    const subtotal = item.product.price * item.qty;
    return `${index + 1}. ${item.product.name} x ${item.qty}\nHarga: ${formatCurrency(item.product.price)}\nSubtotal: ${formatCurrency(subtotal)}`;
  });

  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  return [
    'Halo Admin Adzani, saya mau order:',
    '',
    ...lines,
    '',
    `Total: ${formatCurrency(total)}`,
    '',
    'Mohon info ketersediaannya.',
  ].join('\n');
}

export function getWhatsAppCheckoutUrl(items: CartItem[]): string {
  const phone = import.meta.env.VITE_WHATSAPP_ADMIN as string | undefined;

  if (!phone || !phone.trim()) {
    throw new Error('Nomor WhatsApp admin belum diatur. Tambahkan VITE_WHATSAPP_ADMIN di .env');
  }

  if (items.length === 0) {
    throw new Error('Keranjang kosong, tidak ada item untuk checkout.');
  }

  const message = encodeURIComponent(generateWhatsAppOrderMessage(items));

  return `https://wa.me/${phone.trim()}?text=${message}`;
}
