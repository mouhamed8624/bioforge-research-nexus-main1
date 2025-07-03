
import { supabase } from "@/integrations/supabase/client";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  event_date: string;
  created_at: string | null;
  start_time?: string;
  end_time?: string;
  location?: string;
  affiliation?: string;
  event_type?: string;
  target_audience?: string;
  speakers?: string;
  assigned_member?: string;
};

export const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
  console.log("Fetching all calendar events from Supabase");
  
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) {
    console.error("Error fetching calendar events:", error);
    throw new Error("Failed to fetch calendar events");
  }

  console.log("Successfully fetched calendar events:", data?.length || 0);
  return data || [];
};

export const fetchEventsByDate = async (date: Date): Promise<CalendarEvent[]> => {
  const dateString = date.toISOString().split('T')[0];
  console.log("Fetching calendar events for date:", dateString);
  
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('event_date', dateString)
    .order('start_time', { ascending: true });

  if (error) {
    console.error("Error fetching events by date:", error);
    throw new Error("Failed to fetch events for date");
  }

  console.log("Successfully fetched events for date:", data?.length || 0);
  return data || [];
};

export const addCalendarEvent = async (event: Omit<CalendarEvent, "id" | "created_at">): Promise<CalendarEvent> => {
  console.log("Adding calendar event:", event.title);
  
  const { data, error } = await supabase
    .from('calendar_events')
    .insert([event])
    .select()
    .single();

  if (error) {
    console.error("Error adding calendar event:", error);
    throw new Error("Failed to add calendar event");
  }

  console.log("Successfully added calendar event:", data.id);
  return data;
};

export const updateCalendarEvent = async (id: string, event: Partial<Omit<CalendarEvent, "id" | "created_at">>): Promise<void> => {
  console.log("Updating calendar event:", id);
  
  const { error } = await supabase
    .from('calendar_events')
    .update(event)
    .eq('id', id);

  if (error) {
    console.error("Error updating calendar event:", error);
    throw new Error("Failed to update calendar event");
  }

  console.log("Successfully updated calendar event:", id);
};

export const deleteCalendarEvent = async (id: string): Promise<void> => {
  console.log("Deleting calendar event:", id);
  
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting calendar event:", error);
    throw new Error("Failed to delete calendar event");
  }

  console.log("Successfully deleted calendar event:", id);
};

/**
 * Generates an iCalendar (RFC 5545) format string for events
 */
export const generateICalendarFeed = async (): Promise<string> => {
  console.log("Generating iCalendar feed");
  
  const events = await fetchCalendarEvents();
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CIGASS//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CIGASS Calendar',
    'X-WR-TIMEZONE:UTC'
  ];

  events.forEach(event => {
    const eventDate = new Date(event.event_date);
    const startDateTime = event.start_time 
      ? formatDateTimeForICal(event.event_date, event.start_time)
      : formatDateForICal(event.event_date);
    const endDateTime = event.end_time 
      ? formatDateTimeForICal(event.event_date, event.end_time)
      : formatDateForICal(event.event_date);
    const createdDateTime = formatCurrentDateTimeForICal();

    icalContent.push('BEGIN:VEVENT');
    icalContent.push(`UID:${event.id}@cigass.com`);
    icalContent.push(`DTSTART:${startDateTime}`);
    icalContent.push(`DTEND:${endDateTime}`);
    icalContent.push(`DTSTAMP:${createdDateTime}`);
    icalContent.push(`CREATED:${createdDateTime}`);
    icalContent.push(`SUMMARY:${escapeICalText(event.title)}`);
    
    if (event.description) {
      icalContent.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    
    if (event.location) {
      icalContent.push(`LOCATION:${escapeICalText(event.location)}`);
    }
    
    icalContent.push(`ORGANIZER:CN=${escapeICalText(event.created_by)}`);
    
    if (event.event_type) {
      icalContent.push(`CATEGORIES:${escapeICalText(event.event_type)}`);
    }
    
    icalContent.push('END:VEVENT');
  });

  icalContent.push('END:VCALENDAR');
  
  return icalContent.join('\r\n');
};

/**
 * Format date and time for iCalendar
 */
const formatDateTimeForICal = (date: string, time: string): string => {
  const cleanDate = date.replace(/\D/g, '');
  const cleanTime = time.replace(/\D/g, '');
  
  const formattedDate = cleanDate.padEnd(8, '0');
  const formattedTime = cleanTime.padEnd(6, '0');
  
  return `${formattedDate}T${formattedTime}Z`;
};

/**
 * Format date only for iCalendar (all-day events)
 */
const formatDateForICal = (date: string): string => {
  const cleanDate = date.replace(/\D/g, '');
  return cleanDate.padEnd(8, '0');
};

/**
 * Get current date time formatted for iCalendar
 */
const formatCurrentDateTimeForICal = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = now.getUTCDate().toString().padStart(2, '0');
  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const seconds = now.getUTCSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Escape special characters for iCalendar text
 */
const escapeICalText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate subscription URLs for different calendar services
 */
export const getCalendarSubscriptionUrls = (baseUrl: string): Record<string, string> => {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const webcalUrl = normalizedBaseUrl.replace(/^https?:\/\//i, 'webcal://');
  
  return {
    ics: normalizedBaseUrl,
    google: `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(normalizedBaseUrl)}`,
    outlook: `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(normalizedBaseUrl)}&name=${encodeURIComponent('CIGASS Calendar')}`,
    apple: webcalUrl,
    webcal: webcalUrl,
  };
};
