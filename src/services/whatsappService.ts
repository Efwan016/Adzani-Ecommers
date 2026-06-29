import type { CartItem } from '../types/types';
import { formatCurrency } from '../lib/formatCurrency';

export type PickupMethod = 'Ambil di toko' | 'Tanya admin dulu' | '';

export type CheckoutInfo = {
  customerName?: string;
  orderNote?: string;
  pickupMethod?: PickupMethod;
};

export function generateWhatsAppOrderMessage(items: CartItem[], checkoutInfo: CheckoutInfo = {}): string {
  const lines = items.map((item, index) => {
    const subtotal = item.product.price * item.qty;
    return [
      `${index + 1}. ${item.product.name}`,
      `Qty: ${item.qty}`,
      `Harga: ${formatCurrency(item.product.price)}`,
      `Subtotal: ${formatCurrency(subtotal)}`,
    ].join('\n');
  });

  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const customerName = checkoutInfo.customerName?.trim();
  const orderNote = checkoutInfo.orderNote?.trim();
  const pickupMethod = checkoutInfo.pickupMethod?.trim();

  const customerLines = [
    customerName ? `Nama: ${customerName}` : null,
    pickupMethod ? `Metode ambil: ${pickupMethod}` : null,
    orderNote ? `Catatan: ${orderNote}` : null,
  ].filter(Boolean);

  return [
    'Halo Admin Adzani, saya mau order:',
    '',
    ...(customerLines.length > 0 ? ['Data customer:', ...customerLines, ''] : []),
    'Detail produk:',
    ...lines,
    '',
    `Total: ${formatCurrency(total)}`,
    '',
    'Mohon info ketersediaannya.',
  ].join('\n');
}

export function getWhatsAppCheckoutUrl(items: CartItem[], checkoutInfo: CheckoutInfo = {}): string {
  if (items.length === 0) {
    throw new Error('Keranjang kosong, tidak ada item untuk checkout.');
  }

  return getWhatsAppUrlForMessage(generateWhatsAppOrderMessage(items, checkoutInfo));
}

export function getWhatsAppUrlForMessage(messageText: string): string {
  const phone = import.meta.env.VITE_WHATSAPP_ADMIN as string | undefined;

  if (!phone || !phone.trim()) {
    throw new Error('Nomor WhatsApp admin belum diatur. Tambahkan VITE_WHATSAPP_ADMIN di .env');
  }

  if (!messageText.trim()) {
    throw new Error('Pesan WhatsApp kosong.');
  }

  const message = encodeURIComponent(messageText);

  return `https://wa.me/${phone.trim()}?text=${message}`;
}
