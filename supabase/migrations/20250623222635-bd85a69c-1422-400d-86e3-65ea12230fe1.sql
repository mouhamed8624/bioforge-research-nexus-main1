
-- Add reserved_by column to equipment_reservations table
ALTER TABLE public.equipment_reservations 
ADD COLUMN reserved_by text;
