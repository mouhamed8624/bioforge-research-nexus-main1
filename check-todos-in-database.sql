-- Check todos in database and their completion status
-- This will help debug why progress breakdown is not showing

-- Check all todos
SELECT 
  id,
  task,
  project_id,
  completed,
  completed_at,
  completed_by,
  percentage,
  created_at
FROM todos
ORDER BY created_at DESC;

-- Check todos for a specific project (replace 'your-project-id' with actual project ID)
SELECT 
  id,
  task,
  project_id,
  completed,
  completed_at,
  completed_by,
  percentage,
  created_at
FROM todos
WHERE project_id = 'your-project-id'  -- Replace with actual project ID
ORDER BY created_at DESC;

-- Check completed todos for all projects
SELECT 
  t.id,
  t.task,
  t.project_id,
  p.name as project_name,
  t.completed,
  t.completed_at,
  t.completed_by,
  t.percentage,
  t.created_at
FROM todos t
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.completed = true
ORDER BY t.completed_at DESC;

-- Check if progress_breakdown table exists and has data
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'progress_breakdown'
ORDER BY ordinal_position;

-- Check progress_breakdown data
SELECT 
  id,
  project_id,
  todo_id,
  user_email,
  progress_added,
  previous_progress,
  new_progress,
  reason,
  created_at
FROM progress_breakdown
ORDER BY created_at DESC;

-- Check if database triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'todos'
ORDER BY trigger_name; 