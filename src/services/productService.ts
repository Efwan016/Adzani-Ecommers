import { supabase } from './supabaseClient';
import type { Product } from '../types/types';

export type CreateProductInput = {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  price: number;
  cost_price?: number | null;
  stock: number;
  image_url?: string | null;
  is_active?: boolean;
};

export type UpdateProductInput = CreateProductInput;

export async function getActiveProducts(): Promise<Product[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
}

export async function getFeaturedActiveProducts(limit = 3): Promise<Product[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as Product | null;
}

export async function getAllProductsForAdmin(): Promise<Product[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as Product | null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: input.name,
        slug: input.slug,
        description: input.description ?? '',
        category: input.category ?? 'Umum',
        price: input.price,
        cost_price: input.cost_price ?? null,
        stock: input.stock,
        image_url: input.image_url ?? null,
        is_active: input.is_active ?? true,
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Product;
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description ?? '',
      category: input.category ?? 'Umum',
      price: input.price,
      cost_price: input.cost_price ?? null,
      stock: input.stock,
      image_url: input.image_url ?? null,
      is_active: input.is_active ?? true,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Product;
}

export async function updateProductStatus(id: string, isActive: boolean): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Periksa file .env.');
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getProducts(): Promise<Product[]> {
  return getActiveProducts();
}
