import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addCalendarEvent } from "@/services/calendar/calendarService";
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

interface AddEventDialogProps {
  date?: Date;
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
  assigned_member: string;
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

// Team member options (you can expand this list as needed)
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

export function AddEventDialog({ date, open, onOpenChange }: AddEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const queryClient = useQueryClient();
  
  // Update selected date when the prop changes
  useEffect(() => {
    if (date) {
      setSelectedDate(date);
    }
  }, [date]);

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
      title: "",
      description: "",
      created_by: "",
      start_time: "",
      end_time: "",
      location: "",
      affiliation: "",
      event_type: "",
      target_audience: "",
      speakers: "",
      assigned_member: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await addCalendarEvent({
        ...values,
        event_date: format(selectedDate, "yyyy-MM-dd"),
        assigned_member: selectedMembers.join(", "),
      });
      
      // Invalidate the query for the selected date
      queryClient.invalidateQueries({ 
        queryKey: ["calendarEvents", format(selectedDate, "yyyy-MM-dd")] 
      });
      
      toast({
        title: "Event added",
        description: "Your event has been added to the calendar",
      });
      
      form.reset();
      setSelectedMembers([]);
      setSelectAll(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-muted-foreground text-xs">(e.g., "Seminar on CRISPR Gene Editing")</span></Label>
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
              {form.formState.errors.start_time && (
                <p className="text-sm text-red-500">Start time is required</p>
              )}
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
              {form.formState.errors.end_time && (
                <p className="text-sm text-red-500">End time is required</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location / Platform <span className="text-muted-foreground text-xs">(Room number, Zoom link, building name, etc.)</span></Label>
            <Input 
              id="location"
              placeholder="Enter location or platform"
              {...form.register("location")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(Brief summary of the event's purpose or content)</span></Label>
            <Textarea 
              id="description"
              placeholder="Add event details"
              className="min-h-[100px]"
              {...form.register("description")}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="created_by">Organizer / Your Name <span className="text-muted-foreground text-xs">(e.g., Mohamed Diallo)</span></Label>
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
              <Label htmlFor="affiliation">Affiliation <span className="text-muted-foreground text-xs">(e.g., UMass Boston – Department of Biology)</span></Label>
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
              <Label htmlFor="assigned_member">Team Member Assigned <span className="text-muted-foreground text-xs">(Responsible team member)</span></Label>
              <Select
                onValueChange={(value) => form.setValue("assigned_member", value)}
                defaultValue={form.getValues("assigned_member")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target_audience">Target Audience <span className="text-muted-foreground text-xs">(e.g., Biology students, Public)</span></Label>
            <Input 
              id="target_audience"
              placeholder="Enter target audience"
              {...form.register("target_audience")}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Team Members Assigned <span className="text-muted-foreground text-xs">(Select responsible team members)</span></Label>
            <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAllToggle}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Select All
                </Label>
              </div>
              <div className="border-t pt-2 space-y-2">
                {teamMembers.map((member) => (
                  <div key={member} className="flex items-center space-x-2">
                    <Checkbox
                      id={member}
                      checked={selectedMembers.includes(member)}
                      onCheckedChange={() => handleMemberToggle(member)}
                    />
                    <Label htmlFor={member} className="text-sm">
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
            <Label htmlFor="speakers">Speakers / Guests <span className="text-muted-foreground text-xs">(Name, title, affiliation)</span></Label>
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
              {isSubmitting ? "Adding..." : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
