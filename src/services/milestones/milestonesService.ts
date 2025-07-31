import { supabase } from "@/integrations/supabase/client";
import {
  Milestone,
  Activity,
  MilestoneWithActivities,
  ActivityWithTasks,
  CreateMilestoneData,
  UpdateMilestoneData,
  CreateActivityData,
  UpdateActivityData,
  MilestoneStats,
  ActivityStats
} from "./types";

// Milestone Services
export const milestonesService = {
  // Fetch all milestones for a project
  async getMilestonesByProject(projectId: string): Promise<MilestoneWithActivities[]> {
    try {
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        
        // Check if the error is due to missing table
        if (milestonesError.message?.includes('relation "milestones" does not exist') || 
            milestonesError.message?.includes('does not exist') ||
            milestonesError.code === '42P01') {
          console.warn('Milestones table does not exist yet. Returning empty array.');
          return [];
        }
        
        throw milestonesError;
      }

      // Fetch activities for each milestone
      const milestonesWithActivities = await Promise.all(
        milestones.map(async (milestone: any) => {
          try {
            const { data: activities, error: activitiesError } = await supabase
              .from('activities' as any)
              .select('*')
              .eq('milestone_id', milestone.id)
              .order('created_at', { ascending: true });

            if (activitiesError) {
              console.warn('Error fetching activities for milestone:', activitiesError);
              return {
                ...milestone,
                activities: []
              } as MilestoneWithActivities;
            }

            // Fetch tasks for each activity
            const activitiesWithTasks = await Promise.all(
              activities.map(async (activity: any) => {
                try {
                  const { data: tasks, error: tasksError } = await supabase
                    .from('todos')
                    .select('*')
                    .eq('activity_id', activity.id)
                    .order('created_at', { ascending: true });

                  if (tasksError) {
                    console.warn('Error fetching tasks for activity:', tasksError);
                    return {
                      ...activity,
                      tasks: []
                    } as ActivityWithTasks;
                  }

                  return {
                    ...activity,
                    tasks: tasks || []
                  } as ActivityWithTasks;
                } catch (error) {
                  console.warn('Error processing activity tasks:', error);
                  return {
                    ...activity,
                    tasks: []
                  } as ActivityWithTasks;
                }
              })
            );

            return {
              ...milestone,
              activities: activitiesWithTasks
            } as MilestoneWithActivities;
          } catch (error) {
            console.warn('Error processing milestone activities:', error);
            return {
              ...milestone,
              activities: []
            } as MilestoneWithActivities;
          }
        })
      );

      return milestonesWithActivities;
    } catch (error) {
      console.error('Error fetching milestones:', error);
      throw error;
    }
  },

  // Create a new milestone
  async createMilestone(milestoneData: CreateMilestoneData): Promise<Milestone> {
    try {
      console.log('Creating milestone with data:', milestoneData);
      
      const { data, error } = await supabase
        .from('milestones' as any)
        .insert([milestoneData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating milestone:', error);
        
        // Check if the error is due to missing table
        if (error.message?.includes('relation "milestones" does not exist') || 
            error.message?.includes('does not exist') ||
            error.code === '42P01') {
          console.warn('Milestones table does not exist yet. Using fallback mode.');
          
          // Create a mock milestone for now
          const mockMilestone: Milestone = {
            id: Date.now().toString(),
            project_id: milestoneData.project_id,
            name: milestoneData.name,
            description: milestoneData.description || '',
            start_date: milestoneData.start_date || null,
            end_date: milestoneData.end_date || null,
            status: 'pending',
            progress: 0,
            priority: milestoneData.priority || 'medium',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Created mock milestone:', mockMilestone);
          return mockMilestone;
        }
        
        throw error;
      }
      
      console.log('Milestone created successfully:', data);
      return data as Milestone;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  },

  // Update a milestone
  async updateMilestone(milestoneData: UpdateMilestoneData): Promise<Milestone> {
    try {
      const { data, error } = await supabase
        .from('milestones' as any)
        .update(milestoneData)
        .eq('id', milestoneData.id)
        .select()
        .single();

      if (error) throw error;
      return data as Milestone;
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  },

  // Delete a milestone
  async deleteMilestone(milestoneId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('milestones' as any)
        .delete()
        .eq('id', milestoneId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  },

  // Get milestone statistics
  async getMilestoneStats(projectId: string): Promise<MilestoneStats> {
    try {
      const { data: milestones, error } = await supabase
        .from('milestones' as any)
        .select('status')
        .eq('project_id', projectId);

      if (error) throw error;

      const stats: MilestoneStats = {
        total: milestones.length,
        completed: milestones.filter((m: any) => m.status === 'completed').length,
        inProgress: milestones.filter((m: any) => m.status === 'in_progress').length,
        pending: milestones.filter((m: any) => m.status === 'pending').length,
        delayed: milestones.filter((m: any) => m.status === 'delayed').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching milestone stats:', error);
      throw error;
    }
  }
};

// Activity Services
export const activitiesService = {
  // Fetch all activities for a milestone
  async getActivitiesByMilestone(milestoneId: string): Promise<ActivityWithTasks[]> {
    try {
      const { data: activities, error: activitiesError } = await supabase
        .from('activities' as any)
        .select('*')
        .eq('milestone_id', milestoneId)
        .order('created_at', { ascending: true });

      if (activitiesError) throw activitiesError;

      // Fetch tasks for each activity
      const activitiesWithTasks = await Promise.all(
        activities.map(async (activity: any) => {
          const { data: tasks, error: tasksError } = await supabase
            .from('todos')
            .select('*')
            .eq('activity_id', activity.id)
            .order('created_at', { ascending: true });

          if (tasksError) throw tasksError;

          return {
            ...activity,
            tasks: tasks || []
          } as ActivityWithTasks;
        })
      );

      return activitiesWithTasks;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  // Create a new activity
  async createActivity(activityData: CreateActivityData): Promise<Activity> {
    try {
      console.log('ActivitiesService: Creating activity with data:', activityData);
      
      // Validate milestone_id
      if (!activityData.milestone_id || activityData.milestone_id.trim() === '') {
        throw new Error('Invalid milestone_id: cannot be empty');
      }
      
      // Validate required fields
      if (!activityData.name || activityData.name.trim() === '') {
        throw new Error('Activity name is required');
      }
      
      const { data, error } = await supabase
        .from('activities' as any)
        .insert([activityData])
        .select()
        .single();

      if (error) {
        console.error('ActivitiesService: Supabase error creating activity:', error);
        console.error('ActivitiesService: Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Check if the error is due to missing table
        if (error.message?.includes('relation "activities" does not exist') || 
            error.message?.includes('does not exist') ||
            error.code === '42P01') {
          console.warn('ActivitiesService: Activities table does not exist yet. Using fallback mode.');
          
          // Create a mock activity for now
          const mockActivity: Activity = {
            id: Date.now().toString(),
            milestone_id: activityData.milestone_id,
            name: activityData.name,
            description: activityData.description || '',
            start_date: activityData.start_date || null,
            end_date: activityData.end_date || null,
            status: 'pending',
            progress: 0,
            assigned_to: activityData.assigned_to || [],
            estimated_hours: activityData.estimated_hours || null,
            actual_hours: activityData.actual_hours || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('ActivitiesService: Created mock activity:', mockActivity);
          return mockActivity;
        }
        
        throw error;
      }
      
      console.log('ActivitiesService: Activity created successfully:', data);
      return data as Activity;
    } catch (error) {
      console.error('ActivitiesService: Error creating activity:', error);
      throw error;
    }
  },

  // Update an activity
  async updateActivity(activityData: UpdateActivityData): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('activities' as any)
        .update(activityData)
        .eq('id', activityData.id)
        .select()
        .single();

      if (error) throw error;
      return data as Activity;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  // Delete an activity
  async deleteActivity(activityId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activities' as any)
        .delete()
        .eq('id', activityId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  // Get activity statistics
  async getActivityStats(milestoneId: string): Promise<ActivityStats> {
    try {
      const { data: activities, error } = await supabase
        .from('activities' as any)
        .select('status, estimated_hours, actual_hours')
        .eq('milestone_id', milestoneId);

      if (error) throw error;

      const stats: ActivityStats = {
        total: activities.length,
        completed: activities.filter((a: any) => a.status === 'completed').length,
        inProgress: activities.filter((a: any) => a.status === 'in_progress').length,
        pending: activities.filter((a: any) => a.status === 'pending').length,
        delayed: activities.filter((a: any) => a.status === 'delayed').length,
        totalEstimatedHours: activities.reduce((sum: number, a: any) => sum + (a.estimated_hours || 0), 0),
        totalActualHours: activities.reduce((sum: number, a: any) => sum + (a.actual_hours || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }
}; 