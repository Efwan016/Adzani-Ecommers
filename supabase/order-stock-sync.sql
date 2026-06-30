-- Stock sync for admin order status processing.
-- Run this after supabase/orders.sql and supabase/products.sql.
-- Requires public.is_admin() to already exist.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_deducted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS stock_restored boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_restored_at timestamptz NULL;

CREATE OR REPLACE FUNCTION public.process_order_status(
  order_id uuid,
  next_status text
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_order public.orders%ROWTYPE;
  updated_order public.orders%ROWTYPE;
  order_item jsonb;
  item_product_id uuid;
  item_qty integer;
  item_name text;
  product_stock integer;
  should_deduct_stock boolean;
  should_restore_stock boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya admin yang bisa memproses order.';
  END IF;

  IF next_status NOT IN ('pending', 'confirmed', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Status order tidak valid: %', next_status;
  END IF;

  SELECT *
  INTO target_order
  FROM public.orders
  WHERE id = order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order tidak ditemukan.';
  END IF;

  should_deduct_stock :=
    next_status IN ('confirmed', 'completed')
    AND (
      target_order.stock_deducted = false
      OR target_order.stock_restored = true
    );

  should_restore_stock :=
    next_status = 'cancelled'
    AND target_order.stock_deducted = true
    AND target_order.stock_restored = false;

  IF should_deduct_stock THEN
    FOR order_item IN
      SELECT value FROM jsonb_array_elements(target_order.items)
    LOOP
      item_product_id := NULLIF(order_item ->> 'product_id', '')::uuid;
      item_qty := COALESCE((order_item ->> 'qty')::integer, 0);
      item_name := COALESCE(order_item ->> 'name', item_product_id::text);

      IF item_product_id IS NULL OR item_qty <= 0 THEN
        RAISE EXCEPTION 'Item order tidak valid untuk produk %.', item_name;
      END IF;

      SELECT stock
      INTO product_stock
      FROM public.products
      WHERE id = item_product_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Produk % tidak ditemukan, stok tidak bisa dikurangi.', item_name;
      END IF;

      IF product_stock < item_qty THEN
        RAISE EXCEPTION 'Stok tidak cukup untuk %. Stok tersedia %, dibutuhkan %.', item_name, product_stock, item_qty;
      END IF;

      UPDATE public.products
      SET stock = stock - item_qty,
          updated_at = now()
      WHERE id = item_product_id;
    END LOOP;

    UPDATE public.orders
    SET status = next_status,
        stock_deducted = true,
        stock_deducted_at = now(),
        stock_restored = false,
        stock_restored_at = NULL,
        updated_at = now()
    WHERE id = order_id
    RETURNING *
    INTO updated_order;
  ELSIF should_restore_stock THEN
    FOR order_item IN
      SELECT value FROM jsonb_array_elements(target_order.items)
    LOOP
      item_product_id := NULLIF(order_item ->> 'product_id', '')::uuid;
      item_qty := COALESCE((order_item ->> 'qty')::integer, 0);
      item_name := COALESCE(order_item ->> 'name', item_product_id::text);

      IF item_product_id IS NULL OR item_qty <= 0 THEN
        RAISE EXCEPTION 'Item order tidak valid untuk produk %.', item_name;
      END IF;

      UPDATE public.products
      SET stock = stock + item_qty,
          updated_at = now()
      WHERE id = item_product_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Produk % tidak ditemukan, stok tidak bisa dikembalikan.', item_name;
      END IF;
    END LOOP;

    UPDATE public.orders
    SET status = next_status,
        stock_restored = true,
        stock_restored_at = now(),
        updated_at = now()
    WHERE id = order_id
    RETURNING *
    INTO updated_order;
  ELSE
    UPDATE public.orders
    SET status = next_status,
        updated_at = now()
    WHERE id = order_id
    RETURNING *
    INTO updated_order;
  END IF;

  RETURN updated_order;
END;
$$;

REVOKE ALL ON FUNCTION public.process_order_status(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.process_order_status(uuid, text) TO authenticated;
