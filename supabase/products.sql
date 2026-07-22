-- Supabase SQL for products table, trigger, RLS, policies, and sample data

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Umum',
  price bigint NOT NULL DEFAULT 0,
  cost_price bigint NULL,
  stock integer NOT NULL DEFAULT 0,
  image_url text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Trigger untuk updated_at otomatis
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_set_updated_at ON public.products;
CREATE TRIGGER trg_products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3) Aktifkan RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4) Admin helper
-- Ganti admin@example.com dengan email admin yang sama seperti VITE_ADMIN_EMAILS
-- sebelum menjalankan SQL ini di Supabase production.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    ARRAY[
      'admin@example.com'
    ]::text[]
  );
$$;

-- 5) Policy: public read only untuk produk aktif
DROP POLICY IF EXISTS "products_select_public_active" ON public.products;
CREATE POLICY "products_select_public_active"
  ON public.products
  FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "products_select_authenticated_all" ON public.products;
CREATE POLICY "products_select_authenticated_all"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 6) Policy: hanya authenticated admin yang bisa insert / update / delete
DROP POLICY IF EXISTS "products_insert_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7) Sample data: 5 produk konter / aksesoris HP
INSERT INTO public.products (name, slug, description, category, price, cost_price, stock, image_url, is_active)
VALUES
  (
    'Case Silicone iPhone 15',
    'case-silicone-iphone-15',
    'Case silikon anti gores, nyaman di genggaman, warna hitam matte.',
    'Aksesoris HP',
    99000,
    65000,
    25,
    NULL,
    true
  ),
  (
    'Charger Type-C 20W',
    'charger-type-c-20w',
    'Charger cepat 20W, cocok untuk charging hp dan earbud.',
    'Chargers',
    129000,
    85000,
    18,
    NULL,
    true
  ),
  (
    'Cable Data Type-C 1m',
    'cable-data-type-c-1m',
    'Kabel data tahan lama, transfer cepat, panjang 1 meter.',
    'Kabel',
    45000,
    28000,
    40,
    NULL,
    true
  ),
  (
    'Tempered Glass iPhone 15',
    'tempered-glass-iphone-15',
    'Pelindung layar kaca tempered, anti gores dan anti sidik jari.',
    'Screen Protector',
    59000,
    35000,
    30,
    NULL,
    true
  ),
  (
    'Powerbank 10000mAh',
    'powerbank-10000mah',
    'Powerbank kapasitas 10000mAh, port USB-C dan USB-A.',
    'Powerbank',
    179000,
    115000,
    12,
    NULL,
    true
  )
ON CONFLICT (slug) DO NOTHING;
