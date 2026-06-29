import { supabase } from './supabaseClient';
import type { CartItem, Order, OrderItem, OrderStatus } from '../types/types';
import type { CheckoutInfo } from './whatsappService';

export type CreateOrderInput = {
  items: CartItem[];
  checkoutInfo?: CheckoutInfo;
  whatsappMessage?: string;
};

export type CreateOrderResult = {
  id: string;
};

function trimToNullable(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function mapCartItemsToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    product_id: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    category: item.product.category,
    price: item.product.price,
    qty: item.qty,
    subtotal: item.product.price * item.qty,
    image_url: item.product.image_url,
  }));
}

function createOrderId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  throw new Error('Browser belum mendukung pembuatan ID order.');
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  if (input.items.length === 0) {
    throw new Error('Keranjang kosong, tidak ada order untuk disimpan.');
  }

  const orderItems = mapCartItemsToOrderItems(input.items);
  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const orderId = createOrderId();

  const { error } = await supabase
    .from('orders')
    .insert([
      {
        id: orderId,
        customer_name: trimToNullable(input.checkoutInfo?.customerName),
        pickup_method: trimToNullable(input.checkoutInfo?.pickupMethod),
        customer_note: trimToNullable(input.checkoutInfo?.orderNote),
        items: orderItems,
        total,
        status: 'pending',
        whatsapp_message: trimToNullable(input.whatsappMessage),
      },
    ]);

  if (error) {
    throw new Error(error.message);
  }

  return { id: orderId };
}

export async function getOrdersAdmin(): Promise<Order[]> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Order[];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Order;
}

export async function deleteOrder(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
