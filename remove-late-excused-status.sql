-- Remove late and excused statuses from team_attendance table
-- Run this script in your Supabase SQL Editor

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

-- Optional: Update any existing late/excused records to absent
-- UPDATE public.team_attendance 
-- SET status = 'absent' 
-- WHERE status IN ('late', 'excused'); 