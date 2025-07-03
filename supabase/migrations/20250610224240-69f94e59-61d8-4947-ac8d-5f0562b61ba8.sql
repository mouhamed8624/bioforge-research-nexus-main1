
-- Enable RLS on budget_allocation table (if not already enabled)
ALTER TABLE public.budget_allocation ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view budget allocations
CREATE POLICY "Anyone can view budget allocations" 
  ON public.budget_allocation 
  FOR SELECT 
  USING (true);

-- Create policy to allow anyone to insert budget allocations
CREATE POLICY "Anyone can create budget allocations" 
  ON public.budget_allocation 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow anyone to update budget allocations
CREATE POLICY "Anyone can update budget allocations" 
  ON public.budget_allocation 
  FOR UPDATE 
  USING (true);

-- Create policy to allow anyone to delete budget allocations
CREATE POLICY "Anyone can delete budget allocations" 
  ON public.budget_allocation 
  FOR DELETE 
  USING (true);
