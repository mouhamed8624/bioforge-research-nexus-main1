
-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    created_by text NOT NULL,
    event_date date NOT NULL,
    start_time text,
    end_time text,
    location text,
    affiliation text,
    event_type text,
    target_audience text,
    speakers text,
    assigned_member text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_events
CREATE POLICY "Enable read access for all users" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.calendar_events FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.calendar_events FOR DELETE USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
