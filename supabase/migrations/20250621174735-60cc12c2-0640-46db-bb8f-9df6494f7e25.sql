
-- Create the team_attendance table
CREATE TABLE IF NOT EXISTS public.team_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one attendance record per member per day
  UNIQUE(team_member_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.team_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all attendance records" 
  ON public.team_attendance 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert attendance records" 
  ON public.team_attendance 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update attendance records" 
  ON public.team_attendance 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete attendance records" 
  ON public.team_attendance 
  FOR DELETE 
  USING (true);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_team_attendance_member_date 
  ON public.team_attendance(team_member_id, date);

CREATE INDEX IF NOT EXISTS idx_team_attendance_date 
  ON public.team_attendance(date);
