import { slugify } from '../lib/slugify';
import { supabase } from './supabaseClient';

const PRODUCT_IMAGE_BUCKET = 'product-images';
export const MAX_PRODUCT_IMAGE_SIZE = 3 * 1024 * 1024;

// Resize cap so uploaded images stay light even when Supabase image
// transformation is disabled on the bucket (avoids multi-MB originals -> LCP).
const RESIZE_MAX_DIMENSION = 1000;
const RESIZE_QUALITY = 0.82;

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

/**
 * Downscale + re-encode an image file to WebP in the browser before upload.
 * Keeps the longest edge <= RESIZE_MAX_DIMENSION and the payload small so the
 * stored asset is always light. Falls back to the original file if the browser
 * lacks canvas/Image support or decoding fails.
 */
async function optimizeImageFile(file: File): Promise<File> {
  if (typeof document === 'undefined' || !('createObjectURL' in URL) || !('Image' in window)) {
    return file;
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Gagal membaca gambar.'));
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    const scale = Math.min(1, RESIZE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/webp', RESIZE_QUALITY),
    );
    if (!blob) return file;

    const optimizedName = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], optimizedName, { type: 'image/webp' });
  } catch {
    return file;
  }
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

  const optimized = await optimizeImageFile(file);
  const filePath = createProductImagePath(optimized, productSlug);
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, optimized, {
      cacheControl: '31536000',
      contentType: optimized.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error('Gagal mengambil public URL gambar.');
  }

  return data.publicUrl;
}

/**
 * Append Supabase Storage (imgix) transform params to a public image URL so the
 * CDN returns a resized, next-gen (WebP/AVIF) asset when image transformation is
 * enabled on the bucket. Falls back to the original URL otherwise.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: { width?: number; height?: number; quality?: number } = {},
): string {
  if (!url) return '';
  const { width, height, quality = 80 } = options;
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));
  params.set('format', 'webp');

  return `${url}${separator}${params.toString()}`;
}
