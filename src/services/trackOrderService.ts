import { supabase } from './supabaseClient';

export type TrackedOrder = {
  tracking_token: string;
  status: string;
  total: number;
  items: Array<{
    product_id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    qty: number;
    subtotal: number;
    image_url: string | null;
  }>;
  pickup_method: string | null;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
};

export async function getOrderByToken(token: string): Promise<TrackedOrder | null> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('Token pelacakan tidak boleh kosong.');
  }

  const { data, error } = await supabase.rpc('get_order_by_token', {
    p_token: cleanToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TrackedOrder[];
  return rows.length > 0 ? rows[0] : null;
}

export function buildTrackingUrl(token: string): string {
  return `/track?token=${encodeURIComponent(token.trim())}`;
}
