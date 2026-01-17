-- Disable RLS on all tables for development
ALTER TABLE public.households DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their household" ON public.households;
DROP POLICY IF EXISTS "Authenticated users can create household" ON public.households;
DROP POLICY IF EXISTS "Household members can update household" ON public.households;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Household members can view each other's profiles" ON public.profiles;
DROP POLICY IF EXISTS "Household members can view inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Household members can add inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Household members can update inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Household members can delete inventory" ON public.inventory_items;