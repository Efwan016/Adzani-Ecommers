export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  cost_price: number | null;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  product: Product;
  qty: number;
};

export type OrderItem = {
  product_id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  qty: number;
  subtotal: number;
  image_url: string | null;
};

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type Order = {
  id: string;
  customer_name: string | null;
  customer_phone?: string | null;
  pickup_method: string | null;
  customer_note: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  whatsapp_message: string | null;
  stock_deducted?: boolean;
  stock_deducted_at?: string | null;
  stock_restored?: boolean;
  stock_restored_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderStatusLog = {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  changed_by_email: string | null;
  note: string | null;
  created_at: string;
};
