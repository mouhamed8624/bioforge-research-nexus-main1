
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Activity = {
  id: string;
  action: string;
  project: string;
  user: string;
  time: string;
  type: "update" | "create" | "alert" | "finance";
};

// Function to generate activities from various database tables
const useActivities = () => {
  // Fetch recent projects
  const { data: projectsData } = useQuery({
    queryKey: ['recentProjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) {
        console.error("Error fetching recent projects:", error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch recent equipment tracking
  const { data: equipmentData } = useQuery({
    queryKey: ['recentEquipmentTracking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_tracking')
        .select('*, equipment_items(name)')
        .order('check_out_time', { ascending: false })
        .limit(2);
      
      if (error) {
        console.error("Error fetching recent equipment tracking:", error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch recent inventory items with low stock
  const { data: inventoryData } = useQuery({
    queryKey: ['lowStockInventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .lt('quantite_restante', 15) // Getting low stock items as "alerts"
        .filter('quantite_restante', 'lt', 'seuil_alerte') // Using quantite_restante and seuil_alerte
        .limit(2);
      
      if (error) {
        console.error("Error fetching low inventory items:", error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 15000 // Refetch more frequently for inventory alerts
  });

  // Build activities array from the fetched data
  const activities: Activity[] = [];

  // Add project activities
  if (projectsData) {
    projectsData.forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        action: `Created project: ${project.name}`,
        project: project.name,
        user: project.team && project.team.length > 0 ? project.team[0] : 'System',
        time: formatTimeAgo(project.created_at),
        type: 'create'
      });
    });
  }

  // Add equipment tracking activities
  if (equipmentData) {
    equipmentData.forEach(item => {
      const equipmentName = item.equipment_items?.name || 'Unknown equipment';
      activities.push({
        id: `equipment-${item.id}`,
        action: `Equipment ${item.status}: ${equipmentName}`,
        project: 'Equipment Tracking',
        user: item.user_name,
        time: formatTimeAgo(item.check_out_time),
        type: 'update'
      });
    });
  }

  // Add inventory alerts - only for items where quantite_restante is actually low compared to seuil_alerte
  if (inventoryData) {
    inventoryData.forEach(item => {
      // Only add items where quantite_restante is actually less than seuil_alerte
      if (item.quantite_restante < (item.seuil_alerte || 1)) {
        const stockPercentage = Math.round((item.quantite_restante / (item.seuil_alerte || 1)) * 100);
        let stockStatus;
        
        if (stockPercentage <= 10) {
          stockStatus = "critical";
        } else if (stockPercentage <= 30) {
          stockStatus = "low";
        } else {
          stockStatus = "ok";
        }
        
        activities.push({
          id: `inventory-${item.id}`,
          action: `Low stock alert: ${item.produit} (${item.quantite_restante}/${item.seuil_alerte || 0})`,
          project: item.type || 'Inventory',
          user: 'System',
          time: 'Now',
          type: 'alert'
        });
      }
    });
  }

  // Sort activities by time - with "Now" items first
  activities.sort((a, b) => {
    if (a.time === 'Now') return -1;
    if (b.time === 'Now') return 1;
    if (a.time === b.time) return 0;
    
    // For other timestamps, compare the actual time values
    const timeA = a.time === 'Now' ? Date.now() : new Date(a.time).getTime();
    const timeB = b.time === 'Now' ? Date.now() : new Date(b.time).getTime();
    return timeB - timeA;
  });

  // If no activities found, return an empty array
  return activities.length > 0 ? activities.slice(0, 5) : [];
};

// Helper function to format timestamps to relative time
const formatTimeAgo = (timestamp: string | null) => {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const date = new Date(timestamp);
  const secondsDiff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (secondsDiff < 60) return 'Just now';
  if (secondsDiff < 3600) return `${Math.floor(secondsDiff / 60)} minutes ago`;
  if (secondsDiff < 86400) return `${Math.floor(secondsDiff / 3600)} hours ago`;
  if (secondsDiff < 172800) return 'Yesterday';
  
  return date.toLocaleDateString();
};

const getTypeColor = (type: Activity["type"]) => {
  switch (type) {
    case "update":
              return "bg-cigass-500 text-white";
    case "create":
      return "bg-cigass-500 text-white";
    case "alert":
      return "bg-destructive text-white";
    case "finance":
      return "bg-teal-600 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function RecentActivities() {
  const activities = useActivities();

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="text-md font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activities to display
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-1 h-2 w-2 rounded-full",
                                          activity.type === "update" && "bg-cigass-500",
                    activity.type === "create" && "bg-cigass-500",
                    activity.type === "alert" && "bg-destructive",
                    activity.type === "finance" && "bg-teal-600"
                  )}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <Badge variant="outline" className={getTypeColor(activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs text-muted-foreground gap-1 sm:gap-4">
                    <p>
                      <span className="font-semibold">Project:</span> {activity.project}
                    </p>
                    <p>
                      <span className="font-semibold">By:</span> {activity.user}
                    </p>
                    <p className="ml-auto text-right sm:text-left">
                      <span className="font-semibold">When:</span> {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
