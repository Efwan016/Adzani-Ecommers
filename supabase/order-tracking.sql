-- Customer order tracking (Phase 3).
-- Adds a non-guessable tracking_token so customers can look up their own order
-- without logging in and WITHOUT exposing the internal order UUID.
-- Customers call public.get_order_by_token(p_token) which is SECURITY DEFINER
-- and only returns safe, non-sensitive columns.

-- 1) Tracking token column on orders.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token text;

-- Unique index (deferred-safe: existing rows may share NULL, so guard the
-- unique constraint to only apply to non-null tokens).
DROP INDEX IF EXISTS orders_tracking_token_key;
CREATE UNIQUE INDEX orders_tracking_token_key ON public.orders (tracking_token)
  WHERE tracking_token IS NOT NULL;

-- 2) Auto-fill tracking_token on insert if not provided.
CREATE OR REPLACE FUNCTION public.set_order_tracking_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tracking_token IS NULL OR NEW.tracking_token = '' THEN
    NEW.tracking_token := encode(gen_random_bytes(18), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_set_tracking_token ON public.orders;
CREATE TRIGGER trg_orders_set_tracking_token
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_tracking_token();

-- 3) Safe public view of an order keyed by token. Only non-sensitive columns.
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token text)
RETURNS TABLE (
  tracking_token text,
  status text,
  total bigint,
  items jsonb,
  pickup_method text,
  customer_note text,
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
    o.created_at,
    o.updated_at
  FROM public.orders o
  WHERE o.tracking_token = p_token;
$$;

-- 4) Grant execution to anon + authenticated (no table SELECT needed by client).
GRANT EXECUTE ON FUNCTION public.get_order_by_token(text) TO anon, authenticated;
