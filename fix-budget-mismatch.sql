-- Fix Budget Mismatch in Project Details
-- This script will help diagnose and fix budget issues

-- 1. First, let's see the current budget state
SELECT 
  'Current Budget State:' as info,
  p.id,
  p.name,
  p.budget as raw_budget,
  p.budget->>'total' as budget_total,
  p.budget->>'used' as budget_used,
  p.budget->>'progress' as budget_progress,
  (p.budget->>'total')::numeric - (p.budget->>'used')::numeric as calculated_remaining
FROM projects p
WHERE p.budget IS NOT NULL
ORDER BY p.name;

-- 2. Check for projects with missing budget fields
SELECT 
  'Projects with Missing Budget Fields:' as info,
  p.id,
  p.name,
  p.budget as raw_budget,
  CASE WHEN p.budget ? 'total' THEN '✓' ELSE '✗' END as has_total,
  CASE WHEN p.budget ? 'used' THEN '✓' ELSE '✗' END as has_used,
  CASE WHEN p.budget ? 'progress' THEN '✓' ELSE '✗' END as has_progress
FROM projects p
WHERE p.budget IS NOT NULL
  AND (NOT (p.budget ? 'total') OR NOT (p.budget ? 'used'))
ORDER BY p.name;

-- 3. Check for budget inconsistencies
SELECT 
  'Budget Inconsistencies:' as info,
  p.id,
  p.name,
  p.budget->>'total' as total,
  p.budget->>'used' as used,
  p.budget->>'progress' as progress,
  CASE 
    WHEN (p.budget->>'total')::numeric < (p.budget->>'used')::numeric 
    THEN 'Used > Total'
    WHEN (p.budget->>'total')::numeric = 0 AND (p.budget->>'used')::numeric > 0
    THEN 'Zero Total but Used > 0'
    WHEN (p.budget->>'progress')::numeric > 100
    THEN 'Progress > 100%'
    ELSE 'OK'
  END as issue
FROM projects p
WHERE p.budget IS NOT NULL
  AND p.budget ? 'total' 
  AND p.budget ? 'used'
  AND (
    (p.budget->>'total')::numeric < (p.budget->>'used')::numeric OR
    ((p.budget->>'total')::numeric = 0 AND (p.budget->>'used')::numeric > 0) OR
    (p.budget ? 'progress' AND (p.budget->>'progress')::numeric > 100)
  )
ORDER BY p.name;

-- 4. Fix common budget issues
-- Option A: Reset budget to default values
UPDATE projects 
SET budget = jsonb_build_object(
  'total', 3000,
  'used', 0,
  'progress', 0
)
WHERE budget IS NULL OR budget = '{}'::jsonb;

-- Option B: Fix used > total issues
UPDATE projects 
SET budget = jsonb_set(
  budget,
  '{used}',
  to_jsonb(LEAST((budget->>'total')::numeric, (budget->>'used')::numeric))
)
WHERE budget ? 'total' 
  AND budget ? 'used'
  AND (budget->>'total')::numeric < (budget->>'used')::numeric;

-- Option C: Fix progress > 100% issues
UPDATE projects 
SET budget = jsonb_set(
  budget,
  '{progress}',
  to_jsonb(LEAST((budget->>'progress')::numeric, 100))
)
WHERE budget ? 'progress' 
  AND (budget->>'progress')::numeric > 100;

-- 5. Verify the fixes
SELECT 
  'After Fix - Budget State:' as info,
  p.id,
  p.name,
  p.budget->>'total' as budget_total,
  p.budget->>'used' as budget_used,
  p.budget->>'progress' as budget_progress,
  (p.budget->>'total')::numeric - (p.budget->>'used')::numeric as remaining
FROM projects p
WHERE p.budget IS NOT NULL
ORDER BY p.name; 