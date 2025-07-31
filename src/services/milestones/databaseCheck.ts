import { supabase } from "@/integrations/supabase/client";

export const checkDatabaseTables = async () => {
  console.log('Checking database tables...');
  
  try {
    // Check if milestones table exists
    const { data: milestonesCheck, error: milestonesError } = await supabase
      .from('milestones' as any)
      .select('count')
      .limit(1);
    
    console.log('Milestones table check:', { 
      exists: !milestonesError, 
      error: milestonesError?.message,
      code: milestonesError?.code 
    });

    // Check if activities table exists
    const { data: activitiesCheck, error: activitiesError } = await supabase
      .from('activities' as any)
      .select('count')
      .limit(1);
    
    console.log('Activities table check:', { 
      exists: !activitiesError, 
      error: activitiesError?.message,
      code: activitiesError?.code 
    });

    // Check if todos table has activity_id column
    const { data: todosCheck, error: todosError } = await supabase
      .from('todos')
      .select('activity_id')
      .limit(1);
    
    console.log('Todos activity_id column check:', { 
      exists: !todosError, 
      error: todosError?.message,
      code: todosError?.code 
    });

    return {
      milestones: { exists: !milestonesError, error: milestonesError },
      activities: { exists: !activitiesError, error: activitiesError },
      todosActivityId: { exists: !todosError, error: todosError }
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      error: error.message
    };
  }
};

export const testMilestoneCreation = async (testData: any) => {
  console.log('Testing milestone creation with data:', testData);
  
  try {
    const { data, error } = await supabase
      .from('milestones' as any)
      .insert([testData])
      .select()
      .single();

    if (error) {
      console.error('Test milestone creation failed:', error);
      return { success: false, error };
    }

    console.log('Test milestone creation successful:', data);
    
    // Clean up test data
    if (data && typeof data === 'object' && 'id' in data) {
      const milestoneData = data as any;
      await supabase
        .from('milestones' as any)
        .delete()
        .eq('id', milestoneData.id);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Test milestone creation error:', error);
    return { success: false, error };
  }
};

export const testActivityCreation = async (testData: any) => {
  console.log('Testing activity creation with data:', testData);
  
  try {
    const { data, error } = await supabase
      .from('activities' as any)
      .insert([testData])
      .select()
      .single();

    if (error) {
      console.error('Test activity creation failed:', error);
      return { success: false, error };
    }

    console.log('Test activity creation successful:', data);
    
    // Clean up test data
    if (data && typeof data === 'object' && 'id' in data) {
      const activityData = data as any;
      await supabase
        .from('activities' as any)
        .delete()
        .eq('id', activityData.id);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Test activity creation error:', error);
    return { success: false, error };
  }
}; 