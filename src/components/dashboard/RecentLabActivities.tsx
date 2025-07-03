
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Beaker, User, CalendarClock, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RecentLabActivities() {
  const [showAll, setShowAll] = useState(false);
  
  // Query to fetch recent lab results
  const { data: recentLabResults, isLoading } = useQuery({
    queryKey: ["dashboardRecentLabResults"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_lab_results")
        .select(`
          *,
          patients(name, id)
        `)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Only show first 5 lab results initially unless showAll is true
  const displayedLabResults = recentLabResults 
    ? (showAll ? recentLabResults : recentLabResults.slice(0, 5))
    : [];
  
  // Check if there are more lab results to show
  const hasMoreToShow = recentLabResults && recentLabResults.length > 5;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-md font-semibold flex items-center gap-2">
                          <Beaker className="h-4 w-4 text-cigass-500" />
          Recent Lab Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedLabResults && displayedLabResults.length > 0 ? (
          <>
            <Timeline>
              {displayedLabResults.map((lab) => (
                <TimelineItem key={lab.id}>
                  <div className="flex items-start gap-3">
                    <div 
                      className={`mt-0.5 p-1.5 rounded-full ${
                        lab.status === "approved" 
                          ? "bg-green-100 text-green-700" 
                          : lab.status === "pending" 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {lab.status === "approved" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Beaker className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {lab.test_name} for {lab.patients?.name || "Unknown Patient"}
                        </p>
                        <Badge variant="outline" className={
                          lab.status === "approved" 
                            ? "bg-green-100 text-green-700 border-green-200"
                            : lab.status === "pending"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        }>
                          {lab.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {lab.value ? `Result: ${lab.value} ${lab.units || ''}` : 'No result recorded'}
                      </p>
                      {lab.status === "approved" && lab.approved_by && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          <span>
                            Approved by {lab.approved_by}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        <span>
                          {lab.created_at 
                            ? `Submitted ${format(new Date(lab.created_at), 'MMM d, yyyy')}`
                            : 'Submission date unknown'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </TimelineItem>
              ))}
            </Timeline>
            
            {/* View More Button - only show if there are more than 5 lab results */}
            {hasMoreToShow && (
              <div className="pt-2 text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Show Less" : "View More"} 
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")} />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Beaker className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No recent lab activities</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
