
-- Create household_members join table for multi-household support
CREATE TABLE public.household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, household_id)
);

-- Migrate existing profile-household associations into the join table
INSERT INTO public.household_members (user_id, household_id)
SELECT id, household_id FROM public.profiles WHERE household_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable RLS (keeping permissive as per project constraints)
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own memberships
CREATE POLICY "Users can view their memberships"
  ON public.household_members FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own memberships"
  ON public.household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships"
  ON public.household_members FOR DELETE
  USING (auth.uid() = user_id);
