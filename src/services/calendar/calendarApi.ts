
import { generateICalendarFeed } from "./calendarService";

/**
 * API route to serve iCalendar feed
 */
export async function serveiCalendarFeed(req: Request): Promise<Response> {
  try {
    const icalContent = await generateICalendarFeed();
    
    // Set correct CORS headers to allow cross-origin requests
    const headers = {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=cigass-calendar.ics",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*", // Allow access from any origin
      "Access-Control-Allow-Methods": "GET, OPTIONS, HEAD", // Include HEAD method 
      "Access-Control-Allow-Headers": "Content-Type, Origin, Accept" // Allow additional headers
    };
    
    // Handle OPTIONS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers, status: 204 });
    }
    
    // Return iCalendar content with appropriate headers
    return new Response(icalContent, { headers });
  } catch (error) {
    console.error("Error generating iCalendar feed:", error);
    return new Response(JSON.stringify({ error: "Failed to generate calendar" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
}
