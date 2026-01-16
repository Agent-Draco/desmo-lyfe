-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;

-- Create a more secure insert policy - users can only create if they don't already have a household
CREATE POLICY "Users without household can create one"
  ON public.households FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );