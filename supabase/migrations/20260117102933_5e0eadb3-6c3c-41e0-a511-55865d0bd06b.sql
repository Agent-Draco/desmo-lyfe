-- Fix RLS policy for households - allow authenticated users to create households
DROP POLICY IF EXISTS "Users without household can create one" ON public.households;

CREATE POLICY "Authenticated users can create households"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (true);