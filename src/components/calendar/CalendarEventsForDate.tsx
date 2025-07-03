
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEventsByDate, CalendarEvent, deleteCalendarEvent } from "@/services/calendar/calendarService";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, MapPin, Users, CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { EditEventDialog } from "./EditEventDialog";
import { Badge } from "@/components/ui/badge";

interface CalendarEventsForDateProps {
  date: Date;
}

export function CalendarEventsForDate({ date }: CalendarEventsForDateProps) {
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const queryClient = useQueryClient();
  
  const formattedDate = format(date, "yyyy-MM-dd");
  const queryKey = ["calendarEvents", formattedDate];
  
  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchEventsByDate(date),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Refresh data when date changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["calendarEvents", formattedDate] });
  }, [formattedDate, queryClient]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCalendarEvent(id);
      queryClient.invalidateQueries({ queryKey: queryKey });
      toast({
        title: "Event deleted",
        description: "Calendar event has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4 p-4 border rounded-md">
            <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
        Failed to load events. Please try again later.
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed rounded-md text-muted-foreground">
        <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
        <p>No events scheduled for this day</p>
        <p className="text-sm mt-1">Select a different date or add a new event</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div 
          key={event.id} 
          className="flex items-start justify-between p-4 border rounded-md hover:bg-accent/5 transition-colors"
          onClick={() => setEditingEvent(event)}
        >
          <div className="flex gap-4 flex-1 cursor-pointer">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-md flex items-center justify-center font-medium">
              {format(new Date(event.event_date), "dd")}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{event.title}</h3>
                {event.event_type && (
                  <Badge variant="outline" className="ml-2">{event.event_type}</Badge>
                )}
              </div>
              
              <div className="flex flex-wrap text-xs text-muted-foreground gap-x-4 gap-y-1">
                {(event.start_time || event.end_time) && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{event.start_time || ""}{event.end_time ? ` - ${event.end_time}` : ""}</span>
                  </div>
                )}
                
                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.target_audience && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{event.target_audience}</span>
                  </div>
                )}
              </div>
              
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
              )}
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                <div>Added by: {event.created_by}</div>
                {event.affiliation && <div>Affiliation: {event.affiliation}</div>}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(event.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ))}

      {editingEvent && (
        <EditEventDialog 
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
        />
      )}
    </div>
  );
}
