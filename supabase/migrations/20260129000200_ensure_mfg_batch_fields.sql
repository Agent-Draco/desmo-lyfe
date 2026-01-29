-- Ensure manufacturing_date and batch_number exist and are properly defaulted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_items'
      AND column_name = 'manufacturing_date'
  ) THEN
    ALTER TABLE public.inventory_items
    ADD COLUMN manufacturing_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_items'
      AND column_name = 'batch_number'
  ) THEN
    ALTER TABLE public.inventory_items
    ADD COLUMN batch_number TEXT;
  END IF;

  -- Normalize batch_number defaults
  UPDATE public.inventory_items
  SET batch_number = '-'
  WHERE batch_number IS NULL;

  ALTER TABLE public.inventory_items
  ALTER COLUMN batch_number SET DEFAULT '-';

  -- Make NOT NULL if possible
  BEGIN
    ALTER TABLE public.inventory_items
    ALTER COLUMN batch_number SET NOT NULL;
  EXCEPTION WHEN others THEN
    -- If existing data prevents NOT NULL, leave it nullable.
    NULL;
  END;
END $$;
