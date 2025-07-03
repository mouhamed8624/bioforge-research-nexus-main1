
-- Create equipment_reservations table
CREATE TABLE IF NOT EXISTS public.equipment_reservations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment text NOT NULL,
    project text NOT NULL,
    date date NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    user_id uuid REFERENCES auth.users NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.equipment_reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for equipment_reservations
CREATE POLICY "Users can view all reservations" ON public.equipment_reservations FOR SELECT USING (true);
CREATE POLICY "Users can create reservations" ON public.equipment_reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reservations" ON public.equipment_reservations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reservations" ON public.equipment_reservations FOR DELETE USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_equipment_reservations_updated_at 
    BEFORE UPDATE ON public.equipment_reservations 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
