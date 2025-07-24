import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, AlertCircle, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { type TodoItem } from "@/services/todos/todoService";

interface Project {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  status: string | null;
}

// Define budget interface to safely handle Json type
interface ProjectBudget {
  used?: number;
  total?: number;
  progress?: number;
  [key: string]: unknown;
}

interface CreateTodoDialogProps {
  onTodoCreated: (todos: Omit<TodoItem, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'completed_by'>[]) => void;
}

interface TaskInput {
  task: string;
  percentage: number;
  assigned_to: string[]; // Changed to array to support multiple users
  deadline?: string; // ISO string
}

export function CreateTodoDialog({ onTodoCreated }: CreateTodoDialogProps) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskInput[]>([{ task: "", percentage: 0, assigned_to: [], deadline: "" }]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectProgress, setProjectProgress] = useState<number>(0);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      console.log('Fetching projects for todo dialog...');
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      
      console.log('Fetched projects for todo:', data);
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Could not fetch projects.",
        variant: "destructive",
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch team members from Supabase
  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error",
        description: "Could not fetch team members for assignment.",
        variant: "destructive",
      });
    }
  };

  // Get current project progress from Supabase
  const getProjectProgress = async (projectId: string) => {
    try {
      console.log('Fetching project progress for:', projectId);
      const { data, error } = await supabase
        .from('projects')
        .select('budget')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project progress:', error);
        return 0;
      }

      if (data?.budget && typeof data.budget === 'object' && !Array.isArray(data.budget)) {
        const budget = data.budget as ProjectBudget;
        const progress = budget.progress || 0;
        console.log('Project progress from database:', progress);
        return progress;
      }

      return 0;
    } catch (error) {
      console.error('Error loading project progress:', error);
      return 0;
    }
  };

  // Update project progress when selected project changes
  useEffect(() => {
    if (selectedProject) {
      getProjectProgress(selectedProject).then(progress => {
        setProjectProgress(progress);
      });
    } else {
      setProjectProgress(0);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (open) {
      fetchProjects();
      fetchTeamMembers();
    }
  }, [open]);

  const addTask = () => {
    setTasks([...tasks, { task: "", percentage: 0, assigned_to: [], deadline: "" }]);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index: number, field: 'task' | 'percentage' | 'assigned_to' | 'deadline', value: string | number | string[]) => {
    const newTasks = [...tasks];
    if (field === 'task') {
      newTasks[index].task = value as string;
    } else if (field === 'percentage') {
      const percentage = Math.max(0, Math.min(100, Number(value)));
      
      // Calculate remaining progress available for this project
      const remainingProgress = 100 - projectProgress;
      const otherTasksTotal = tasks.reduce((sum, task, i) => 
        i !== index ? sum + task.percentage : sum, 0
      );
      const maxAllowedForThisTask = remainingProgress - otherTasksTotal;
      
      if (percentage > maxAllowedForThisTask && maxAllowedForThisTask >= 0) {
        toast({
          title: "Progress Limit Exceeded",
          description: `This task can have maximum ${maxAllowedForThisTask}% (remaining project progress: ${remainingProgress}%, other tasks total: ${otherTasksTotal}%)`,
          variant: "destructive",
        });
        newTasks[index].percentage = Math.max(0, maxAllowedForThisTask);
      } else {
        newTasks[index].percentage = percentage;
      }
    } else if (field === 'assigned_to') {
      newTasks[index].assigned_to = value as string[];
    } else if (field === 'deadline') {
      newTasks[index].deadline = value as string;
    }
    setTasks(newTasks);
  };

  const getTotalPercentage = () => {
    return tasks.reduce((sum, task) => sum + task.percentage, 0);
  };

  const getRemainingProgress = () => {
    return Math.max(0, 100 - projectProgress - getTotalPercentage());
  };

  const handleSubmit = async () => {
    const validTasks = tasks.filter(task => task.task.trim() !== "");
    
    if (validTasks.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one task",
        variant: "destructive",
      });
      return;
    }

    // Check if all tasks have assignments
    const unassignedTasks = validTasks.filter(task => task.assigned_to.length === 0);
    if (unassignedTasks.length > 0) {
      toast({
        title: "Error",
        description: "All tasks must be assigned to at least one team member",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }

    const totalPercentage = getTotalPercentage();
    const remainingProgress = 100 - projectProgress;
    
    if (totalPercentage > remainingProgress) {
      toast({
        title: "Error",
        description: `Total task percentage (${totalPercentage}%) exceeds remaining project progress (${remainingProgress}%). Current project progress: ${projectProgress}%`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Create new todos
    const newTodos: Omit<TodoItem, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'completed_by'>[] = validTasks.map(task => ({
      task: task.task.trim(),
      completed: false,
      percentage: task.percentage,
      project_id: selectedProject,
      assigned_to: task.assigned_to,
      deadline: task.deadline || undefined,
    }));

    // Call the callback to add todos
    onTodoCreated(newTodos);

    // Reset form and close dialog
    setTasks([{ task: "", percentage: 0, assigned_to: [], deadline: "" }]);
    setSelectedProject("");
    setProjectProgress(0);
    setOpen(false);
    setLoading(false);
  };

  const totalPercentage = getTotalPercentage();
  const remainingProgress = getRemainingProgress();
  const isOverLimit = totalPercentage > (100 - projectProgress);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create To-Do List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create To-Do List</DialogTitle>
          <DialogDescription>
            Select a project, assign tasks to one or more team members, and set completion percentages. All tasks must be assigned and percentages cannot exceed remaining project progress.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select a project"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                Project Progress: {projectProgress}% | Remaining: {100 - projectProgress}%
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="tasks">Tasks</Label>
              <div className="text-right space-y-1">
                <div className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}>
                  {isOverLimit && <AlertCircle className="h-4 w-4 inline mr-1" />}
                  Tasks Total: {totalPercentage}%
                </div>
                <div className="text-xs text-gray-500">
                  Remaining Available: {remainingProgress}%
                </div>
              </div>
            </div>
            
            {tasks.map((task, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Task Description</Label>
                    <Input
                      value={task.task}
                      onChange={(e) => updateTask(index, 'task', e.target.value)}
                      placeholder={`Task ${index + 1}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Percentage</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={Math.max(0, 100 - projectProgress - tasks.reduce((sum, t, i) => i !== index ? sum + t.percentage : sum, 0))}
                          value={task.percentage}
                          onChange={(e) => updateTask(index, 'percentage', e.target.value)}
                          placeholder="0"
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Deadline (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={task.deadline || ""}
                        onChange={e => updateTask(index, 'deadline', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Assign to (required)
                      </Label>
                      <div className="space-y-2">
                        <Select 
                          value="" 
                          onValueChange={(value) => {
                            if (value && !task.assigned_to.includes(value)) {
                              updateTask(index, 'assigned_to', [...task.assigned_to, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Add team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers
                              .filter(member => !task.assigned_to.includes(member.name))
                              .map((member) => (
                                <SelectItem key={member.id} value={member.name}>
                                  <div className="flex items-center gap-2">
                                    <span>{member.name}</span>
                                    {member.role && (
                                      <span className="text-xs text-gray-500">({member.role})</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        {task.assigned_to.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.assigned_to.map((assignedUser, userIndex) => (
                              <div key={userIndex} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                <span>{assignedUser}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newAssigned = task.assigned_to.filter((_, i) => i !== userIndex);
                                    updateTask(index, 'assigned_to', newAssigned);
                                  }}
                                  className="ml-1 hover:text-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  

                </div>
                
                {tasks.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeTask(index)}
                    className="h-10 w-10 mt-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {isOverLimit && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Task percentages exceed remaining project progress ({100 - projectProgress}%). Current project progress: {projectProgress}%
              </div>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={addTask}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Task
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || isOverLimit}>
            {loading ? "Creating..." : "Create To-Do List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
