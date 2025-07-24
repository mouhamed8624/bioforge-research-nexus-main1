-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  assigned_to TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  percentage INTEGER DEFAULT 0,
  project_id UUID REFERENCES public.projects(id),
  deadline TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.todos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.todos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.todos FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.todos FOR DELETE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_completed_by ON public.todos(completed_by);
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON public.todos(project_id); 