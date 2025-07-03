
-- Create spending table for project expense tracking
CREATE TABLE public.spending (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on spending
ALTER TABLE public.spending ENABLE ROW LEVEL SECURITY;

-- Create policies for spending
CREATE POLICY "Anyone can view spending" 
  ON public.spending 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create spending" 
  ON public.spending 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update spending" 
  ON public.spending 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete spending" 
  ON public.spending 
  FOR DELETE 
  USING (true);

-- Add project_id field to budget_allocation table
ALTER TABLE public.budget_allocation 
ADD COLUMN project_id UUID REFERENCES public.projects(id);
