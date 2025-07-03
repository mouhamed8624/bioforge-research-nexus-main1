
-- Step 1: Make role and team columns nullable to allow for partial profiles
ALTER TABLE public.team_members ALTER COLUMN "role" DROP NOT NULL;
ALTER TABLE public.team_members ALTER COLUMN "team" DROP NOT NULL;

-- Step 2: Backfill team_members with any existing users from auth.users that are not yet present
INSERT INTO public.team_members (id, email, name)
SELECT id, email, email as name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.team_members);

-- Step 3: Update the handle_new_user function to create a team_member record on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table for role management
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Insert into team_members table to make them appear in the list
  -- Use email as the default name. role and team will be NULL.
  INSERT INTO public.team_members (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
