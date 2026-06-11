-- Supabase Storage setup for product images
-- Run this file in Supabase SQL Editor after products.sql.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  3145728,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
CREATE POLICY "product_images_authenticated_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_authenticated_update" ON storage.objects;
CREATE POLICY "product_images_authenticated_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_authenticated_delete" ON storage.objects;
CREATE POLICY "product_images_authenticated_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
