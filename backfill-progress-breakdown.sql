-- Backfill progress breakdown for existing completed todos
-- Run this AFTER creating the progress_breakdown table

-- First, let's see what we have
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.budget->>'progress' as current_progress,
  COUNT(t.id) as completed_todos_count
FROM projects p
LEFT JOIN todos t ON p.id = t.project_id AND t.completed = true
GROUP BY p.id, p.name, p.budget
HAVING p.budget->>'progress' IS NOT NULL AND (p.budget->>'progress')::int > 0
ORDER BY (p.budget->>'progress')::int DESC;

-- Backfill progress breakdown for completed todos
INSERT INTO progress_breakdown (
  project_id,
  todo_id,
  user_email,
  progress_added,
  previous_progress,
  new_progress,
  reason,
  details,
  created_at
)
SELECT 
  t.project_id,
  t.id as todo_id,
  COALESCE(t.completed_by, 'Unknown User') as user_email,
  t.percentage as progress_added,
  -- Calculate previous progress based on completion order
  COALESCE(
    (
      SELECT SUM(t2.percentage)
      FROM todos t2
      WHERE t2.project_id = t.project_id 
        AND t2.completed = true 
        AND t2.completed_at < t.completed_at
    ), 0
  ) as previous_progress,
  -- Calculate new progress
  COALESCE(
    (
      SELECT SUM(t2.percentage)
      FROM todos t2
      WHERE t2.project_id = t.project_id 
        AND t2.completed = true 
        AND t2.completed_at <= t.completed_at
    ), 0
  ) as new_progress,
  'Task completed: ' || t.task as reason,
  'Completed task "' || t.task || '" which contributed ' || t.percentage || '% to project progress.' as details,
  COALESCE(t.completed_at, t.updated_at) as created_at
FROM todos t
WHERE t.completed = true 
  AND t.project_id IS NOT NULL
  AND t.completed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM progress_breakdown pb WHERE pb.todo_id = t.id
  )
ORDER BY t.completed_at;

-- For projects with progress but no completed todos (manual progress updates)
INSERT INTO progress_breakdown (
  project_id,
  todo_id,
  user_email,
  progress_added,
  previous_progress,
  new_progress,
  reason,
  details,
  created_at
)
SELECT 
  p.id as project_id,
  NULL as todo_id,
  'System' as user_email,
  (p.budget->>'progress')::int as progress_added,
  0 as previous_progress,
  (p.budget->>'progress')::int as new_progress,
  'Initial project progress' as reason,
  'Project started with ' || (p.budget->>'progress')::int || '% initial progress.' as details,
  p.created_at
FROM projects p
WHERE p.budget->>'progress' IS NOT NULL 
  AND (p.budget->>'progress')::int > 0
  AND NOT EXISTS (
    SELECT 1 FROM progress_breakdown pb WHERE pb.project_id = p.id
  );

-- Show the results
SELECT 
  pb.project_id,
  p.name as project_name,
  pb.reason,
  pb.user_email,
  pb.progress_added,
  pb.previous_progress,
  pb.new_progress,
  pb.created_at
FROM progress_breakdown pb
JOIN projects p ON pb.project_id = p.id
ORDER BY pb.created_at DESC; 