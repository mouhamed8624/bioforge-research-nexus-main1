import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  name: string;
  milestone_id: string;
  milestone_name?: string;
}

interface ActivitySelectorProps {
  projectId: string | null;
  onActivitySelect: (activity: Activity | null) => void;
  selectedActivity: Activity | null;
}

export function ActivitySelector({ projectId, onActivitySelect, selectedActivity }: ActivitySelectorProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) {
      setActivities([]);
      onActivitySelect(null);
      return;
    }

    const fetchActivities = async () => {
      setLoading(true);
      try {
        console.log('ActivitySelector: Fetching activities for project:', projectId);
        
        // Fetch activities for the selected project
        const { data: activities, error } = await supabase
          .from('activities' as any)
          .select(`
            id, 
            name, 
            milestone_id,
            milestones!inner(
              id,
              name,
              project_id
            )
          `)
          .eq('milestones.project_id', projectId)
          .order('name');

        if (error) {
          console.error("ActivitySelector: Error fetching activities:", error);
          
          // Check if the error is due to missing table
          if (error.message?.includes('relation "activities" does not exist') || 
              error.message?.includes('does not exist') ||
              error.code === '42P01') {
            console.warn('ActivitySelector: Activities table does not exist yet. Using empty array.');
            setActivities([]);
            return;
          }
          
          // For other errors, try a simpler query without joins
          console.log('ActivitySelector: Trying simpler query without joins...');
          const { data: simpleActivities, error: simpleError } = await supabase
            .from('activities' as any)
            .select('id, name, milestone_id')
            .order('name');
            
          if (simpleError) {
            console.error("ActivitySelector: Simple query also failed:", simpleError);
            setActivities([]);
            return;
          }
          
          console.log('ActivitySelector: Simple query succeeded:', simpleActivities);
          const simpleTransformedActivities = simpleActivities?.map((activity: any) => ({
            id: activity.id,
            name: activity.name,
            milestone_id: activity.milestone_id,
            milestone_name: 'Milestone' // Fallback name
          })) || [];
          
          setActivities(simpleTransformedActivities);
          return;
        }

        console.log('ActivitySelector: Fetched activities:', activities);
        
        // Transform the data to match our interface
        const transformedActivities = activities?.map((activity: any) => ({
          id: activity.id,
          name: activity.name,
          milestone_id: activity.milestone_id,
          milestone_name: activity.milestones?.name || 'Unknown Milestone'
        })) || [];

        console.log('ActivitySelector: Transformed activities:', transformedActivities);
        setActivities(transformedActivities);
      } catch (error) {
        console.error("ActivitySelector: Error fetching activities:", error);
        toast({
          title: "Error",
          description: "Failed to fetch activities.",
          variant: "destructive",
        });
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [projectId, toast]);

  if (!projectId) {
    return (
      <div className="text-sm text-muted-foreground">
        Please select a project first to see available activities.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Activity (Optional)</label>
      <Select
        value={selectedActivity?.id || "none"}
        onValueChange={(value) => {
          if (value === "none") {
            onActivitySelect(null);
          } else {
            const activity = activities.find(a => a.id === value);
            if (activity) {
              onActivitySelect(activity);
            }
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading activities..." : "Select an activity (optional)"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No specific activity</SelectItem>
          {activities.map((activity) => (
            <SelectItem key={activity.id} value={activity.id}>
              <div className="flex flex-col">
                <span>{activity.name}</span>
                <span className="text-xs text-muted-foreground">
                  {activity.milestone_name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedActivity && (
        <div className="text-xs text-muted-foreground">
          Task will be associated with: <strong>{selectedActivity.name}</strong> 
          {selectedActivity.milestone_name && ` (${selectedActivity.milestone_name})`}
        </div>
      )}
    </div>
  );
} 