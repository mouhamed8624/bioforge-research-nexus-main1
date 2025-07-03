
-- Create patient_lab_results table for lab activities
CREATE TABLE public.patient_lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  test_name TEXT NOT NULL,
  value NUMERIC,
  units TEXT,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patient_lab_results
ALTER TABLE public.patient_lab_results ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_lab_results
CREATE POLICY "Anyone can view patient lab results" 
  ON public.patient_lab_results 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create patient lab results" 
  ON public.patient_lab_results 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update patient lab results" 
  ON public.patient_lab_results 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete patient lab results" 
  ON public.patient_lab_results 
  FOR DELETE 
  USING (true);

-- Create bio_banks table
CREATE TABLE public.bio_banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sample_id TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  sample_type TEXT NOT NULL,
  collection_date DATE NOT NULL,
  storage_location TEXT,
  temperature NUMERIC,
  volume_ml NUMERIC,
  status TEXT DEFAULT 'stored',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bio_banks
ALTER TABLE public.bio_banks ENABLE ROW LEVEL SECURITY;

-- Create policies for bio_banks
CREATE POLICY "Anyone can view bio banks" 
  ON public.bio_banks 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create bio banks" 
  ON public.bio_banks 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update bio banks" 
  ON public.bio_banks 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete bio banks" 
  ON public.bio_banks 
  FOR DELETE 
  USING (true);

-- Create dbs_samples table for Dry Blood Spot samples
CREATE TABLE public.dbs_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sample_id TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  collection_date DATE NOT NULL,
  collection_time TIME,
  spots_count INTEGER DEFAULT 5,
  card_type TEXT,
  storage_location TEXT,
  status TEXT DEFAULT 'collected',
  analyzed_by TEXT,
  analysis_date DATE,
  results JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on dbs_samples
ALTER TABLE public.dbs_samples ENABLE ROW LEVEL SECURITY;

-- Create policies for dbs_samples
CREATE POLICY "Anyone can view dbs samples" 
  ON public.dbs_samples 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create dbs samples" 
  ON public.dbs_samples 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update dbs samples" 
  ON public.dbs_samples 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete dbs samples" 
  ON public.dbs_samples 
  FOR DELETE 
  USING (true);

-- Add foreign key relationship between equipment_tracking and equipment_items
ALTER TABLE public.equipment_tracking
ADD CONSTRAINT fk_equipment_tracking_equipment_item
FOREIGN KEY (equipment_item_id) REFERENCES public.equipment_items(id);
