-- Safe script to create milestones and activities tables
-- This script checks for existing objects before creating them

-- Check if milestones table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones' AND table_schema = 'public') THEN
    CREATE TABLE public.milestones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    RAISE NOTICE 'Created milestones table';
  ELSE
    RAISE NOTICE 'Milestones table already exists';
  END IF;
END $$;

-- Check if activities table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities' AND table_schema = 'public') THEN
    CREATE TABLE public.activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      assigned_to TEXT[] DEFAULT '{}',
      estimated_hours INTEGER,
      actual_hours INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    RAISE NOTICE 'Created activities table';
  ELSE
    RAISE NOTICE 'Activities table already exists';
  END IF;
END $$;

-- Add activity_id column to todos table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'activity_id') THEN
    ALTER TABLE public.todos ADD COLUMN activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added activity_id column to todos table';
  ELSE
    RAISE NOTICE 'activity_id column already exists in todos table';
  END IF;
END $$;

-- Enable RLS on tables
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for milestones (only if they don't exist)
DO $$
BEGIN
  -- View policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'milestones' AND policyname = 'Allow authorized roles to view milestones') THEN
    CREATE POLICY "Allow authorized roles to view milestones" 
      ON public.milestones 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager', 'front_desk', 'financial')
        )
      );
    RAISE NOTICE 'Created view policy for milestones';
  ELSE
    RAISE NOTICE 'View policy for milestones already exists';
  END IF;

  -- Insert policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'milestones' AND policyname = 'Allow authorized roles to insert milestones') THEN
    CREATE POLICY "Allow authorized roles to insert milestones" 
      ON public.milestones 
      FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
        )
      );
    RAISE NOTICE 'Created insert policy for milestones';
  ELSE
    RAISE NOTICE 'Insert policy for milestones already exists';
  END IF;

  -- Update policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'milestones' AND policyname = 'Allow authorized roles to update milestones') THEN
    CREATE POLICY "Allow authorized roles to update milestones" 
      ON public.milestones 
      FOR UPDATE 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
        )
      );
    RAISE NOTICE 'Created update policy for milestones';
  ELSE
    RAISE NOTICE 'Update policy for milestones already exists';
  END IF;

  -- Delete policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'milestones' AND policyname = 'Allow authorized roles to delete milestones') THEN
    CREATE POLICY "Allow authorized roles to delete milestones" 
      ON public.milestones 
      FOR DELETE 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
        )
      );
    RAISE NOTICE 'Created delete policy for milestones';
  ELSE
    RAISE NOTICE 'Delete policy for milestones already exists';
  END IF;
END $$;

-- Create RLS policies for activities (only if they don't exist)
DO $$
BEGIN
  -- View policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Allow authorized roles to view activities') THEN
    CREATE POLICY "Allow authorized roles to view activities" 
      ON public.activities 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager', 'front_desk', 'financial')
        )
      );
    RAISE NOTICE 'Created view policy for activities';
  ELSE
    RAISE NOTICE 'View policy for activities already exists';
  END IF;

  -- Insert policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Allow authorized roles to insert activities') THEN
    CREATE POLICY "Allow authorized roles to insert activities" 
      ON public.activities 
      FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
        )
      );
    RAISE NOTICE 'Created insert policy for activities';
  ELSE
    RAISE NOTICE 'Insert policy for activities already exists';
  END IF;

  -- Update policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Allow authorized roles to update activities') THEN
    CREATE POLICY "Allow authorized roles to update activities" 
      ON public.activities 
      FOR UPDATE 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
        )
      );
    RAISE NOTICE 'Created update policy for activities';
  ELSE
    RAISE NOTICE 'Update policy for activities already exists';
  END IF;

  -- Delete policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Allow authorized roles to delete activities') THEN
    CREATE POLICY "Allow authorized roles to delete activities" 
      ON public.activities 
      FOR DELETE 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('president', 'admin', 'lab', 'unit_team_leader', 'general_director', 'manager')
        )
      );
    RAISE NOTICE 'Created delete policy for activities';
  ELSE
    RAISE NOTICE 'Delete policy for activities already exists';
  END IF;
END $$;

-- Create indexes (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_milestones_project_id') THEN
    CREATE INDEX idx_milestones_project_id ON public.milestones(project_id);
    RAISE NOTICE 'Created index idx_milestones_project_id';
  ELSE
    RAISE NOTICE 'Index idx_milestones_project_id already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_milestones_status') THEN
    CREATE INDEX idx_milestones_status ON public.milestones(status);
    RAISE NOTICE 'Created index idx_milestones_status';
  ELSE
    RAISE NOTICE 'Index idx_milestones_status already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_milestones_created_at') THEN
    CREATE INDEX idx_milestones_created_at ON public.milestones(created_at);
    RAISE NOTICE 'Created index idx_milestones_created_at';
  ELSE
    RAISE NOTICE 'Index idx_milestones_created_at already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_milestone_id') THEN
    CREATE INDEX idx_activities_milestone_id ON public.activities(milestone_id);
    RAISE NOTICE 'Created index idx_activities_milestone_id';
  ELSE
    RAISE NOTICE 'Index idx_activities_milestone_id already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_status') THEN
    CREATE INDEX idx_activities_status ON public.activities(status);
    RAISE NOTICE 'Created index idx_activities_status';
  ELSE
    RAISE NOTICE 'Index idx_activities_status already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_created_at') THEN
    CREATE INDEX idx_activities_created_at ON public.activities(created_at);
    RAISE NOTICE 'Created index idx_activities_created_at';
  ELSE
    RAISE NOTICE 'Index idx_activities_created_at already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_todos_activity_id') THEN
    CREATE INDEX idx_todos_activity_id ON public.todos(activity_id);
    RAISE NOTICE 'Created index idx_todos_activity_id';
  ELSE
    RAISE NOTICE 'Index idx_todos_activity_id already exists';
  END IF;
END $$;

-- Add triggers for updated_at (only if the function exists and triggers don't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_milestones_updated_at') THEN
      CREATE TRIGGER update_milestones_updated_at 
        BEFORE UPDATE ON public.milestones 
        FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
      RAISE NOTICE 'Created trigger update_milestones_updated_at';
    ELSE
      RAISE NOTICE 'Trigger update_milestones_updated_at already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_activities_updated_at') THEN
      CREATE TRIGGER update_activities_updated_at 
        BEFORE UPDATE ON public.activities 
        FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
      RAISE NOTICE 'Created trigger update_activities_updated_at';
    ELSE
      RAISE NOTICE 'Trigger update_activities_updated_at already exists';
    END IF;
  ELSE
    RAISE NOTICE 'handle_updated_at function does not exist, skipping triggers';
  END IF;
END $$;

-- Final status check
SELECT 
  'milestones' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones') as table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'milestones') as policy_count
UNION ALL
SELECT 
  'activities' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') as table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'activities') as policy_count; 