-- Migration: Add shipping_address to public.orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text NULL;

-- Update get_order_by_token function to also return shipping_address
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token text)
RETURNS TABLE (
  tracking_token text,
  status text,
  total bigint,
  items jsonb,
  pickup_method text,
  customer_note text,
  shipping_address text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.tracking_token,
    o.status,
    o.total,
    o.items,
    o.pickup_method,
    o.customer_note,
    o.shipping_address,
    o.created_at,
    o.updated_at
  FROM public.orders o
  WHERE o.tracking_token = p_token;
$$;

-- Grant execution to anon + authenticated
GRANT EXECUTE ON FUNCTION public.get_order_by_token(text) TO anon, authenticated;
