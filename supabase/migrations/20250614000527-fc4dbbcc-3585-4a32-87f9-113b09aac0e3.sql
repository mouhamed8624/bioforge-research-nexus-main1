
-- Create attendance table to track team member attendance
CREATE TABLE public.team_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, date)
);

-- Enable RLS
ALTER TABLE public.team_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance
CREATE POLICY "Anyone can view attendance" 
  ON public.team_attendance 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert attendance" 
  ON public.team_attendance 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update attendance" 
  ON public.team_attendance 
  FOR UPDATE 
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER handle_attendance_updated_at 
  BEFORE UPDATE ON public.team_attendance 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
