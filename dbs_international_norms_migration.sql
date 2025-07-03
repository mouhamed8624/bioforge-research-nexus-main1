-- Add international_norms column to existing dbs_samples table
-- This allows DBS samples to track compliance with international standards

ALTER TABLE public.dbs_samples 
ADD COLUMN international_norms text;

-- Add index for better query performance
CREATE INDEX idx_dbs_samples_international_norms ON public.dbs_samples(international_norms);

-- Add comment to the new column
COMMENT ON COLUMN public.dbs_samples.international_norms IS 'International standard/norm that the DBS sample complies with (WHO-2023, ISO-15189, CLSI-GP33, FDA-510K, CE-IVD, CDC-Guidelines, NCCLS-H4-A6, Other)';

-- Optional: Add constraint to limit values to known standards
ALTER TABLE public.dbs_samples ADD CONSTRAINT dbs_samples_international_norms_check 
  CHECK (international_norms IS NULL OR international_norms IN (
    'WHO-2023', 
    'ISO-15189', 
    'CLSI-GP33', 
    'FDA-510K', 
    'CE-IVD', 
    'CDC-Guidelines', 
    'NCCLS-H4-A6', 
    'Other'
  ));

-- Update existing records to have a default value (optional)
-- UPDATE public.dbs_samples SET international_norms = 'WHO-2023' WHERE international_norms IS NULL; 