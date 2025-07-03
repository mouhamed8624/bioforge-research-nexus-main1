
-- Create research_papers table
CREATE TABLE public.research_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  abstract TEXT,
  publication_date DATE,
  journal TEXT,
  doi TEXT,
  keywords TEXT[],
  categories TEXT[],
  file_url TEXT,
  file_path TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;

-- Create policies for research papers
CREATE POLICY "Anyone can view research papers" 
  ON public.research_papers 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create research papers" 
  ON public.research_papers 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own research papers" 
  ON public.research_papers 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own research papers" 
  ON public.research_papers 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Create updated_at trigger
CREATE TRIGGER update_research_papers_updated_at
  BEFORE UPDATE ON public.research_papers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
