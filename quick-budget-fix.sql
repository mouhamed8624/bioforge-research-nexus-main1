-- Quick Budget Fix
-- This will fix common budget issues that might have occurred recently

-- 1. Fix projects with null or empty budget
UPDATE projects 
SET budget = jsonb_build_object(
  'total', 3000,
  'used', 0,
  'progress', 0
)
WHERE budget IS NULL OR budget = '{}'::jsonb;

-- 2. Fix projects with missing budget fields
UPDATE projects 
SET budget = jsonb_set(
  COALESCE(budget, '{}'::jsonb),
  '{total}',
  to_jsonb(COALESCE((budget->>'total')::numeric, 3000))
)
WHERE NOT (budget ? 'total');

UPDATE projects 
SET budget = jsonb_set(
  COALESCE(budget, '{}'::jsonb),
  '{used}',
  to_jsonb(COALESCE((budget->>'used')::numeric, 0))
)
WHERE NOT (budget ? 'used');

UPDATE projects 
SET budget = jsonb_set(
  COALESCE(budget, '{}'::jsonb),
  '{progress}',
  to_jsonb(COALESCE((budget->>'progress')::numeric, 0))
)
WHERE NOT (budget ? 'progress');

-- 3. Fix budget inconsistencies
-- Fix used > total
UPDATE projects 
SET budget = jsonb_set(
  budget,
  '{used}',
  to_jsonb(LEAST((budget->>'total')::numeric, (budget->>'used')::numeric))
)
WHERE budget ? 'total' 
  AND budget ? 'used'
  AND (budget->>'total')::numeric < (budget->>'used')::numeric;

-- Fix progress > 100%
UPDATE projects 
SET budget = jsonb_set(
  budget,
  '{progress}',
  to_jsonb(LEAST((budget->>'progress')::numeric, 100))
)
WHERE budget ? 'progress' 
  AND (budget->>'progress')::numeric > 100;

-- 4. Show the results
SELECT 
  'Fixed Budget State:' as info,
  p.id,
  p.name,
  p.budget->>'total' as total,
  p.budget->>'used' as used,
  p.budget->>'progress' as progress,
  (p.budget->>'total')::numeric - (p.budget->>'used')::numeric as remaining
FROM projects p
WHERE p.budget IS NOT NULL
ORDER BY p.name; 