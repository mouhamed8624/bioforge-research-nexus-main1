
-- First, drop the existing type if it exists and recreate with new values
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Create the app_role enum with all the required roles
CREATE TYPE public.app_role AS ENUM (
  'president',
  'admin', 
  'lab',
  'general_director',
  'manager',
  'field',
  'front_desk',
  'financial'
);

-- Update the user_roles table to use the new enum
ALTER TABLE public.user_roles 
DROP COLUMN IF EXISTS role,
ADD COLUMN role public.app_role NOT NULL;

-- Recreate the has_role function with the updated enum
CREATE OR REPLACE FUNCTION public.has_role(role_name app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = auth.uid()::text 
        AND role = role_name
    );
END;
$$;
