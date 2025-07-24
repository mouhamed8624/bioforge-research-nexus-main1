-- Create todos table for proper task management and time tracking
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  assigned_to TEXT[] NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  percentage INTEGER NOT NULL DEFAULT 0,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all todos" 
  ON public.todos 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create todos" 
  ON public.todos 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update todos" 
  ON public.todos 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete todos" 
  ON public.todos 
  FOR DELETE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON public.todos(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_completed_by ON public.todos(completed_by);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON public.todos(created_at);
CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON public.todos(completed_at);

-- Add trigger for updated_at (if the function doesn't exist, create it first)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON public.todos 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 