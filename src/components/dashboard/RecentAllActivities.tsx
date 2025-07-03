
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Activity, formatTimeAgo, getRecentActivities } from "@/services/activities/activitiesService";
import { useState } from "react";
import { 
  Calendar, 
  BadgeCheck, 
  FileText, 
  Users, 
  Coins, 
  Beaker,
  BookOpen,
  ChevronDown
} from "lucide-react";

const getTypeIcon = (type: Activity['type'], entityType: string) => {
  switch (type) {
    case 'create':
      return entityType === 'patient' ? <Users className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
    case 'update':
      return <BadgeCheck className="h-4 w-4" />;
    case 'finance':
      return <Coins className="h-4 w-4" />;
    case 'lab':
      return <Beaker className="h-4 w-4" />;
    case 'paper':
      return <BookOpen className="h-4 w-4" />;
    case 'alert':
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

const getTypeColor = (type: Activity['type']) => {
  switch (type) {
    case 'create':
      return "bg-cigass-500 text-white";
    case 'update':
      return "bg-cigass-500 text-white";
    case 'alert':
      return "bg-destructive text-white";
    case 'finance':
      return "bg-teal-600 text-white";
    case 'lab':
      return "bg-blue-500 text-white";
    case 'paper':
      return "bg-indigo-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function RecentAllActivities() {
  const [showAll, setShowAll] = useState(false);
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['recentAllActivities'],
    queryFn: () => getRecentActivities(20), // Get more activities than we initially show
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Only show first 5 activities initially unless showAll is true
  const displayedActivities = showAll ? activities : activities.slice(0, 5);
  const hasMoreToShow = activities.length > 5;

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="text-md font-semibold">All Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activities to display
            </div>
          ) : (
            <>
              <Timeline>
                {displayedActivities.map((activity) => (
                  <TimelineItem key={activity.id}>
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "mt-1 p-1.5 rounded-full",
                          activity.type === "update" && "bg-cigass-100 text-cigass-700",
                          activity.type === "create" && "bg-cigass-100 text-cigass-700",
                          activity.type === "alert" && "bg-red-100 text-red-700",
                          activity.type === "finance" && "bg-teal-100 text-teal-700",
                          activity.type === "lab" && "bg-blue-100 text-blue-700",
                          activity.type === "paper" && "bg-indigo-100 text-indigo-700"
                        )}
                      >
                        {getTypeIcon(activity.type, activity.entity_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <Badge variant="outline" className={getTypeColor(activity.type)}>
                            {activity.type}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs text-muted-foreground gap-1 sm:gap-4">
                          {activity.project && (
                            <p>
                              <span className="font-semibold">Project:</span> {activity.project}
                            </p>
                          )}
                          {activity.user_name && (
                            <p>
                              <span className="font-semibold">By:</span> {activity.user_name}
                            </p>
                          )}
                          <p className="ml-auto text-right sm:text-left">
                            <span className="font-semibold">When:</span> {formatTimeAgo(activity.time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TimelineItem>
                ))}
              </Timeline>
              
              {/* View More Button */}
              {hasMoreToShow && (
                <div className="pt-2 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? "Show Less" : "View More"} 
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
