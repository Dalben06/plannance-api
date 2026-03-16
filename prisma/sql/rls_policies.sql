-- =============================================================================
-- Supabase Security Advisor fixes
-- Run once in Supabase: Database → SQL Editor
-- =============================================================================

-- Step 1: Enable Row Level Security on both public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Step 2: Grant full access to the postgres (service) role
-- Prisma connects as postgres which bypasses RLS by default on Supabase,
-- but these policies act as an explicit safeguard for any other trusted role.

CREATE POLICY "service_role_full_access_users"
  ON public.users
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_calendar_events"
  ON public.calendar_events
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Step 3: Revoke sensitive column access from PostgREST-facing roles
-- Resolves the "Sensitive Columns Exposed" error for the password column.

REVOKE SELECT ON TABLE public.users FROM anon, authenticated;

-- Grant back only the safe (non-sensitive) columns to authenticated users
GRANT SELECT (uuid, email, name, picture, created_at, updated_at) ON public.users TO authenticated;

-- anon role gets no access to the users table (no public user listing)
