-- Remove ALL RLS policies in public schema and disable RLS on ALL public tables
DO $$
DECLARE
  r record;
BEGIN
  -- Drop every policy in public schema
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  -- Disable RLS on every table in public schema
  FOR r IN (
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
    EXECUTE format('ALTER TABLE %I.%I NO FORCE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;
END $$;