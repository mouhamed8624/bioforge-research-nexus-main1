
-- First, let's ensure all auth users have corresponding profiles entries
-- This will insert any missing users from auth.users into the profiles table
INSERT INTO public.profiles (id, email, role)
SELECT au.id, au.email, 'field'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Also sync them to team_members table to make sure they appear in the team list
INSERT INTO public.team_members (id, email, name, role, status)
SELECT au.id, au.email, COALESCE(au.email, 'Unknown'), 'field', 'active'
FROM auth.users au
LEFT JOIN public.team_members tm ON au.id = tm.id
WHERE tm.id IS NULL;
