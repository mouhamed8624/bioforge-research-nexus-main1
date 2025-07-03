
-- Drop the existing foreign key constraint
ALTER TABLE public.spending 
DROP CONSTRAINT IF EXISTS spending_project_id_fkey;

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE public.spending 
ADD CONSTRAINT spending_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;
