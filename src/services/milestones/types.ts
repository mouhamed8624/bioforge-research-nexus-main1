// Manual type definitions for milestones and activities
// These will be replaced with auto-generated types once the migration is applied

// Base types
export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  milestone_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  assigned_to: string[];
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  assigned_to: string[];
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  percentage: number;
  project_id?: string;
  activity_id?: string; // New field to link to activities
  deadline?: string;
  updated_at: string;
  hours?: number;
}

// Extended types with relationships
export interface MilestoneWithActivities extends Milestone {
  activities?: ActivityWithTasks[];
}

export interface ActivityWithTasks extends Activity {
  tasks?: TodoItem[];
}

// Create/Update data types
export interface CreateMilestoneData {
  project_id: string;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface UpdateMilestoneData extends Partial<CreateMilestoneData> {
  id: string;
}

export interface CreateActivityData {
  milestone_id: string;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress?: number;
  assigned_to?: string[];
  estimated_hours?: number | null;
  actual_hours?: number | null;
}

export interface UpdateActivityData extends Partial<CreateActivityData> {
  id: string;
}

// Status and priority types
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Statistics types
export interface MilestoneStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  delayed: number;
}

export interface ActivityStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  delayed: number;
  totalEstimatedHours: number;
  totalActualHours: number;
} 