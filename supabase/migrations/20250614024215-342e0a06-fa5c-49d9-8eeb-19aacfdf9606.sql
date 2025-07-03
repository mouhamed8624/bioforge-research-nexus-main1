
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to mark all team members as absent for today
CREATE OR REPLACE FUNCTION mark_daily_attendance()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  team_member_record RECORD;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get all unique team member IDs from existing attendance records
  FOR team_member_record IN 
    SELECT DISTINCT team_member_id 
    FROM team_attendance 
  LOOP
    -- Insert absent record for today if it doesn't exist
    INSERT INTO team_attendance (team_member_id, date, status, notes, recorded_by)
    VALUES (
      team_member_record.team_member_id,
      today_date,
      'absent',
      'Auto-marked absent at start of day',
      'system'
    )
    ON CONFLICT (team_member_id, date) DO NOTHING;
  END LOOP;
END;
$$;

-- Schedule the function to run daily at midnight (12:00 AM)
SELECT cron.schedule(
  'daily-attendance-marking',
  '0 0 * * *', -- Run at 00:00 (midnight) every day
  $$SELECT mark_daily_attendance();$$
);
