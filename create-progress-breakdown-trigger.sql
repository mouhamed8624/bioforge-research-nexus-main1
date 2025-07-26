-- Create database trigger to automatically create progress breakdown records
-- This ensures progress breakdown is created even if frontend fails

-- Function to handle todo completion and create progress breakdown
CREATE OR REPLACE FUNCTION handle_todo_completion()
RETURNS TRIGGER AS $$
DECLARE
  current_progress INTEGER := 0;
  new_progress INTEGER := 0;
  project_budget JSONB;
BEGIN
  -- Only proceed if todo is being marked as completed
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    
    -- Get current project progress
    IF NEW.project_id IS NOT NULL THEN
      SELECT budget INTO project_budget
      FROM projects
      WHERE id = NEW.project_id;
      
      IF project_budget IS NOT NULL AND project_budget ? 'progress' THEN
        current_progress := (project_budget->>'progress')::INTEGER;
      END IF;
      
      new_progress := LEAST(100, current_progress + NEW.percentage);
      
      -- Create progress breakdown record
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
      ) VALUES (
        NEW.project_id,
        NEW.id,
        COALESCE(NEW.completed_by, 'Unknown User'),
        NEW.percentage,
        current_progress,
        new_progress,
        'Task completed: ' || NEW.task,
        'Completed task "' || NEW.task || '" which contributed ' || NEW.percentage || '% to project progress.',
        COALESCE(NEW.completed_at, NOW())
      );
      
      -- Update project progress
      UPDATE projects
      SET budget = jsonb_set(
        COALESCE(budget, '{}'::jsonb),
        '{progress}',
        to_jsonb(new_progress)
      ),
      updated_at = NOW()
      WHERE id = NEW.project_id;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on todos table
DROP TRIGGER IF EXISTS trigger_todo_completion ON todos;
CREATE TRIGGER trigger_todo_completion
  AFTER UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION handle_todo_completion();

-- Also create trigger for INSERT in case todos are created as completed
CREATE OR REPLACE FUNCTION handle_todo_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_progress INTEGER := 0;
  new_progress INTEGER := 0;
  project_budget JSONB;
BEGIN
  -- Only proceed if todo is being created as completed
  IF NEW.completed = true AND NEW.project_id IS NOT NULL THEN
    
    -- Get current project progress
    SELECT budget INTO project_budget
    FROM projects
    WHERE id = NEW.project_id;
    
    IF project_budget IS NOT NULL AND project_budget ? 'progress' THEN
      current_progress := (project_budget->>'progress')::INTEGER;
    END IF;
    
    new_progress := LEAST(100, current_progress + NEW.percentage);
    
    -- Create progress breakdown record
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
    ) VALUES (
      NEW.project_id,
      NEW.id,
      COALESCE(NEW.completed_by, 'Unknown User'),
      NEW.percentage,
      current_progress,
      new_progress,
      'Task completed: ' || NEW.task,
      'Completed task "' || NEW.task || '" which contributed ' || NEW.percentage || '% to project progress.',
      COALESCE(NEW.completed_at, NOW())
    );
    
    -- Update project progress
    UPDATE projects
    SET budget = jsonb_set(
      COALESCE(budget, '{}'::jsonb),
      '{progress}',
      to_jsonb(new_progress)
    ),
    updated_at = NOW()
    WHERE id = NEW.project_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_todo_insert ON todos;
CREATE TRIGGER trigger_todo_insert
  AFTER INSERT ON todos
  FOR EACH ROW
  EXECUTE FUNCTION handle_todo_insert();

-- Show confirmation
SELECT 'Progress breakdown triggers created successfully!' as status; 