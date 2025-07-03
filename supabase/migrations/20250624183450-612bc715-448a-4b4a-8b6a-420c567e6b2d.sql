
-- Sync any users from auth.users that are missing from team_members table
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
