import { supabase } from '@/integrations/supabase/client';

// Define types directly since the generated types are not available
export interface ProgressBreakdown {
  id: string;
  project_id: string;
  todo_id: string | null;
  user_email: string;
  progress_added: number;
  previous_progress: number;
  new_progress: number;
  reason: string;
  details: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProgressBreakdownData {
  project_id: string;
  todo_id: string | null;
  user_email: string;
  progress_added: number;
  previous_progress: number;
  new_progress: number;
  reason: string;
  details: string | null;
}

export interface ProgressBreakdownWithTodo extends ProgressBreakdown {
  todo?: {
    task: string;
    percentage: number;
  } | null;
}

/**
 * Create a new progress breakdown record
 */
export const createProgressBreakdown = async (data: CreateProgressBreakdownData): Promise<ProgressBreakdown> => {
  console.log('Creating progress breakdown with data:', data);
  
  const { data: progressBreakdown, error } = await supabase
    .from('progress_breakdown')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating progress breakdown:', error);
    throw error;
  }

  console.log('Progress breakdown created successfully:', progressBreakdown);
  return progressBreakdown;
};

/**
 * Fetch progress breakdown for a specific project
 */
export const getProjectProgressBreakdown = async (projectId: string): Promise<ProgressBreakdownWithTodo[]> => {
  console.log('Fetching progress breakdown for project:', projectId);
  
  const { data, error } = await supabase
    .from('progress_breakdown')
    .select(`
      *,
      todo:todos(task, percentage)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project progress breakdown:', error);
    throw error;
  }

  console.log('Progress breakdown data fetched:', data);
  return data || [];
};

/**
 * Fetch all progress breakdown records
 */
export const getAllProgressBreakdown = async (): Promise<ProgressBreakdownWithTodo[]> => {
  const { data, error } = await supabase
    .from('progress_breakdown')
    .select(`
      *,
      todo:todos(task, percentage)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all progress breakdown:', error);
    throw error;
  }

  return data || [];
};

/**
 * Get progress breakdown summary for a project
 */
export const getProjectProgressSummary = async (projectId: string) => {
  const breakdown = await getProjectProgressBreakdown(projectId);
  
  const summary = {
    totalProgress: 0,
    totalContributions: breakdown.length,
    contributors: new Set<string>(),
    reasons: breakdown.map(b => b.reason),
    latestUpdate: breakdown[0]?.created_at || null,
    breakdown: breakdown
  };

  breakdown.forEach(record => {
    summary.totalProgress += record.progress_added;
    summary.contributors.add(record.user_email);
  });

  return {
    ...summary,
    contributors: Array.from(summary.contributors),
    uniqueContributors: summary.contributors.size
  };
};

/**
 * Create a progress breakdown record when a todo is completed
 */
export const createTodoCompletionProgress = async (
  projectId: string,
  todoId: string,
  userEmail: string,
  progressAdded: number,
  previousProgress: number,
  newProgress: number,
  todoTask: string
): Promise<ProgressBreakdown> => {
  const reason = `Task completed: ${todoTask}`;
  const details = `Completed task "${todoTask}" which contributed ${progressAdded}% to project progress.`;

  return createProgressBreakdown({
    project_id: projectId,
    todo_id: todoId,
    user_email: userEmail,
    progress_added: progressAdded,
    previous_progress: previousProgress,
    new_progress: newProgress,
    reason,
    details
  });
};

/**
 * Create a manual progress update record
 */
export const createManualProgressUpdate = async (
  projectId: string,
  userEmail: string,
  progressAdded: number,
  previousProgress: number,
  newProgress: number,
  reason: string,
  details?: string
): Promise<ProgressBreakdown> => {
  return createProgressBreakdown({
    project_id: projectId,
    todo_id: null,
    user_email: userEmail,
    progress_added: progressAdded,
    previous_progress: previousProgress,
    new_progress: newProgress,
    reason,
    details: details || `Manual progress update: ${reason}`
  });
}; 