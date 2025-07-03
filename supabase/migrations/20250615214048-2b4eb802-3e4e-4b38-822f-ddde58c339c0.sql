
-- This migration ensures every user has a role and syncs it to the team_members table.

-- Step 1: Backfill the role for any existing users in the profiles table who have a NULL role.
-- We'll set it to 'field' as a sensible default.
UPDATE public.profiles
SET role = 'field'
WHERE role IS NULL;

-- Step 2: Now that all profiles have a role, we can enforce this with a NOT NULL constraint.
-- This guarantees every user will always have a role going forward.
ALTER TABLE public.profiles
ALTER COLUMN "role" SET NOT NULL;

-- Step 3: Sync the roles from the profiles table to the team_members table for consistency.
UPDATE public.team_members tm
SET role = p.role::text
FROM public.profiles p
WHERE tm.id = p.id;

-- Step 4: Update the handle_new_user function to assign a default role on new user signup.
-- This ensures new users are created with a role in both profiles and team_members.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with a default role 'field'
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'field')
  ON CONFLICT (id) DO NOTHING;

  -- Insert into team_members table with a default name and role
  INSERT INTO public.team_members (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.email, 'field')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
