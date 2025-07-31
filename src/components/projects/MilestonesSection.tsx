import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Flag, 
  Plus, 
  Target, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MilestoneWithActivities, ActivityWithTasks, TodoItem } from "@/services/milestones/types";
import { milestonesService, activitiesService } from "@/services/milestones/milestonesService";
import { toggleTodoCompletion } from "@/services/todos/todoService";
import { checkDatabaseTables } from "@/services/milestones/databaseCheck";
import { CreateMilestoneDialog } from "./CreateMilestoneDialog";
import { CreateActivityDialog } from "./CreateActivityDialog";
import { useAuth } from "@/contexts/AuthContext";

interface MilestonesSectionProps {
  projectId: string;
  onRefresh?: () => void;
}

export function MilestonesSection({ projectId, onRefresh }: MilestonesSectionProps) {
  const [milestones, setMilestones] = useState<MilestoneWithActivities[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMilestone, setShowCreateMilestone] = useState(false);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const { userProfile } = useAuth();

  // Check if user can mark tasks as completed
  const canMarkTasksCompleted = userProfile?.role === 'unit_team_leader' || 
                               userProfile?.role === 'president' || 
                               userProfile?.role === 'admin';

  // Fetch milestones from database
  const fetchMilestones = async () => {
    setLoading(true);
    try {
      // First check if database tables exist
      console.log('Checking database tables before fetching milestones...');
      const dbCheck = await checkDatabaseTables();
      console.log('Database check result:', dbCheck);
      
      const milestonesData = await milestonesService.getMilestonesByProject(projectId);
      
      console.log('Raw milestones data from database:', milestonesData);
      
      // Recalculate progress for all milestones based on actual task completion
      // This ensures progress is always based on current task completion status, not stored database values
      const milestonesWithCalculatedProgress = milestonesData.map(milestone => {
        console.log(`Recalculating progress for milestone: ${milestone.name}`);
        
        // Recalculate progress for each activity
        const activitiesWithCalculatedProgress = milestone.activities?.map(activity => {
          console.log(`Recalculating progress for activity: ${activity.name}`);
          const updatedActivity = updateActivityStatus(activity);
          console.log(`Activity ${activity.name} progress: ${updatedActivity.progress}%`);
          return updatedActivity;
        }) || [];
        
        // Recalculate progress for the milestone
        const milestoneWithCalculatedActivities = {
          ...milestone,
          activities: activitiesWithCalculatedProgress
        };
        
        const updatedMilestone = calculateMilestoneStatus(milestoneWithCalculatedActivities);
        console.log(`Milestone ${milestone.name} progress: ${updatedMilestone.progress}%`);
        return updatedMilestone;
      });
      
      console.log('Milestones with calculated progress:', milestonesWithCalculatedProgress);
      setMilestones(milestonesWithCalculatedProgress);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast({
        title: "Error",
        description: "Failed to load milestones. Please try again.",
        variant: "destructive",
      });
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchMilestones();
    }
  }, [projectId]);

  // Expose refresh function
  useEffect(() => {
    if (onRefresh) {
      onRefresh = fetchMilestones;
    }
  }, [onRefresh]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'delayed': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleMilestoneCreated = async (milestoneData: any) => {
    try {
      console.log('MilestonesSection: Starting milestone creation with data:', milestoneData);
      
      // Create milestone in database
      const newMilestone = await milestonesService.createMilestone(milestoneData);
      console.log('MilestonesSection: Milestone created successfully:', newMilestone);
      
      // Add to local state with calculated status
      const milestoneWithActivities: MilestoneWithActivities = {
        ...newMilestone,
        activities: []
      };
      const milestoneWithCalculatedStatus = calculateMilestoneStatus(milestoneWithActivities);
      setMilestones(prev => [...prev, milestoneWithCalculatedStatus]);
      
      toast({
        title: "Success",
        description: "Milestone created successfully.",
      });
    } catch (error) {
      console.error('MilestonesSection: Error creating milestone:', error);
      console.error('MilestonesSection: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "Error",
        description: `Failed to create milestone: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleActivityCreated = async (activityData: any) => {
    try {
      console.log('MilestonesSection: Starting activity creation with data:', activityData);
      
      // Create activity in database
      const newActivity = await activitiesService.createActivity(activityData);
      console.log('MilestonesSection: Activity created successfully:', newActivity);
      
      // Add to local state with calculated status
      const activityWithTasks: ActivityWithTasks = {
        ...newActivity,
        tasks: []
      };
      
      setMilestones(prev => prev.map(milestone => {
        if (milestone.id === selectedMilestoneId) {
          const updatedActivities = [...(milestone.activities || []), activityWithTasks];
          const updatedMilestone = {
            ...milestone,
            activities: updatedActivities
          };
          
          // Recalculate milestone status and progress based on activities
          return calculateMilestoneStatus(updatedMilestone);
        }
        return milestone;
      }));
      
      toast({
        title: "Success",
        description: "Activity created successfully.",
      });
    } catch (error) {
      console.error('MilestonesSection: Error creating activity:', error);
      console.error('MilestonesSection: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "Error",
        description: `Failed to create activity: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Calculate milestone status and progress based on activities and tasks
  const calculateMilestoneStatus = (milestone: MilestoneWithActivities): MilestoneWithActivities => {
    if (!milestone.activities || milestone.activities.length === 0) {
      return {
        ...milestone,
        status: 'pending' as const,
        progress: 0
      };
    }

    let totalTasks = 0;
    let completedTasks = 0;
    let totalActivityProgress = 0;
    let activitiesWithTasks = 0;

    milestone.activities.forEach(activity => {
      if (activity.tasks && activity.tasks.length > 0) {
        totalTasks += activity.tasks.length;
        completedTasks += activity.tasks.filter(task => task.completed).length;
        activitiesWithTasks++;
      }
    });

    // Calculate overall progress based on task completion
    let overallProgress = 0;
    if (totalTasks > 0) {
      overallProgress = Math.round((completedTasks / totalTasks) * 100);
    } else if (activitiesWithTasks > 0) {
      // If no tasks but activities exist, calculate based on activity progress
      milestone.activities.forEach(activity => {
        if (activity.tasks && activity.tasks.length === 0) {
          totalActivityProgress += activity.progress || 0;
        }
      });
      overallProgress = Math.round(totalActivityProgress / activitiesWithTasks);
    }

    // Determine status based on completion
    let status: 'pending' | 'in_progress' | 'completed' | 'delayed' = 'pending';
    
    if (overallProgress === 100) {
      status = 'completed';
    } else if (overallProgress > 0) {
      status = 'in_progress';
    } else {
      status = 'pending';
    }

    // Check for delays (if any activity has delayed status)
    const hasDelayedActivities = milestone.activities.some(activity => activity.status === 'delayed');
    if (hasDelayedActivities && status !== 'completed') {
      status = 'delayed';
    }

    console.log(`Milestone ${milestone.name}: ${completedTasks}/${totalTasks} tasks completed = ${overallProgress}% progress`);

    return {
      ...milestone,
      status,
      progress: overallProgress
    };
  };

  // Update activity status and progress based on tasks
  const updateActivityStatus = (activity: ActivityWithTasks): ActivityWithTasks => {
    if (!activity.tasks || activity.tasks.length === 0) {
      return {
        ...activity,
        status: 'pending' as const,
        progress: 0
      };
    }

    const totalTasks = activity.tasks.length;
    const completedTasks = activity.tasks.filter(task => task.completed).length;
    const progress = Math.round((completedTasks / totalTasks) * 100);

    let status: 'pending' | 'in_progress' | 'completed' | 'delayed' = 'pending';
    
    if (progress === 100) {
      status = 'completed';
    } else if (progress > 0) {
      status = 'in_progress';
    } else {
      status = 'pending';
    }

    // Check for delays based on deadlines
    const now = new Date();
    const hasOverdueTasks = activity.tasks.some(task => 
      task.deadline && !task.completed && new Date(task.deadline) < now
    );
    
    if (hasOverdueTasks && status !== 'completed') {
      status = 'delayed';
    }

    console.log(`Activity ${activity.name}: ${completedTasks}/${totalTasks} tasks completed = ${progress}% progress`);

    return {
      ...activity,
      status,
      progress
    };
  };

  // Handle adding a new task to an activity
  const handleTaskAdded = (milestoneId: string, activityId: string, newTask: TodoItem) => {
    console.log(`Adding task "${newTask.task}" to activity ${activityId} in milestone ${milestoneId}`);
    
    setMilestones(prev => prev.map(milestone => {
      if (milestone.id === milestoneId) {
        const updatedActivities = milestone.activities?.map(activity => {
          if (activity.id === activityId) {
            const updatedTasks = [...(activity.tasks || []), newTask];
            const updatedActivity = {
              ...activity,
              tasks: updatedTasks
            };
            
            // Update activity status based on tasks
            const updatedActivityWithStatus = updateActivityStatus(updatedActivity);
            console.log(`Activity ${activity.name} updated: ${updatedActivityWithStatus.progress}% progress`);
            
            return updatedActivityWithStatus;
          }
          return activity;
        }) || [];

        const updatedMilestone = {
          ...milestone,
          activities: updatedActivities
        };

        // Recalculate milestone status based on updated activities
        const updatedMilestoneWithStatus = calculateMilestoneStatus(updatedMilestone);
        console.log(`Milestone ${milestone.name} updated: ${updatedMilestoneWithStatus.progress}% progress`);
        
        return updatedMilestoneWithStatus;
      }
      return milestone;
    }));
  };

  // Handle task completion status change
  const handleTaskStatusChange = async (milestoneId: string, activityId: string, taskId: string, completed: boolean) => {
    try {
      console.log(`Updating task ${taskId} to completed: ${completed}`);
      console.log(`Milestone: ${milestoneId}, Activity: ${activityId}`);
      
      // Update task in database
      await toggleTodoCompletion(taskId, completed);
      
      // Update local state
      setMilestones(prev => {
        console.log('Current milestones before update:', prev);
        
        return prev.map(milestone => {
          if (milestone.id === milestoneId) {
            console.log(`Processing milestone: ${milestone.name}`);
            
            const updatedActivities = milestone.activities?.map(activity => {
              if (activity.id === activityId) {
                console.log(`Processing activity: ${activity.name}`);
                console.log(`Current tasks in activity:`, activity.tasks);
                
                const updatedTasks = activity.tasks?.map(task => {
                  console.log(`Checking task ${task.id} (type: ${typeof task.id}) against ${taskId} (type: ${typeof taskId}): ${task.id === taskId}`);
                  console.log(`Task details:`, task);
                  return task.id === taskId ? { ...task, completed } : task;
                }) || [];
                
                console.log(`Updated tasks:`, updatedTasks);
                
                const updatedActivity = {
                  ...activity,
                  tasks: updatedTasks
                };
                
                // Update activity status based on tasks
                const updatedActivityWithStatus = updateActivityStatus(updatedActivity);
                console.log(`Activity ${activity.name} updated status:`, updatedActivityWithStatus);
                
                return updatedActivityWithStatus;
              }
              return activity;
            }) || [];

            const updatedMilestone = {
              ...milestone,
              activities: updatedActivities
            };

            // Recalculate milestone status based on updated activities
            const updatedMilestoneWithStatus = calculateMilestoneStatus(updatedMilestone);
            console.log(`Milestone ${milestone.name} updated status:`, updatedMilestoneWithStatus);
            
            return updatedMilestoneWithStatus;
          }
          return milestone;
        });
      });
      
      toast({
        title: "Success",
        description: `Task ${completed ? 'completed' : 'marked as incomplete'}.`,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddActivity = (milestoneId: string) => {
    console.log('MilestonesSection: handleAddActivity called with milestoneId:', milestoneId);
    
    if (!milestoneId || milestoneId.trim() === '') {
      console.error('MilestonesSection: Invalid milestone ID provided');
      toast({
        title: "Error",
        description: "Invalid milestone ID. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedMilestoneId(milestoneId);
    setShowCreateActivity(true);
    console.log('MilestonesSection: Activity dialog opened for milestone:', milestoneId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
                  <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Milestones
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={fetchMilestones}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreateMilestone(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </CardTitle>
        </CardHeader>
        <CardContent>
                  <div className="space-y-4">
                      {milestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onAddActivity={handleAddActivity}
                onTaskStatusChange={handleTaskStatusChange}
                canMarkTasksCompleted={canMarkTasksCompleted}
              />
            ))}
        </div>
        </CardContent>
      </Card>

      {/* Create Milestone Dialog */}
      <CreateMilestoneDialog
        open={showCreateMilestone}
        onOpenChange={setShowCreateMilestone}
        projectId={projectId}
        onMilestoneCreated={handleMilestoneCreated}
      />

      {/* Create Activity Dialog */}
      <CreateActivityDialog
        open={showCreateActivity}
        onOpenChange={setShowCreateActivity}
        milestoneId={selectedMilestoneId}
        onActivityCreated={handleActivityCreated}
      />
    </>
  );
}

interface MilestoneCardProps {
  milestone: MilestoneWithActivities;
  onAddActivity: (milestoneId: string) => void;
  onTaskStatusChange: (milestoneId: string, activityId: string, taskId: string, completed: boolean) => void;
  canMarkTasksCompleted: boolean;
}

function MilestoneCard({ milestone, onAddActivity, onTaskStatusChange, canMarkTasksCompleted }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(true);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'delayed': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Milestone Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flag className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium">{milestone.name}</h3>
            <p className="text-sm text-muted-foreground">{milestone.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(milestone.status)}>
            {milestone.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className={getPriorityColor(milestone.priority)}>
            {milestone.priority}
          </Badge>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{milestone.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${milestone.progress}%` }}
          />
        </div>
      </div>
      
      {/* Activities List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Activities</span>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide' : 'Show'} Activities
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onAddActivity(milestone.id)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Activity
            </Button>
          </div>
        </div>
        
        {expanded && (
          <div className="space-y-2">
                        {milestone.activities?.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                milestoneId={milestone.id}
                onTaskStatusChange={onTaskStatusChange}
                canMarkTasksCompleted={canMarkTasksCompleted}
              />
            ))}
            {(!milestone.activities || milestone.activities.length === 0) && (
              <p className="text-sm text-muted-foreground italic">No activities yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityCardProps {
  activity: ActivityWithTasks;
  milestoneId: string;
  onTaskStatusChange: (milestoneId: string, activityId: string, taskId: string, completed: boolean) => void;
  canMarkTasksCompleted: boolean;
}

function ActivityCard({ activity, milestoneId, onTaskStatusChange, canMarkTasksCompleted }: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'delayed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      {/* Activity Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-green-600" />
          <span className="font-medium text-sm">{activity.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(activity.status)} className="text-xs">
            {activity.status.replace('_', ' ')}
          </Badge>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setExpanded(!expanded)}
            className="h-6 px-2"
          >
            {expanded ? 'Hide' : 'Show'} Tasks
          </Button>
        </div>
      </div>
      
      {/* Activity Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Progress</span>
          <span>{activity.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-green-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${activity.progress}%` }}
          />
        </div>
      </div>
      
      {/* Tasks List */}
      {expanded && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Tasks</span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2"
              onClick={() => toast({ title: "Add Task", description: "Feature coming soon!" })}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground mb-2">
              {activity.tasks?.filter(t => t.completed).length || 0} of {activity.tasks?.length || 0} tasks completed
            </div>
            {activity.tasks?.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                milestoneId={milestoneId}
                activityId={activity.id}
                onStatusChange={onTaskStatusChange}
                canMarkCompleted={canMarkTasksCompleted}
              />
            ))}
            {(!activity.tasks || activity.tasks.length === 0) && (
              <p className="text-xs text-muted-foreground italic">No tasks yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: TodoItem;
  milestoneId: string;
  activityId: string;
  onStatusChange: (milestoneId: string, activityId: string, taskId: string, completed: boolean) => void;
  canMarkCompleted: boolean;
}

function TaskItem({ task, milestoneId, activityId, onStatusChange, canMarkCompleted }: TaskItemProps) {
  const handleClick = () => {
    console.log(`TaskItem clicked: ${task.id} (${task.task})`);
    console.log(`Current completed status: ${task.completed}`);
    console.log(`Will change to: ${!task.completed}`);
    onStatusChange(milestoneId, activityId, task.id, !task.completed);
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded border transition-all duration-200 ${
      task.completed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      {canMarkCompleted ? (
        <button
          type="button"
          onClick={handleClick}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
        </button>
      ) : (
        <div className="w-4 h-4 rounded border-2 flex items-center justify-center">
          {task.completed && <CheckCircle2 className="w-3 h-3 text-green-500" />}
        </div>
      )}
      <span className={`text-sm flex-1 ${task.completed ? 'line-through text-green-700' : 'text-gray-900'}`}>
        {task.task}
      </span>
      <div className="flex items-center gap-1">
        {task.completed && (
          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
            Completed
          </Badge>
        )}
        {!canMarkCompleted && (
          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
            Read Only
          </Badge>
        )}
        {task.assigned_to?.map((user, index) => (
          <div key={index} className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs text-blue-600 font-medium">{user[0]}</span>
          </div>
        ))}
        {task.deadline && (
          <Badge variant="outline" className="text-xs">
            {new Date(task.deadline).toLocaleDateString()}
          </Badge>
        )}
      </div>
    </div>
  );
} 