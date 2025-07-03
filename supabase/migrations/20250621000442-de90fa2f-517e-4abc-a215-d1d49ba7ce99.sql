
-- Add the missing notes column to the dbs_samples table
ALTER TABLE public.dbs_samples 
ADD COLUMN notes text;
