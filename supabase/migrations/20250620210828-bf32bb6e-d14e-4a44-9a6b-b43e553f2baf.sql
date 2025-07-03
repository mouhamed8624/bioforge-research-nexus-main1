
-- Add missing columns to the patients table to match the form fields
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS ethnicity TEXT,
ADD COLUMN IF NOT EXISTS site TEXT;
