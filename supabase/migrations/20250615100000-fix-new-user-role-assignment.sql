
-- Allow the 'role' column in the 'profiles' table to be null
ALTER TABLE public.profiles
ALTER COLUMN role DROP NOT NULL;

-- Remove the default 'field' value from the 'role' column
ALTER TABLE public.profiles
ALTER COLUMN role DROP DEFAULT;

-- Update existing users who were automatically assigned the 'field' role
-- This sets their role to NULL so they will be prompted to select a role
UPDATE public.profiles p
SET role = NULL
WHERE p.role = 'field'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p.id::text
  );

-- Update the function that handles new user creation to no longer set a default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
