-- Fix the permissive INSERT policy on households
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;

CREATE POLICY "Authenticated users can create households" 
ON public.households 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);