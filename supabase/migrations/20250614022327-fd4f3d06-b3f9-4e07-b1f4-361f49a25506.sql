
-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  affiliation TEXT,
  event_type TEXT,
  target_audience TEXT,
  speakers TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar events
CREATE POLICY "Anyone can view calendar events" 
  ON public.calendar_events 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create calendar events" 
  ON public.calendar_events 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update calendar events" 
  ON public.calendar_events 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete calendar events" 
  ON public.calendar_events 
  FOR DELETE 
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.calendar_events 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
