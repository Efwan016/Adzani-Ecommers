-- Migration: Add admin_note to public.orders table
-- Step 1: Add the column if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_note text NULL;

-- Step 2: Ensure get_order_by_token view or function DOES NOT expose admin_note!
-- Let's inspect get_order_by_token implementation in supabase/order-tracking.sql to make sure admin_note is safe.
