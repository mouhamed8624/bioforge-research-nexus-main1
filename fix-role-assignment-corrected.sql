-- Fix Role Assignment for New Users (Corrected)
-- This ensures new users see the role selection page instead of being auto-assigned

-- Step 1: Allow the 'role' column in the 'profiles' table to be null
ALTER TABLE public.profiles
ALTER COLUMN role DROP NOT NULL;

-- Step 2: Remove the default 'field' value from the 'role' column
ALTER TABLE public.profiles
ALTER COLUMN role DROP DEFAULT;

-- Step 3: Update the function that handles new user creation to NOT set a default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with NULL role so user must select one
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, NULL);
  
  -- Insert into team_members table with NULL role
  INSERT INTO public.team_members (id, email, name, role, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.email, 'Unknown'), NULL, 'active')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update existing users who were automatically assigned the 'field' role
-- This sets their role to NULL so they will be prompted to select a role
-- Note: We'll check if user_roles table exists and has the correct structure
UPDATE public.profiles p
SET role = NULL
WHERE p.role = 'field'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id::uuid = p.id
  );

-- Step 5: Also update team_members table
UPDATE public.team_members tm
SET role = NULL
WHERE tm.role = 'field'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id::uuid = tm.id
  );

-- Step 6: Show current state
SELECT 
  'Current User Role State:' as info,
  p.id,
  p.email,
  p.role as profile_role,
  tm.role as team_member_role,
  CASE 
    WHEN p.role IS NULL THEN 'Needs Role Selection'
    WHEN p.role IS NOT NULL THEN 'Has Role'
    ELSE 'Unknown'
  END as status
FROM public.profiles p
LEFT JOIN public.team_members tm ON p.id = tm.id
ORDER BY p.created_at DESC
LIMIT 10; 