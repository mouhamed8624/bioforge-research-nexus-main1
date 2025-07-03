
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { updateCalendarEvent, CalendarEvent } from "@/services/calendar/calendarService";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditEventDialogProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = {
  title: string;
  description: string;
  created_by: string;
  start_time: string;
  end_time: string;
  location: string;
  affiliation: string;
  event_type: string;
  target_audience: string;
  speakers: string;
};

// Event type options
const eventTypes = [
  "Seminar",
  "Lab Meeting",
  "Workshop",
  "Conference",
  "Outreach",
  "Thesis Defense",
  "Other"
];

// Team member options
const teamMembers = [
  "Dr. Sarah Johnson",
  "Dr. Michael Chen",
  "Dr. Emily Rodriguez",
  "Dr. David Kim",
  "Dr. Lisa Thompson",
  "Dr. James Wilson",
  "Dr. Maria Garcia",
  "Dr. Robert Lee"
];

// Generate time options in 30-minute increments
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 8; hour < 20; hour++) {
    const hourFormat = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = `${hourFormat}:00 ${period}`;
    const formattedHourHalf = `${hourFormat}:30 ${period}`;
    options.push(formattedHour);
    options.push(formattedHourHalf);
  }
  return options;
};

const timeOptions = generateTimeOptions();

export function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(event.event_date));
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const queryClient = useQueryClient();

  // Initialize selected members from event data
  useEffect(() => {
    if (event.assigned_member) {
      const members = event.assigned_member.split(", ").filter(member => member.trim() !== "");
      setSelectedMembers(members);
      setSelectAll(members.length === teamMembers.length);
    }
  }, [event.assigned_member]);

  // Handle select all functionality
  useEffect(() => {
    if (selectAll) {
      setSelectedMembers([...teamMembers]);
    } else if (selectedMembers.length === teamMembers.length) {
      setSelectAll(true);
    }
  }, [selectAll]);

  // Handle individual member selection
  const handleMemberToggle = (member: string) => {
    setSelectedMembers(prev => {
      const newSelection = prev.includes(member)
        ? prev.filter(m => m !== member)
        : [...prev, member];
      
      // Update select all state
      if (newSelection.length === teamMembers.length) {
        setSelectAll(true);
      } else {
        setSelectAll(false);
      }
      
      return newSelection;
    });
  };

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedMembers([]);
      setSelectAll(false);
    } else {
      setSelectedMembers([...teamMembers]);
      setSelectAll(true);
    }
  };
  
  const form = useForm<FormValues>({
    defaultValues: {
      title: event.title,
      description: event.description || "",
      created_by: event.created_by,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      location: event.location || "",
      affiliation: event.affiliation || "",
      event_type: event.event_type || "",
      target_audience: event.target_audience || "",
      speakers: event.speakers || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await updateCalendarEvent(event.id, {
        ...values,
        event_date: format(selectedDate, "yyyy-MM-dd"),
        assigned_member: selectedMembers.join(", "),
      });
      
      // Invalidate the query for the event date
      queryClient.invalidateQueries({ 
        queryKey: ["calendarEvents", event.event_date]
      });
      
      // Also invalidate the query for the new date if it's different
      if (format(selectedDate, "yyyy-MM-dd") !== event.event_date) {
        queryClient.invalidateQueries({ 
          queryKey: ["calendarEvents", format(selectedDate, "yyyy-MM-dd")]
        });
      }
      
      toast({
        title: "Event updated",
        description: "Your event has been updated",
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              placeholder="Event title"
              {...form.register("title", { required: true })}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">Title is required</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Select
                onValueChange={(value) => form.setValue("start_time", value)}
                defaultValue={form.getValues("start_time")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`start-${time}`} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Select
                onValueChange={(value) => form.setValue("end_time", value)}
                defaultValue={form.getValues("end_time")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`end-${time}`} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location / Platform</Label>
            <Input 
              id="location"
              placeholder="Enter location or platform"
              {...form.register("location")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              placeholder="Add event details"
              className="min-h-[100px]"
              {...form.register("description")}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="created_by">Organizer / Your Name</Label>
              <Input 
                id="created_by"
                placeholder="Enter your name"
                {...form.register("created_by", { required: true })}
              />
              {form.formState.errors.created_by && (
                <p className="text-sm text-red-500">Organizer name is required</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="affiliation">Affiliation</Label>
              <Input 
                id="affiliation"
                placeholder="Enter your affiliation"
                {...form.register("affiliation")}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                onValueChange={(value) => form.setValue("event_type", value)}
                defaultValue={form.getValues("event_type")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input 
                id="target_audience"
                placeholder="Enter target audience"
                {...form.register("target_audience")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Team Members Assigned <span className="text-muted-foreground text-xs">(Select responsible team members)</span></Label>
            <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-edit"
                  checked={selectAll}
                  onCheckedChange={handleSelectAllToggle}
                />
                <Label htmlFor="select-all-edit" className="font-medium">
                  Select All
                </Label>
              </div>
              <div className="border-t pt-2 space-y-2">
                {teamMembers.map((member) => (
                  <div key={member} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${member}`}
                      checked={selectedMembers.includes(member)}
                      onCheckedChange={() => handleMemberToggle(member)}
                    />
                    <Label htmlFor={`edit-${member}`} className="text-sm">
                      {member}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {selectedMembers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedMembers.join(", ")}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="speakers">Speakers / Guests</Label>
            <Textarea 
              id="speakers"
              placeholder="List speakers or guests"
              {...form.register("speakers")}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
