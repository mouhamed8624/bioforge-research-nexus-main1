-- Reset All Project Budgets to 3000
-- This will set all projects to have a reasonable budget of 3000

-- Reset all project budgets to 3000 total, 0 used, 0 progress
UPDATE projects 
SET budget = jsonb_build_object(
  'total', 3000,
  'used', 0,
  'progress', 0
)
WHERE budget IS NOT NULL;

-- Show the results
SELECT 
  'Reset Budget State:' as info,
  p.id,
  p.name,
  p.budget->>'total' as total,
  p.budget->>'used' as used,
  p.budget->>'progress' as progress,
  (p.budget->>'total')::numeric - (p.budget->>'used')::numeric as remaining
FROM projects p
WHERE p.budget IS NOT NULL
ORDER BY p.name; 