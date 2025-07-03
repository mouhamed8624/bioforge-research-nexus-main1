
-- Add phases and progress columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS phases TEXT[],
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
