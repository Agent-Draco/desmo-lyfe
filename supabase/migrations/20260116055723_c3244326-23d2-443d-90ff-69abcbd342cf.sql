-- Create households table
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 4) || '-' || substring(md5(random()::text) from 1 for 4)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  category TEXT,
  barcode TEXT,
  expiry_date DATE,
  is_out BOOLEAN NOT NULL DEFAULT false,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Helper function: Get current user's household_id
CREATE OR REPLACE FUNCTION public.get_user_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function: Check if user is member of household
CREATE OR REPLACE FUNCTION public.is_member_of_household(_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND household_id = _household_id
  )
$$;

-- RLS Policies for households
CREATE POLICY "Users can view their own household"
  ON public.households FOR SELECT
  USING (public.is_member_of_household(id));

CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Household members can update their household"
  ON public.households FOR UPDATE
  USING (public.is_member_of_household(id));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view household members profiles"
  ON public.profiles FOR SELECT
  USING (public.is_member_of_household(household_id));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- RLS Policies for inventory_items
CREATE POLICY "Household members can view inventory"
  ON public.inventory_items FOR SELECT
  USING (public.is_member_of_household(household_id));

CREATE POLICY "Household members can add inventory"
  ON public.inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_member_of_household(household_id));

CREATE POLICY "Household members can update inventory"
  ON public.inventory_items FOR UPDATE
  USING (public.is_member_of_household(household_id));

CREATE POLICY "Household members can delete inventory"
  ON public.inventory_items FOR DELETE
  USING (public.is_member_of_household(household_id));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for inventory_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER TABLE public.inventory_items REPLICA IDENTITY FULL;