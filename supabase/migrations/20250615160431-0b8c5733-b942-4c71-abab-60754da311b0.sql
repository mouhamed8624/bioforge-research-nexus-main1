
-- Drop the existing policy that grants broad access, including to the 'lab' role.
DROP POLICY IF EXISTS "Allow patient management for authorized roles" ON public.patients;

-- This policy allows users with 'admin', 'president', 'lab', or 'field' roles to view patient records.
-- The 'lab' role needs read access to perform their duties, but will be restricted from making changes.
CREATE POLICY "Allow patient viewing for authorized roles"
ON public.patients
FOR SELECT
USING (public.get_user_role() IN ('admin', 'president', 'lab', 'field'));

-- This policy grants permission to add, update, and delete patient records only to 'admin', 'president', and 'field' roles.
-- The 'lab' role is explicitly excluded from these modification privileges to maintain data integrity.
CREATE POLICY "Allow patient modification for admin, president, and field roles"
ON public.patients
FOR ALL
USING (public.get_user_role() IN ('admin', 'president', 'field'))
WITH CHECK (public.get_user_role() IN ('admin', 'president', 'field'));
