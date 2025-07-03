
-- Add Principal Investigator and Co-Principal Investigator fields to projects table
ALTER TABLE public.projects 
ADD COLUMN principal_investigator TEXT,
ADD COLUMN co_principal_investigator TEXT;
