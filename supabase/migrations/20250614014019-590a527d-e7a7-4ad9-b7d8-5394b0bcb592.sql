
-- Add new columns to the projects table
ALTER TABLE public.projects 
ADD COLUMN start_date date,
ADD COLUMN end_date date,
ADD COLUMN project_budget numeric,
ADD COLUMN team_members text[],
ADD COLUMN outside_collaborators text[],
ADD COLUMN phases jsonb,
ADD COLUMN todo_list jsonb,
ADD COLUMN progress numeric DEFAULT 0,
ADD COLUMN priority text DEFAULT 'medium';

-- Update existing projects to have default values
UPDATE public.projects 
SET phases = '[]'::jsonb, 
    todo_list = '[]'::jsonb,
    team_members = '{}',
    outside_collaborators = '{}' 
WHERE phases IS NULL;
