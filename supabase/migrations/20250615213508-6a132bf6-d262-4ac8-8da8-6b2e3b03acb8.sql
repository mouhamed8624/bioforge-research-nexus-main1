
-- Drop all potential existing policies on the team_members table to ensure a clean state
DROP POLICY IF EXISTS "Allow all actions for all users" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users to view team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authorized users to insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authorized users to update team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authorized users to delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authorized roles to view team members" ON public.team_members;

-- Re-create the correct policies

-- Allow authorized users (president, admin, directors, managers, front desk, and financial) to view ALL team members.
CREATE POLICY "Allow authorized roles to view team members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('president', 'admin', 'general_director', 'manager', 'front_desk', 'financial'));

-- Allow a more restrictive set of roles (president, admin, directors, and managers) to add new team members
CREATE POLICY "Allow authorized users to insert team members"
  ON public.team_members
  FOR INSERT
  WITH CHECK (get_user_role() IN ('president', 'admin', 'general_director', 'manager'));

-- Allow a more restrictive set of roles to update team members
CREATE POLICY "Allow authorized users to update team members"
  ON public.team_members
  FOR UPDATE
  USING (get_user_role() IN ('president', 'admin', 'general_director', 'manager'));

-- Allow a more restrictive set of roles to delete team members
CREATE POLICY "Allow authorized users to delete team members"
  ON public.team_members
  FOR DELETE
  USING (get_user_role() IN ('president', 'admin', 'general_director', 'manager'));
