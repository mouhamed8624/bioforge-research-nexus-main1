
-- Add collection_location column to dbs_samples table
ALTER TABLE public.dbs_samples 
ADD COLUMN collection_location TEXT;
