
-- Enable Row Level Security if not already enabled
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to delete patients
CREATE POLICY "Allow authenticated users to delete patients"
ON public.patients
FOR DELETE
USING (auth.role() = 'authenticated');
