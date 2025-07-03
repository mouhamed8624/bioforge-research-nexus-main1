
-- Add serial_number column to equipment_items table
ALTER TABLE public.equipment_items 
ADD COLUMN serial_number text UNIQUE;

-- Update existing equipment items with generated serial numbers
UPDATE public.equipment_items 
SET serial_number = 'LAB-' || EXTRACT(epoch FROM now())::bigint::text || '-' || LPAD((random() * 999)::int::text, 3, '0')
WHERE serial_number IS NULL;

-- Make serial_number NOT NULL after updating existing records
ALTER TABLE public.equipment_items 
ALTER COLUMN serial_number SET NOT NULL;
