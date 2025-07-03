
-- This migration adds several missing columns to the patients table
-- to match all the fields in the "Add New Patient" form.

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS ethnicity TEXT,
ADD COLUMN IF NOT EXISTS site TEXT,
ADD COLUMN IF NOT EXISTS project TEXT,
ADD COLUMN IF NOT EXISTS selection TEXT,
ADD COLUMN IF NOT EXISTS selection_date DATE,
ADD COLUMN IF NOT EXISTS quarter_address TEXT,
ADD COLUMN IF NOT EXISTS treatment_type TEXT,
ADD COLUMN IF NOT EXISTS malaria_type TEXT,
ADD COLUMN IF NOT EXISTS consent_obtained BOOLEAN,
ADD COLUMN IF NOT EXISTS patient_form_completed BOOLEAN,
ADD COLUMN IF NOT EXISTS consent_date DATE,
ADD COLUMN IF NOT EXISTS samples_slides INTEGER,
ADD COLUMN IF NOT EXISTS samples_serums INTEGER,
ADD COLUMN IF NOT EXISTS samples_dna INTEGER,
ADD COLUMN IF NOT EXISTS samples_filter_paper INTEGER;
