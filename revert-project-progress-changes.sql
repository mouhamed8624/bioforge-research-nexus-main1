-- Revert Project Progress Changes
-- This will undo the changes that made project progress match the breakdown

-- Option 1: Reset all project progress to 0
UPDATE projects 
SET budget = jsonb_set(
  COALESCE(budget, '{}'::jsonb),
  '{progress}',
  to_jsonb(0)
)
WHERE budget ? 'progress';

-- Option 2: Remove the progress field entirely from all projects
-- UPDATE projects 
-- SET budget = budget - 'progress'
-- WHERE budget ? 'progress';

-- Option 3: Reset to a specific value (replace 25 with your desired value)
-- UPDATE projects 
-- SET budget = jsonb_set(
--   COALESCE(budget, '{}'::jsonb),
--   '{progress}',
--   to_jsonb(25)
-- )
-- WHERE budget ? 'progress';

-- Verify the changes
SELECT 
  'After revert - Project progress values:' as info,
  p.id,
  p.name,
  p.budget->>'progress' as current_progress,
  COALESCE(SUM(t.percentage), 0) as calculated_progress,
  ABS((p.budget->>'progress')::int - COALESCE(SUM(t.percentage), 0)) as difference
FROM projects p
LEFT JOIN todos t ON p.id = t.project_id AND t.completed = true
WHERE p.budget->>'progress' IS NOT NULL
GROUP BY p.id, p.name, p.budget
ORDER BY p.name; 