-- Remove late and excused statuses from team_attendance table
-- This migration updates the status constraint to only allow present, absent, and justified_absent

-- Drop the existing constraint
ALTER TABLE public.team_attendance 
DROP CONSTRAINT IF EXISTS team_attendance_status_check;

-- Add the new constraint without late and excused
ALTER TABLE public.team_attendance 
ADD CONSTRAINT team_attendance_status_check 
CHECK (status IN ('present', 'absent', 'justified_absent'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.team_attendance'::regclass 
AND conname = 'team_attendance_status_check'; 