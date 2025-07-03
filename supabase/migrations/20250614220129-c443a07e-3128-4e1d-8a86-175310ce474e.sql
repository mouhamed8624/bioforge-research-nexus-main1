
-- Create a persistent team_members table in Supabase
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  team text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- (Optional) Enable RLS - you can adjust policies to restrict access as needed.
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- (Optional) Allow all users to select, insert, update, delete for now:
CREATE POLICY "Allow all actions for all users" ON public.team_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

