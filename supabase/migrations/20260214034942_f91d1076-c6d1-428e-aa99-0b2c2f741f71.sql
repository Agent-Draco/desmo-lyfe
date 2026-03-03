
-- Create household_invitations table for OTP codes
CREATE TABLE public.household_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read invitations (to validate codes)
CREATE POLICY "Authenticated users can read invitations"
ON public.household_invitations FOR SELECT
TO authenticated
USING (true);

-- Members can create invitations for their households
CREATE POLICY "Members can create invitations"
ON public.household_invitations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.user_id = auth.uid() AND hm.household_id = household_invitations.household_id
  )
);

-- Creator can update (mark as used)
CREATE POLICY "Can update invitations"
ON public.household_invitations FOR UPDATE
TO authenticated
USING (true);
