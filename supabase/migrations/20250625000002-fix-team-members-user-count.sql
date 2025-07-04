-- Fix team members user count issue
-- This migration ensures new users are properly added to both profiles and team_members tables

-- First, let's ensure the team_members table has the correct structure
-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_members' AND column_name = 'status') THEN
        ALTER TABLE public.team_members ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;

-- Update the handle_new_user function to properly create entries in both tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with a default role 'field'
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'field')
  ON CONFLICT (id) DO NOTHING;

  -- Insert into team_members table with all required fields
  INSERT INTO public.team_members (id, email, name, role, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.email, 'Unknown'), 'field', 'active')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync any existing users from auth.users that are missing from team_members table
INSERT INTO public.team_members (id, email, name, role, status)
SELECT au.id, au.email, COALESCE(au.email, 'Unknown'), 'field', 'active'
FROM auth.users au
LEFT JOIN public.team_members tm ON au.id = tm.id
WHERE tm.id IS NULL;

-- Also ensure they have a profile entry
INSERT INTO public.profiles (id, email, role)
SELECT au.id, au.email, 'field'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Update any existing team_members with NULL roles to have 'field' role
UPDATE public.team_members 
SET role = 'field' 
WHERE role IS NULL;

-- Update any existing team_members with NULL status to have 'active' status
UPDATE public.team_members 
SET status = 'active' 
WHERE status IS NULL; 