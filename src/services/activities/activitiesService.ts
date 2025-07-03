
import { supabase } from "@/integrations/supabase/client";

export type Activity = {
  id: string;
  action: string;
  project: string | null;
  user_name: string | null;
  time: string;
  type: 'update' | 'create' | 'alert' | 'finance' | 'lab' | 'paper';
  entity_id: string | null;
  entity_type: string;
  details: any;
  created_at: string;
};

// Get recent activities - using existing tables to simulate activities
export const getRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
  try {
    // Since we don't have a recent_activities table, we'll return mock data for now
    // or combine data from various tables to simulate activities
    const activities: Activity[] = [];
    
    // Get recent patient lab results as activities
    const { data: labResults } = await supabase
      .from('patient_lab_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (labResults) {
      labResults.forEach(result => {
        activities.push({
          id: result.id,
          action: `Lab test ${result.test_name} submitted`,
          project: null,
          user_name: result.approved_by || 'Lab Technician',
          time: result.created_at,
          type: 'lab',
          entity_id: result.id,
          entity_type: 'lab_result',
          details: { test_name: result.test_name, value: result.value, units: result.units },
          created_at: result.created_at
        });
      });
    }

    return activities.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

// Get activities by type
export const getActivitiesByType = async (
  type: Activity['type'], 
  limit: number = 10
): Promise<Activity[]> => {
  try {
    const allActivities = await getRecentActivities(50); // Get more to filter
    return allActivities.filter(activity => activity.type === type).slice(0, limit);
  } catch (error) {
    console.error(`Error fetching ${type} activities:`, error);
    return [];
  }
};

// Get activities by entity type
export const getActivitiesByEntityType = async (
  entityType: string,
  limit: number = 10
): Promise<Activity[]> => {
  try {
    const allActivities = await getRecentActivities(50); // Get more to filter
    return allActivities.filter(activity => activity.entity_type === entityType).slice(0, limit);
  } catch (error) {
    console.error(`Error fetching ${entityType} activities:`, error);
    return [];
  }
};

// Format relative time (e.g., "2 hours ago")
export const formatTimeAgo = (timestamp: string | null): string => {
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
