-- Add manufacturing date, expiry date, and batch number fields to inventory_items table
ALTER TABLE public.inventory_items
ADD COLUMN manufacturing_date DATE,
ADD COLUMN expiry_date DATE, -- Rename existing expiry_date to avoid conflict, but actually it's already expiry_date
ADD COLUMN batch_number TEXT DEFAULT '-';

-- Update existing records to have batch_number as '-'
UPDATE public.inventory_items SET batch_number = '-' WHERE batch_number IS NULL;

-- Make batch_number NOT NULL
ALTER TABLE public.inventory_items ALTER COLUMN batch_number SET NOT NULL;
