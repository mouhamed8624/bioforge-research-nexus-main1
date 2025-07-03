-- Create plaquettes table for laboratory sample management
-- This table stores comprehensive information about plaquette samples including international norms compliance

CREATE TABLE public.plaquettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plaquette_id text NOT NULL UNIQUE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  collection_date date NOT NULL,
  collection_time time,
  collection_year integer,
  collection_location text, -- Region in Senegal
  collection_locality text, -- Specific location/facility
  plaquette_type text, -- Standard, Micro, Mini, Large, 96-well, 384-well, Custom
  international_norms text NOT NULL, -- WHO-2023, ISO-15189, CLSI-GP33, FDA-510K, CE-IVD, CDC-Guidelines, NCCLS-H4-A6, Other
  spots_count integer DEFAULT 5,
  temperature numeric(5,2), -- Storage temperature in Celsius
  storage_container text,
  storage_room text,
  storage_location text,
  storage_date date,
  expiration_date date,
  quality_control boolean DEFAULT false,
  collected_by text,
  processed_by text,
  status text NOT NULL DEFAULT 'collected', -- collected, processed, pending, rejected
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_plaquettes_plaquette_id ON public.plaquettes(plaquette_id);
CREATE INDEX idx_plaquettes_patient_id ON public.plaquettes(patient_id);
CREATE INDEX idx_plaquettes_collection_date ON public.plaquettes(collection_date);
CREATE INDEX idx_plaquettes_status ON public.plaquettes(status);
CREATE INDEX idx_plaquettes_international_norms ON public.plaquettes(international_norms);
CREATE INDEX idx_plaquettes_collection_location ON public.plaquettes(collection_location);

-- Enable Row Level Security
ALTER TABLE public.plaquettes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to view plaquettes (restricted to lab role only)
CREATE POLICY "Allow lab users to view plaquettes"
  ON public.plaquettes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'lab'
    )
  );

-- Allow lab role to insert plaquettes
CREATE POLICY "Allow lab users to insert plaquettes"
  ON public.plaquettes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'lab'
    )
  );

-- Allow lab role to update plaquettes
CREATE POLICY "Allow lab users to update plaquettes"
  ON public.plaquettes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'lab'
    )
  );

-- Allow lab role to delete plaquettes
CREATE POLICY "Allow lab users to delete plaquettes"
  ON public.plaquettes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'lab'
    )
  );

-- Add trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plaquettes_updated_at
  BEFORE UPDATE ON public.plaquettes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraints for data validation
ALTER TABLE public.plaquettes ADD CONSTRAINT plaquettes_status_check 
  CHECK (status IN ('collected', 'processed', 'pending', 'rejected'));

ALTER TABLE public.plaquettes ADD CONSTRAINT plaquettes_spots_count_check 
  CHECK (spots_count > 0 AND spots_count <= 20);

ALTER TABLE public.plaquettes ADD CONSTRAINT plaquettes_collection_year_check 
  CHECK (collection_year >= 2000 AND collection_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1);

-- Add comment to the table
COMMENT ON TABLE public.plaquettes IS 'Laboratory plaquette samples with international norms compliance tracking';

-- Add comments to important columns
COMMENT ON COLUMN public.plaquettes.plaquette_id IS 'Unique identifier for the plaquette sample (auto-generated)';
COMMENT ON COLUMN public.plaquettes.international_norms IS 'International standard/norm that the sample complies with';
COMMENT ON COLUMN public.plaquettes.quality_control IS 'Whether the sample has passed quality control checks';
COMMENT ON COLUMN public.plaquettes.temperature IS 'Storage temperature in degrees Celsius';
COMMENT ON COLUMN public.plaquettes.spots_count IS 'Number of spots on the plaquette (typically 1-20)';

-- Sample data for testing
INSERT INTO public.plaquettes (
  plaquette_id, 
  collection_date, 
  collection_year,
  collection_location,
  plaquette_type,
  international_norms,
  spots_count,
  temperature,
  status,
  quality_control,
  collected_by,
  notes
) VALUES 
(
  'PLQ-20250101-001',
  '2025-01-01',
  2025,
  'Dakar',
  'Standard',
  'WHO-2023',
  5,
  -20.0,
  'collected',
  true,
  'Lab Technician A',
  'Sample plaquette for testing'
); 