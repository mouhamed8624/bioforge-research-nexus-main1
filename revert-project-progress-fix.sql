-- Revert Project Progress Fix
-- This script will restore the original project progress values

-- First, let's see what the current state is
SELECT 
  'Current state before revert:' as info,
  p.id,
  p.name,
  p.budget->>'progress' as current_progress,
  COALESCE(SUM(t.percentage), 0) as calculated_progress,
  ABS((p.budget->>'progress')::int - COALESCE(SUM(t.percentage), 0)) as difference
FROM projects p
LEFT JOIN todos t ON p.id = t.project_id AND t.completed = true
WHERE p.budget->>'progress' IS NOT NULL
GROUP BY p.id, p.name, p.budget
ORDER BY difference DESC;

-- If you want to revert to a specific progress value, you can update manually:
-- UPDATE projects 
-- SET budget = jsonb_set(
--   COALESCE(budget, '{}'::jsonb),
--   '{progress}',
--   to_jsonb(0)  -- Set to 0 or whatever value you want
-- )
-- WHERE id = 'your-project-id';

-- Or if you want to remove the progress field entirely:
-- UPDATE projects 
-- SET budget = budget - 'progress'
-- WHERE budget ? 'progress';

-- Show the projects that were affected by the original fix
SELECT 
  'Projects that were affected by the progress fix:' as info,
  p.id,
  p.name,
  p.budget->>'progress' as current_progress,
  COALESCE(SUM(t.percentage), 0) as calculated_progress,
  ABS((p.budget->>'progress')::int - COALESCE(SUM(t.percentage), 0)) as difference
FROM projects p
LEFT JOIN todos t ON p.id = t.project_id AND t.completed = true
WHERE p.budget->>'progress' IS NOT NULL
GROUP BY p.id, p.name, p.budget
HAVING ABS((p.budget->>'progress')::int - COALESCE(SUM(t.percentage), 0)) > 1
ORDER BY difference DESC; 