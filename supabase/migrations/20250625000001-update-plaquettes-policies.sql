-- Update plaquettes RLS policies to allow president, admin, and lab roles

-- Drop existing policies
DROP POLICY IF EXISTS "Allow lab users to view plaquettes" ON public.plaquettes;
DROP POLICY IF EXISTS "Allow lab users to insert plaquettes" ON public.plaquettes;
DROP POLICY IF EXISTS "Allow lab users to update plaquettes" ON public.plaquettes;
DROP POLICY IF EXISTS "Allow lab users to delete plaquettes" ON public.plaquettes;

-- Create new policies for president, admin, and lab roles
CREATE POLICY "Allow authorized users to view plaquettes"
  ON public.plaquettes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab')
    )
  );

CREATE POLICY "Allow authorized users to insert plaquettes"
  ON public.plaquettes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab')
    )
  );

CREATE POLICY "Allow authorized users to update plaquettes"
  ON public.plaquettes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab')
    )
  );

CREATE POLICY "Allow authorized users to delete plaquettes"
  ON public.plaquettes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab')
    )
  ); 