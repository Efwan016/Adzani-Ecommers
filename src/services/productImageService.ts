import { slugify } from '../lib/slugify';
import { supabase } from './supabaseClient';

const PRODUCT_IMAGE_BUCKET = 'product-images';
export const MAX_PRODUCT_IMAGE_SIZE = 3 * 1024 * 1024;

function getFileExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (extension) {
    return extension;
  }

  const mimeExtension = file.type.split('/')[1]?.split('+')[0];
  return mimeExtension || 'jpg';
}

function createProductImagePath(file: File, productSlug: string) {
  const safeSlug = slugify(productSlug).slice(0, 80);
  const timestamp = Date.now();
  const extension = getFileExtension(file);
  const filename = safeSlug ? `${safeSlug}-${timestamp}.${extension}` : `${timestamp}.${extension}`;

  return filename;
}

export async function uploadProductImage(file: File, productSlug: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar.');
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    throw new Error('Ukuran gambar maksimal 3MB.');
  }

  const filePath = createProductImagePath(file, productSlug);
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error('Gagal mengambil public URL gambar.');
  }

  return data.publicUrl;
}
