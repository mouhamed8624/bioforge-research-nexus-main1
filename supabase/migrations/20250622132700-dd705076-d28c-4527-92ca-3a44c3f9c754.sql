
-- Add indexes for better query performance on DBS samples
CREATE INDEX IF NOT EXISTS idx_dbs_samples_sample_id ON dbs_samples(sample_id);
CREATE INDEX IF NOT EXISTS idx_dbs_samples_collection_date ON dbs_samples(collection_date);
CREATE INDEX IF NOT EXISTS idx_dbs_samples_status ON dbs_samples(status);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_dbs_samples_patient_date ON dbs_samples(patient_id, collection_date);
