-- Create milestones and activities tables for hierarchical project management
-- This migration adds support for Milestones -> Activities -> Tasks structure

-- Milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  assigned_to TEXT[] DEFAULT '{}',
  estimated_hours INTEGER,
  actual_hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add activity_id column to todos table to link tasks to activities
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for milestones
CREATE POLICY "Allow authorized roles to view milestones" 
  ON public.milestones 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager', 'front_desk', 'financial')
    )
  );

CREATE POLICY "Allow authorized roles to insert milestones" 
  ON public.milestones 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
    )
  );

CREATE POLICY "Allow authorized roles to update milestones" 
  ON public.milestones 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
    )
  );

CREATE POLICY "Allow authorized roles to delete milestones" 
  ON public.milestones 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
    )
  );

-- Create RLS policies for activities
CREATE POLICY "Allow authorized roles to view activities" 
  ON public.activities 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager', 'front_desk', 'financial')
    )
  );

CREATE POLICY "Allow authorized roles to insert activities" 
  ON public.activities 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
    )
  );

CREATE POLICY "Allow authorized roles to update activities" 
  ON public.activities 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
    )
  );

CREATE POLICY "Allow authorized roles to delete activities" 
  ON public.activities 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_created_at ON public.milestones(created_at);

CREATE INDEX IF NOT EXISTS idx_activities_milestone_id ON public.activities(milestone_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);

CREATE INDEX IF NOT EXISTS idx_todos_activity_id ON public.todos(activity_id);

-- Add triggers for updated_at
CREATE TRIGGER update_milestones_updated_at 
  BEFORE UPDATE ON public.milestones 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER update_activities_updated_at 
  BEFORE UPDATE ON public.activities 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at(); 