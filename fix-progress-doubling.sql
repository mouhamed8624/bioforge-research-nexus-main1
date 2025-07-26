-- Fix Progress Doubling Issue
-- This script will correct project progress that was doubled due to multiple updates

-- First, let's see the current state
SELECT 
  'Current Progress State:' as info,
  p.id,
  p.name,
  p.budget->>'progress' as current_progress,
  COALESCE(SUM(t.percentage), 0) as calculated_progress,
  ABS((p.budget->>'progress')::int - COALESCE(SUM(t.percentage), 0)) as difference,
  COUNT(t.id) as completed_todos_count
FROM projects p
LEFT JOIN todos t ON p.id = t.project_id AND t.completed = true
WHERE p.budget->>'progress' IS NOT NULL
GROUP BY p.id, p.name, p.budget
ORDER BY difference DESC;

-- Fix projects where progress is doubled (more than 10% difference)
UPDATE projects 
SET budget = jsonb_set(
  COALESCE(budget, '{}'::jsonb),
  '{progress}',
  to_jsonb(
    COALESCE(
      (SELECT SUM(t.percentage) FROM todos t WHERE t.project_id = projects.id AND t.completed = true), 
      0
    )
  )
)
WHERE budget ? 'progress'
  AND ABS(
    (budget->>'progress')::int - 
    COALESCE((SELECT SUM(t.percentage) FROM todos t WHERE t.project_id = projects.id AND t.completed = true), 0)
  ) > 10;

-- Show the results after fix
SELECT 
  'After Fix - Progress State:' as info,
  p.id,
  p.name,
  p.budget->>'progress' as current_progress,
  COALESCE(SUM(t.percentage), 0) as calculated_progress,
  ABS((p.budget->>'progress')::int - COALESCE(SUM(t.percentage), 0)) as difference,
  COUNT(t.id) as completed_todos_count
FROM projects p
LEFT JOIN todos t ON p.id = t.project_id AND t.completed = true
WHERE p.budget->>'progress' IS NOT NULL
GROUP BY p.id, p.name, p.budget
ORDER BY p.name;

-- Verify that the database trigger is working correctly
SELECT 
  'Database Trigger Status:' as info,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%todo%' 
  AND event_object_table = 'todos'
ORDER BY trigger_name; 