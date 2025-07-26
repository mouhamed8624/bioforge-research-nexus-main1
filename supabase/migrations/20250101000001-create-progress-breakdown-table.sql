-- Create progress_breakdown table for detailed progress tracking
CREATE TABLE IF NOT EXISTS public.progress_breakdown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  todo_id UUID REFERENCES public.todos(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  progress_added INTEGER NOT NULL,
  previous_progress INTEGER NOT NULL,
  new_progress INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.progress_breakdown ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all progress breakdown" 
  ON public.progress_breakdown 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create progress breakdown" 
  ON public.progress_breakdown 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update progress breakdown" 
  ON public.progress_breakdown 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete progress breakdown" 
  ON public.progress_breakdown 
  FOR DELETE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_progress_breakdown_project_id ON public.progress_breakdown(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_breakdown_todo_id ON public.progress_breakdown(todo_id);
CREATE INDEX IF NOT EXISTS idx_progress_breakdown_user_email ON public.progress_breakdown(user_email);
CREATE INDEX IF NOT EXISTS idx_progress_breakdown_created_at ON public.progress_breakdown(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_progress_breakdown_updated_at 
  BEFORE UPDATE ON public.progress_breakdown 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at(); 