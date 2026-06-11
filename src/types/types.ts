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
