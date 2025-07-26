-- Fix Budget Tracking in Projects
-- This will ensure project budget.used is automatically updated when spending is recorded

-- Function to update project budget when spending is added
CREATE OR REPLACE FUNCTION update_project_budget_on_spending()
RETURNS TRIGGER AS $$
DECLARE
  current_budget JSONB;
  current_used NUMERIC := 0;
  new_used NUMERIC := 0;
BEGIN
  -- Get current project budget
  SELECT budget INTO current_budget
  FROM projects
  WHERE id = NEW.project_id;
  
  -- Calculate current used amount
  IF current_budget IS NOT NULL AND current_budget ? 'used' THEN
    current_used := (current_budget->>'used')::NUMERIC;
  END IF;
  
  -- Add new spending amount
  new_used := current_used + NEW.amount;
  
  -- Update project budget
  UPDATE projects
  SET budget = jsonb_set(
    COALESCE(budget, '{}'::jsonb),
    '{used}',
    to_jsonb(new_used)
  ),
  updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update project budget when spending is deleted
CREATE OR REPLACE FUNCTION update_project_budget_on_spending_delete()
RETURNS TRIGGER AS $$
DECLARE
  current_budget JSONB;
  current_used NUMERIC := 0;
  new_used NUMERIC := 0;
BEGIN
  -- Get current project budget
  SELECT budget INTO current_budget
  FROM projects
  WHERE id = OLD.project_id;
  
  -- Calculate current used amount
  IF current_budget IS NOT NULL AND current_budget ? 'used' THEN
    current_used := (current_budget->>'used')::NUMERIC;
  END IF;
  
  -- Subtract deleted spending amount
  new_used := GREATEST(0, current_used - OLD.amount);
  
  -- Update project budget
  UPDATE projects
  SET budget = jsonb_set(
    COALESCE(budget, '{}'::jsonb),
    '{used}',
    to_jsonb(new_used)
  ),
  updated_at = NOW()
  WHERE id = OLD.project_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_budget_on_spending ON spending;
CREATE TRIGGER trigger_update_budget_on_spending
  AFTER INSERT ON spending
  FOR EACH ROW
  EXECUTE FUNCTION update_project_budget_on_spending();

DROP TRIGGER IF EXISTS trigger_update_budget_on_spending_delete ON spending;
CREATE TRIGGER trigger_update_budget_on_spending_delete
  AFTER DELETE ON spending
  FOR EACH ROW
  EXECUTE FUNCTION update_project_budget_on_spending_delete();

-- Backfill: Update all project budgets to match current spending
UPDATE projects 
SET budget = jsonb_set(
  COALESCE(budget, '{}'::jsonb),
  '{used}',
  to_jsonb(
    COALESCE(
      (SELECT SUM(amount) FROM spending WHERE project_id = projects.id), 
      0
    )
  )
)
WHERE budget IS NOT NULL;

-- Show current budget state after fix
SELECT 
  'Budget Tracking Fixed:' as info,
  p.id,
  p.name,
  p.budget->>'total' as total,
  p.budget->>'used' as used,
  p.budget->>'progress' as progress,
  (p.budget->>'total')::numeric - (p.budget->>'used')::numeric as remaining,
  COALESCE(s.total_spending, 0) as actual_spending
FROM projects p
LEFT JOIN (
  SELECT project_id, SUM(amount) as total_spending 
  FROM spending 
  GROUP BY project_id
) s ON p.id = s.project_id
WHERE p.budget IS NOT NULL
ORDER BY p.name; 