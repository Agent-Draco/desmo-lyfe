-- Re-enable RLS on all tables with proper policies
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Add inventory_items RLS policies
CREATE POLICY "Users can view household inventory" 
ON public.inventory_items 
FOR SELECT 
USING (is_member_of_household(household_id));

CREATE POLICY "Users can insert inventory items" 
ON public.inventory_items 
FOR INSERT 
WITH CHECK (is_member_of_household(household_id));

CREATE POLICY "Users can update household inventory" 
ON public.inventory_items 
FOR UPDATE 
USING (is_member_of_household(household_id));

CREATE POLICY "Users can delete household inventory" 
ON public.inventory_items 
FOR DELETE 
USING (is_member_of_household(household_id));