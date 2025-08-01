-- Add justified_absent status to team_attendance table
-- Run this script in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE public.team_attendance 
DROP CONSTRAINT IF EXISTS team_attendance_status_check;

-- Add the new constraint with justified_absent
ALTER TABLE public.team_attendance 
ADD CONSTRAINT team_attendance_status_check 
CHECK (status IN ('present', 'absent', 'justified_absent', 'late', 'excused'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.team_attendance'::regclass 
AND conname = 'team_attendance_status_check';

-- Test the constraint by trying to insert a justified_absent record
-- (This will fail if the constraint is not working properly)
-- INSERT INTO public.team_attendance (team_member_id, date, status) 
-- VALUES ('test-id', '2024-01-01', 'justified_absent'); 