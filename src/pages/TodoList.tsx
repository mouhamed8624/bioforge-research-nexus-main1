import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CreateTodoDialog } from "@/components/todo/CreateTodoDialog";
import { Clock, CheckCircle2, Circle, User, FolderOpen, Percent, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Define TodoItem type locally
interface TodoItem {
  id?: string;
  task: string;
  completed: boolean;
  assigned_to: string[]; // Changed to array to support multiple users
  completed_at?: string;
  completed_by?: string; // New field to track who completed the task
  created_at?: string;
  percentage: number;
  project_id?: string;
}

interface Project {
  id: string;
  name: string;
}

// Define budget interface
interface ProjectBudget {
  used?: number;
  total?: number;
  progress?: number;
  [key: string]: unknown;
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const TodoListPage = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    try {
      console.log('Fetching projects for todo display...');
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      
      console.log('Fetched projects for todo display:', data);
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Initialize with empty todos or load from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (error) {
        console.error('Error loading todos from localStorage:', error);
        setTodos([]);
      }
    }
    
    // Fetch projects for display names
    fetchProjects();
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const updateProjectProgress = async (projectId: string, percentageToAdd: number) => {
    try {
      console.log(`Updating project ${projectId} progress by ${percentageToAdd}%`);
      
      // First, get the current project data
      const { data: currentProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) {
        console.error('Error fetching current project:', fetchError);
        throw fetchError;
      }

      if (!currentProject) {
        throw new Error('Project not found');
      }

      // Safely handle the budget Json type
      let currentBudget: ProjectBudget = {};
      if (currentProject.budget && typeof currentProject.budget === 'object' && !Array.isArray(currentProject.budget)) {
        currentBudget = currentProject.budget as ProjectBudget;
      }

      // Calculate new progress
      const currentProgress = currentBudget.progress || 0;
      const newProgress = Math.min(100, currentProgress + percentageToAdd);

      // Update the project with new progress
      const updatedBudget: ProjectBudget = {
        ...currentBudget,
        progress: newProgress
      };

      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          budget: updatedBudget as Json,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) {
        console.error('Error updating project progress:', updateError);
        throw updateError;
      }

      console.log(`Project ${projectId} progress updated to ${newProgress}%`);
      
      toast({
        title: "Project Progress Updated",
        description: `Added ${percentageToAdd}% to project progress. New progress: ${newProgress}%`,
      });
    } catch (error) {
      console.error('Error updating project progress:', error);
      toast({
        title: "Warning",
        description: "Task completed but failed to update project progress in database.",
        variant: "destructive",
      });
    }
  };

  const addTodos = (newTodos: TodoItem[]) => {
    const todosWithIds = newTodos.map(todo => ({
      ...todo,
      id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    }));
    
    setTodos(prevTodos => [...prevTodos, ...todosWithIds]);
    
    toast({
      title: "Success",
      description: `Added ${newTodos.length} task(s) to your todo list.`,
    });
  };

  const markAsCompleted = async (todoId: string | undefined) => {
    if (!todoId) {
      toast({
        title: "Error",
        description: "Task ID is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const completionTime = new Date().toISOString();
      const completedBy = userProfile?.email || 'Unknown User';
      
      // Find the todo to get its project and percentage
      const todoToComplete = todos.find(todo => todo.id === todoId);
      if (!todoToComplete) {
        throw new Error("Task not found");
      }

      // Update local state
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === todoId
            ? { 
                ...todo, 
                completed: true, 
                completed_at: completionTime,
                completed_by: completedBy
              }
            : todo
        )
      );

      // Update project progress in Supabase if project_id exists
      if (todoToComplete.project_id) {
        await updateProjectProgress(todoToComplete.project_id, todoToComplete.percentage);
      }

      toast({
        title: "Success",
        description: "Task marked as completed and project progress updated.",
      });
    } catch (error) {
      console.error("Error marking task as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark task as completed.",
        variant: "destructive",
      });
    }
  };

  const getProjectName = (projectId?: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  // Separate todos into pending and completed
  // Pending tasks should only be shown to the assigned user, except for admin/president who can see all
  const isAdminOrPresident = userProfile?.role === 'admin' || userProfile?.role === 'president';
  const pendingTodos = todos.filter(todo => 
    !todo.completed && 
    (isAdminOrPresident || todo.assigned_to.includes(userProfile?.email || '') || todo.assigned_to.length === 0)
  );
  const completedTodos = todos.filter(todo => todo.completed);

  const PendingTaskCard = ({ todo }: { todo: TodoItem }) => {
    const isAssignedToCurrentUser = todo.assigned_to.includes(userProfile?.email || '');
    const showAdminIndicator = isAdminOrPresident && !isAssignedToCurrentUser;
    
    return (
      <div className={`group bg-gradient-to-r from-white to-blue-50/30 border border-blue-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200 ${showAdminIndicator ? 'border-orange-200 bg-gradient-to-r from-orange-50/30 to-blue-50/30' : ''}`}>
        <div className="flex items-start justify-between gap-4 min-w-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-1 flex-shrink-0">
              <Circle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors break-words">
                {todo.task}
              </h3>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              {todo.project_id && (
                <div className="flex items-center gap-1 text-blue-600 flex-shrink-0">
                  <FolderOpen className="h-4 w-4" />
                  <span className="truncate">{getProjectName(todo.project_id)}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-purple-600 flex-shrink-0">
                <Percent className="h-4 w-4" />
                <span>{todo.percentage}%</span>
              </div>
              {todo.assigned_to.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {todo.assigned_to.map((user, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0 text-xs">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{user}</span>
                    </div>
                  ))}
                </div>
              )}
              {todo.created_at && (
                <div className="text-gray-500 text-xs flex-shrink-0">
                  Created: {format(new Date(todo.created_at), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            {showAdminIndicator && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs whitespace-nowrap">
                Not Assigned to You
              </Badge>
            )}
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
          {isAssignedToCurrentUser && (
            <Button
              size="sm"
              onClick={() => markAsCompleted(todo.id)}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm whitespace-nowrap flex-shrink-0"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
  };

  const CompletedTaskCard = ({ todo }: { todo: TodoItem }) => (
    <div className="bg-gradient-to-r from-green-50/50 to-white border border-green-100 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4 min-w-0">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-1 flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <h3 className="font-medium text-gray-700 line-through break-words">
              {todo.task}
            </h3>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              {todo.project_id && (
                <div className="flex items-center gap-1 text-gray-500 flex-shrink-0">
                  <FolderOpen className="h-4 w-4" />
                  <span className="truncate">{getProjectName(todo.project_id)}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-500 flex-shrink-0">
                <Percent className="h-4 w-4" />
                <span>{todo.percentage}%</span>
              </div>
              {todo.assigned_to.length > 0 && (
                <div className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                  <User className="h-4 w-4" />
                  <span className="truncate max-w-32">{todo.assigned_to.join(', ')}</span>
                </div>
              )}
              {todo.completed_by && (
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex-shrink-0">
                  <UserCheck className="h-4 w-4" />
                  <span className="font-medium truncate max-w-40">Completed by: {todo.completed_by}</span>
                </div>
              )}
              {todo.completed_at && (
                <div className="text-gray-500 text-xs flex-shrink-0">
                  Completed: {format(new Date(todo.completed_at), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200 flex-shrink-0">
          Completed
        </Badge>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <PageContainer
        title="My To-do List"
        subtitle={`Organize and track your project tasks with completion percentages and multi-user assignments. ${isAdminOrPresident ? 'As admin/president, you can see all pending tasks.' : 'You\'ll only see tasks assigned to you.'}`}
      >
        {/* Create To-Do List Section */}
        {userProfile?.role !== 'manager' && (
          <Card className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">Create New To-Do List</CardTitle>
              <CardDescription className="text-purple-700">
                Select a project, assign tasks to one or more team members, and set completion percentages. All tasks must be assigned and total percentage cannot exceed 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreateTodoDialog onTodoCreated={addTodos} />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Enhanced Pending Tasks Section */}
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Pending Tasks
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      {pendingTodos.length} task{pendingTodos.length !== 1 ? 's' : ''} waiting to be completed
                      {isAdminOrPresident && (
                        <span className="block text-xs text-blue-600 mt-1">
                          (Viewing all tasks as {userProfile?.role})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {pendingTodos.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {pendingTodos.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {pendingTodos.length > 0 ? (
                  <div className="space-y-4">
                    {pendingTodos.map((todo) => (
                      <PendingTaskCard
                        key={todo.id}
                        todo={todo}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">All caught up!</p>
                    <p className="text-gray-500 text-sm">No pending tasks. Great job! 🎉</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Tasks Section */}
            <Card className="border-green-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Completed Tasks
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      {completedTodos.length} task{completedTodos.length !== 1 ? 's' : ''} completed
                    </CardDescription>
                  </div>
                  {completedTodos.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {completedTodos.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {completedTodos.length > 0 ? (
                  <div className="space-y-4">
                    {completedTodos.map((todo) => (
                      <CompletedTaskCard
                        key={todo.id}
                        todo={todo}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Circle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No completed tasks yet</p>
                    <p className="text-gray-500 text-sm">Start completing some tasks to see them here!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
};

export default TodoListPage;
