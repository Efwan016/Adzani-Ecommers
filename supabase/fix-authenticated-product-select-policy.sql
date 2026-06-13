-- Allow logged-in admins to read every product, including inactive products.
-- Public customers still only see active products through products_select_public_active.
-- Before running this in production, replace admin@example.com with the same
-- admin emails configured in VITE_ADMIN_EMAILS.

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

DROP POLICY IF EXISTS "products_select_authenticated_all" ON public.products;
CREATE POLICY "products_select_authenticated_all"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
