import { useState, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { addDays, format, isSameMonth, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { CalendarEventsForDate } from "@/components/calendar/CalendarEventsForDate";
import { AddEventDialog } from "@/components/calendar/AddEventDialog";
import { CalendarIcon, PlusIcon, Link, ExternalLink, Calendar as CalendarIconOutline, ChevronLeft, ChevronRight, TrendingUp, Users, Clock } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCalendarEvents, getCalendarSubscriptionUrls } from "@/services/calendar/calendarService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const navigate = useNavigate();
  
  const formattedDate = format(date, "EEEE, MMMM d, yyyy");

  // Fetch all calendar events
  const { data: allEvents = [] } = useQuery({
    queryKey: ['calendarEvents', 'all'],
    queryFn: fetchCalendarEvents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate event statistics based on actual data
  const eventStats = useMemo(() => {
    // Get current month events
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startOfCurrentMonth = startOfMonth(new Date(currentYear, currentMonth));
    const endOfCurrentMonth = endOfMonth(new Date(currentYear, currentMonth));
    
    const thisMonthEvents = allEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= startOfCurrentMonth && eventDate <= endOfCurrentMonth;
    });
    
    // Count events per creator
    const creatorCounts: Record<string, number> = {};
    allEvents.forEach(event => {
      const creator = event.created_by;
      creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
    });
    
    // Find most active team member
    let mostActiveCreator = "";
    let highestCount = 0;
    Object.entries(creatorCounts).forEach(([creator, count]) => {
      if (count > highestCount) {
        highestCount = count;
        mostActiveCreator = creator;
      }
    });
    
    // Find all future events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureEvents = allEvents
      .filter(event => new Date(event.event_date) >= today)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    
    // Get the next 3 upcoming events (or fewer if there aren't 3)
    const upcomingEvents = futureEvents.slice(0, 3).map(event => ({
      title: event.title,
      date: format(new Date(event.event_date), "MMMM d")
    }));
    
    return {
      monthlyCount: thisMonthEvents.length,
      mostActive: {
        name: mostActiveCreator || "No events",
        count: highestCount
      },
      upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : [{ 
        title: "No upcoming events", 
        date: "" 
      }],
      totalUpcoming: futureEvents.length
    };
  }, [allEvents]);
  
  // Generate calendar subscription URLs
  const subscriptionUrls = useMemo(() => {
    // Create full absolute URL to iCal endpoint
    const protocol = window.location.protocol;
    const host = window.location.host;
    const baseUrl = `${protocol}//${host}/api/calendar/ical`;
    
    return getCalendarSubscriptionUrls(baseUrl);
  }, []);
  
  // Handle calendar subscription
  const handleSubscribe = useCallback((type: 'google' | 'outlook' | 'apple' | 'ics' | 'webcal') => {
    const url = subscriptionUrls[type];
    
    if (!url) {
      toast({
        title: "Subscription Error",
        description: `Invalid calendar type selected.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Show toast notification before opening to ensure user gets feedback
      toast({
        title: "Opening Calendar App",
        description: `Launching ${type.charAt(0).toUpperCase() + type.slice(1)} Calendar. Check your browser settings if nothing happens.`,
      });
      
      // Open the subscription URL in a new tab/window
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error opening calendar subscription:", error);
      toast({
        title: "Subscription Error",
        description: "Could not open calendar application. Please try copying the URL manually.",
        variant: "destructive"
      });
    }
  }, [subscriptionUrls]);

  // Helper function to copy subscription URL to clipboard
  const copySubscriptionUrl = useCallback((type: 'ics' | 'webcal') => {
    const url = subscriptionUrls[type];
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "URL Copied",
          description: "Calendar subscription URL copied to clipboard.",
        });
      })
      .catch(err => {
        console.error("Failed to copy URL:", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy URL to clipboard.",
          variant: "destructive"
        });
      });
  }, [subscriptionUrls]);
  
  // Quick navigation helpers
  const navigateToMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' 
      ? subMonths(currentMonth, 1) 
      : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    setDate(newMonth);
  };

  const quickDateActions = [
    { label: "Today", action: () => setDate(new Date()), icon: CalendarIcon },
    { label: "Tomorrow", action: () => setDate(addDays(new Date(), 1)), icon: CalendarIcon },
    { label: "Next Week", action: () => setDate(addDays(new Date(), 7)), icon: CalendarIcon },
  ];
  
  return (
    <MainLayout>
      <PageContainer
        title="Team Calendar"
        subtitle="View and manage team activities and events"
      >
        <div className="space-y-6">
          {/* Enhanced Header with Quick Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-gradient-to-r from-purple-50 via-blue-50 to-teal-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-teal-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <div>
              <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <p className="text-muted-foreground mt-1">
                {eventStats.totalUpcoming} upcoming events • {eventStats.monthlyCount} this month
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToMonth('prev')}
                className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToMonth('next')}
                className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button 
                onClick={() => setIsAddEventOpen(true)} 
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              >
                <PlusIcon className="mr-1 h-4 w-4" />
                Add Event
              </Button>
            </div>
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Calendar widget - Enhanced */}
            <Card className="lg:col-span-4 shadow-lg bg-gradient-to-br from-white to-purple-50/30 dark:from-card dark:to-purple-900/5 border-purple-100 dark:border-purple-900/20">
              <CardHeader className="bg-gradient-to-r from-purple-100/50 to-blue-100/30 dark:from-purple-900/20 dark:to-blue-900/10 border-b border-purple-100/50 dark:border-purple-900/10 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-purple-600" />
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Calendar</span>
                  </CardTitle>
                  <CardDescription className="mt-1">Select a date to view events</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200"
                    >
                      <Link className="mr-1 h-4 w-4 text-purple-500" />
                      Subscribe
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm">
                    <DropdownMenuItem onClick={() => handleSubscribe('google')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Google Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSubscribe('outlook')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Outlook Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSubscribe('apple')}>
                      <CalendarIconOutline className="mr-2 h-4 w-4" />
                      Apple Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copySubscriptionUrl('ics')}>
                      <Link className="mr-2 h-4 w-4" />
                      Copy ICS Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="max-w-full overflow-auto">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    className="max-w-full rounded-lg border border-purple-100 dark:border-purple-900/20"
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Quick Navigation</div>
                  <div className="flex flex-wrap gap-2">
                    {quickDateActions.map((action, index) => (
                      <Button
                        key={index}
                        onClick={action.action}
                        variant="outline"
                        size="sm"
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                      >
                        <action.icon className="mr-1 h-3 w-3 text-purple-500" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Activity Summary */}
            <Card className="lg:col-span-8 shadow-lg bg-gradient-to-br from-white to-teal-50/30 dark:from-card dark:to-teal-900/5 border-teal-100 dark:border-teal-900/20">
              <CardHeader className="bg-gradient-to-r from-teal-100/50 to-blue-100/30 dark:from-teal-900/20 dark:to-blue-900/10 border-b border-teal-100/50 dark:border-teal-900/10">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-teal-600" />
                  Team Activity Overview
                </CardTitle>
                <CardDescription>Track and manage your team's research activities</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border border-purple-200/50 dark:border-purple-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-purple-700 dark:text-purple-400">This Month</h3>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          {eventStats.monthlyCount}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        Team events scheduled
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/10 border border-teal-200/50 dark:border-teal-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-teal-700 dark:text-teal-400">Most Active</h3>
                        <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                          {eventStats.mostActive.count}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Users className="mr-1 h-3 w-3" />
                        {eventStats.mostActive.name}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/50 dark:border-blue-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-700 dark:text-blue-400">Upcoming</h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {eventStats.totalUpcoming}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        Future events scheduled
                      </p>
                    </div>
                  </div>
                  
                  {/* Upcoming Events List - Enhanced */}
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-blue-600" />
                      Next Upcoming Events
                    </h3>
                    <div className="space-y-3">
                      {eventStats.upcomingEvents.map((event, index) => (
                        <div 
                          key={index} 
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800/50 dark:hover:to-blue-900/20 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                            {event.date && (
                              <Badge variant="outline" className="text-xs">
                                {event.date}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events for Selected Date - Enhanced */}
            <Card className="lg:col-span-12 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-card dark:to-gray-900/20 border-gray-200 dark:border-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-900/10 border-b border-gray-200/50 dark:border-gray-800/50 flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-blue-600" />
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formattedDate}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-1">Events and activities for this date</CardDescription>
                </div>
                <Button 
                  onClick={() => setIsAddEventOpen(true)} 
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Add Event
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <CalendarEventsForDate date={date} />
              </CardContent>
            </Card>
          </div>
        </div>

        <AddEventDialog 
          open={isAddEventOpen}
          onOpenChange={setIsAddEventOpen}
          date={date}
        />
      </PageContainer>
    </MainLayout>
  );
}
