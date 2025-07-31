-- Add unit_team_leader role to existing policies
-- This migration adds the new unit_team_leader role to all policies that currently include the lab role

-- Update patient_lab_results policies to include unit_team_leader
-- (These policies currently allow anyone, so no changes needed)

-- Update patients table policies to include unit_team_leader
DROP POLICY IF EXISTS "Allow authorized roles to view patients" ON public.patients;
CREATE POLICY "Allow authorized roles to view patients"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'president', 'lab', 'unit_team_leader', 'field'));

-- Update plaquettes policies to include unit_team_leader
DROP POLICY IF EXISTS "Allow president, admin, and lab to view plaquettes" ON public.plaquettes;
CREATE POLICY "Allow president, admin, lab, and unit_team_leader to view plaquettes"
  ON public.plaquettes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader')
    )
  );

DROP POLICY IF EXISTS "Allow president, admin, and lab to insert plaquettes" ON public.plaquettes;
CREATE POLICY "Allow president, admin, lab, and unit_team_leader to insert plaquettes"
  ON public.plaquettes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader')
    )
  );

DROP POLICY IF EXISTS "Allow president, admin, and lab to update plaquettes" ON public.plaquettes;
CREATE POLICY "Allow president, admin, lab, and unit_team_leader to update plaquettes"
  ON public.plaquettes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader')
    )
  );

DROP POLICY IF EXISTS "Allow president, admin, and lab to delete plaquettes" ON public.plaquettes;
CREATE POLICY "Allow president, admin, lab, and unit_team_leader to delete plaquettes"
  ON public.plaquettes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader')
    )
  );

-- Update team_members policies to include unit_team_leader
DROP POLICY IF EXISTS "Allow authorized roles to view team members" ON public.team_members;
CREATE POLICY "Allow authorized roles to view team members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('president', 'admin', 'general_director', 'manager', 'front_desk', 'financial', 'lab', 'unit_team_leader'));

-- Update any other policies that might reference lab role
-- Add unit_team_leader to bio_banks policies if they exist
DROP POLICY IF EXISTS "Allow lab users to view bio_banks" ON public.bio_banks;
CREATE POLICY "Allow lab and unit_team_leader users to view bio_banks"
  ON public.bio_banks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader')
    )
  );

-- Add unit_team_leader to dbs policies if they exist
DROP POLICY IF EXISTS "Allow lab users to view dbs" ON public.dbs;
CREATE POLICY "Allow lab and unit_team_leader users to view dbs"
  ON public.dbs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader')
    )
  );

-- Add unit_team_leader to todos policies if they exist
DROP POLICY IF EXISTS "Allow authorized roles to view todos" ON public.todos;
CREATE POLICY "Allow authorized roles to view todos"
  ON public.todos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager', 'front_desk')
    )
  );

DROP POLICY IF EXISTS "Allow authorized roles to insert todos" ON public.todos;
CREATE POLICY "Allow authorized roles to insert todos"
  ON public.todos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager', 'front_desk')
    )
  );

DROP POLICY IF EXISTS "Allow authorized roles to update todos" ON public.todos;
CREATE POLICY "Allow authorized roles to update todos"
  ON public.todos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager', 'front_desk')
    )
  );

DROP POLICY IF EXISTS "Allow authorized roles to delete todos" ON public.todos;
CREATE POLICY "Allow authorized roles to delete todos"
  ON public.todos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager', 'front_desk')
    )
  ); 