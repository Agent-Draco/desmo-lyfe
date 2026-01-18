-- Fix RLS policy: Users should be able to view their own profile
DROP POLICY IF EXISTS "Users can view household members profiles" ON public.profiles;

-- Allow users to view their own profile (needed for initial fetch)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Also allow viewing household members' profiles
CREATE POLICY "Users can view household members profiles" 
ON public.profiles 
FOR SELECT 
USING (
  household_id IS NOT NULL 
  AND household_id = (SELECT household_id FROM public.profiles WHERE id = auth.uid())
);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());