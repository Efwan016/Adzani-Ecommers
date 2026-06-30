-- Add optional customer WhatsApp/phone field to checkout orders.
-- Run this after supabase/orders.sql.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_phone text NULL;
