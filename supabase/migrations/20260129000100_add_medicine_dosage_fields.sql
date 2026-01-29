-- Add item type and medicine dosing metadata to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN item_type TEXT NOT NULL DEFAULT 'food',
ADD COLUMN medicine_is_dosaged BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN medicine_dose_amount NUMERIC,
ADD COLUMN medicine_dose_unit TEXT,
ADD COLUMN medicine_dose_times TEXT[],
ADD COLUMN medicine_timezone TEXT,
ADD COLUMN medicine_next_dose_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN medicine_last_taken_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN medicine_snooze_until TIMESTAMP WITH TIME ZONE;

-- Basic constraint: if item_type is medicine, medicine_timezone may be set for dosaged medicines
ALTER TABLE public.inventory_items
ADD CONSTRAINT inventory_items_item_type_check
CHECK (item_type IN ('food', 'medicine'));
