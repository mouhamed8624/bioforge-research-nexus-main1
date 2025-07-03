
-- Enable RLS on spending table (if not already enabled)
ALTER TABLE public.spending ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view spending records
CREATE POLICY "Anyone can view spending records" 
  ON public.spending 
  FOR SELECT 
  USING (true);

-- Create policy to allow anyone to insert spending records
CREATE POLICY "Anyone can create spending records" 
  ON public.spending 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow anyone to update spending records
CREATE POLICY "Anyone can update spending records" 
  ON public.spending 
  FOR UPDATE 
  USING (true);

-- Create policy to allow anyone to delete spending records
CREATE POLICY "Anyone can delete spending records" 
  ON public.spending 
  FOR DELETE 
  USING (true);
