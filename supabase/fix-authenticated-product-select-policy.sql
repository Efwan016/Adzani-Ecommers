-- Allow logged-in admins to read every product, including inactive products.
-- Public customers still only see active products through products_select_public_active.

DROP POLICY IF EXISTS "products_select_authenticated_all" ON public.products;
CREATE POLICY "products_select_authenticated_all"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);
