-- Verify Database Setup for Progress Breakdown
-- Run this to check if everything is configured correctly

-- 1. Check if todos table exists and has the right structure
SELECT 
  'todos table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'todos'
ORDER BY ordinal_position;

-- 2. Check if progress_breakdown table exists
SELECT 
  'progress_breakdown table exists:' as info,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_name = 'progress_breakdown';

-- 3. Check if progress_breakdown table has the right structure
SELECT 
  'progress_breakdown table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'progress_breakdown'
ORDER BY ordinal_position;

-- 4. Check if triggers exist
SELECT 
  'todos table triggers:' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'todos';

-- 5. Check RLS policies
SELECT 
  'RLS policies for todos:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'todos';

SELECT 
  'RLS policies for progress_breakdown:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'progress_breakdown';

-- 6. Check sample data
SELECT 
  'Sample todos data:' as info,
  COUNT(*) as total_todos,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_todos,
  COUNT(CASE WHEN project_id IS NOT NULL THEN 1 END) as todos_with_projects
FROM todos;

SELECT 
  'Sample progress_breakdown data:' as info,
  COUNT(*) as total_records
FROM progress_breakdown;

-- 7. Check if there are any completed todos with project_id
SELECT 
  'Completed todos with projects:' as info,
  t.id,
  t.task,
  t.project_id,
  p.name as project_name,
  t.completed,
  t.completed_at,
  t.percentage
FROM todos t
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.completed = true AND t.project_id IS NOT NULL
ORDER BY t.completed_at DESC
LIMIT 10; 