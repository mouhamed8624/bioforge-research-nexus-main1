-- Add activity_id column to todos table
-- This script adds the activity_id column to link todos to activities

-- Add the activity_id column
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_todos_activity_id ON public.todos(activity_id);

-- Add a policy to allow access to todos with activity_id
-- (This assumes the existing policies already handle the basic access)

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'todos' AND column_name = 'activity_id'; 