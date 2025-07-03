
-- Add budget founder and organizations fields to projects table
ALTER TABLE public.projects 
ADD COLUMN budget_founder TEXT,
ADD COLUMN organizations TEXT[];
