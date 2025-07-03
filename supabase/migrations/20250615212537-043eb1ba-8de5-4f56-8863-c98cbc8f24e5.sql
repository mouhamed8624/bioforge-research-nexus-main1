
-- Drop all potential existing policies on the team_members table to ensure a clean state
DROP POLICY IF EXISTS "Allow all actions for all users" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users to view team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authorized users to insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authorized users to update team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authorized users to delete team members" ON public.team_members;
