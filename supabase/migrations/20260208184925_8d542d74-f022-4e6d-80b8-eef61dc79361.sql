
-- Attach the existing handle_new_user function as a trigger on auth.users
-- This ensures a profile is created automatically on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
