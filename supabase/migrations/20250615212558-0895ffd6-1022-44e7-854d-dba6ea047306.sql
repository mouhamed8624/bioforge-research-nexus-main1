
-- Re-create the correct policies

-- Allow all authenticated users to view team members
CREATE POLICY "Allow authenticated users to view team members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins, managers, and general directors to add new team members
CREATE POLICY "Allow authorized users to insert team members"
  ON public.team_members
  FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'manager', 'general_director'));

-- Allow admins, managers, and general directors to update team members
CREATE POLICY "Allow authorized users to update team members"
  ON public.team_members
  FOR UPDATE
  USING (get_user_role() IN ('admin', 'manager', 'general_director'));

-- Allow admins, managers, and general directors to delete team members
CREATE POLICY "Allow authorized users to delete team members"
  ON public.team_members
  FOR DELETE
  USING (get_user_role() IN ('admin', 'manager', 'general_director'));
