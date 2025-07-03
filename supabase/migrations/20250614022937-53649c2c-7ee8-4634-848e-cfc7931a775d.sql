
-- Add assigned_member column to calendar_events table
ALTER TABLE public.calendar_events 
ADD COLUMN assigned_member TEXT;
