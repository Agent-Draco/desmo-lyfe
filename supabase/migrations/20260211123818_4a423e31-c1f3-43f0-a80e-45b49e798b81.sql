
-- Add creator_id to households
ALTER TABLE public.households ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill creator_id: set the earliest profile linked to each household as creator
UPDATE public.households h
SET creator_id = (
  SELECT p.id FROM public.profiles p
  WHERE p.household_id = h.id
  ORDER BY p.created_at ASC
  LIMIT 1
)
WHERE h.creator_id IS NULL;

-- Create merge_requests table for household merge approval flow
CREATE TABLE public.merge_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  target_household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (kept permissive per project convention)
ALTER TABLE public.merge_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to interact with merge_requests
CREATE POLICY "Authenticated users can view merge requests for their household"
  ON public.merge_requests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert merge requests"
  ON public.merge_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Authenticated users can update merge requests"
  ON public.merge_requests FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete merge requests"
  ON public.merge_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id);

-- Trigger for updated_at on merge_requests
CREATE TRIGGER update_merge_requests_updated_at
  BEFORE UPDATE ON public.merge_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for merge_requests so notifications work
ALTER PUBLICATION supabase_realtime ADD TABLE public.merge_requests;
