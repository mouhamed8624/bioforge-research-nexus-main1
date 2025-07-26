import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProgressiveLoading, ContentLoader } from "@/components/ui/progressive-loading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CreateTodoDialog } from "@/components/todo/CreateTodoDialog";
import { Clock, CheckCircle2, Circle, User, FolderOpen, Percent, UserCheck, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  fetchTodos, 
  createTodo, 
  markTodoAsCompleted, 
  getUserTodoStats, 
  getGlobalTodoStats,
  migrateTodosFromLocalStorage,
  fixCompletedTodos,
  type TodoItem as DatabaseTodoItem 
} from "@/services/todos/todoService";
import { createTodoCompletionProgress, createProgressBreakdown } from "@/services/progress/progressBreakdownService";

// Use the database TodoItem type
type TodoItem = DatabaseTodoItem;

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
  const [showReport, setShowReport] = useState(false);
  const [showGlobalReport, setShowGlobalReport] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string; email: string | null }[]>([]);

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

  // Initialize with todos from database - optimized loading
  useEffect(() => {
    const loadTodos = async () => {
      try {
        // Only show loading if we don't have any todos yet
        if (todos.length === 0) {
          setLoading(true);
        }
        
        // Run migrations and data fetching in parallel for faster loading
        const [todosData] = await Promise.all([
          fetchTodos(),
          migrateTodosFromLocalStorage(), // Run in background
          fetchProjects(), // Run in background
          fixCompletedTodos() // Fix any completed todos without timestamps
        ]);
        
        setTodos(todosData);
      } catch (error) {
        console.error('Error loading todos:', error);
        // Don't show error toast for initial load, just log it
        if (todos.length > 0) {
          toast({
            title: "Error",
            description: "Failed to refresh todos from database.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadTodos();
  }, []);

  // Fetch all users from profiles table for global report
  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'president') {
      supabase
        .from('profiles')
        .select('id, email')
        .then(({ data, error }) => {
          if (!error && data) setAllUsers(data);
        });
    }
  }, [userProfile?.role]);



  const addTodos = async (newTodos: Omit<TodoItem, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const createdTodos: TodoItem[] = [];
      
      for (const todo of newTodos) {
        const createdTodo = await createTodo({
          task: todo.task,
          assigned_to: todo.assigned_to,
          percentage: todo.percentage,
          project_id: todo.project_id,
          deadline: todo.deadline,
        });
        createdTodos.push(createdTodo);
      }
      
      setTodos(prevTodos => [...prevTodos, ...createdTodos]);
      
      // Refresh stats after adding new todos
      await refreshUserStats();
      await refreshGlobalStats();
      
      toast({
        title: "Success",
        description: `Added ${newTodos.length} task(s) to your todo list.`,
      });
    } catch (error) {
      console.error('Error adding todos:', error);
      toast({
        title: "Error",
        description: "Failed to add todos to database.",
        variant: "destructive",
      });
    }
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
      const completedBy = userProfile?.email || 'Unknown User';
      
      // Find the todo to get its project and percentage
      const todoToComplete = todos.find(todo => todo.id === todoId);
      if (!todoToComplete) {
        throw new Error("Task not found");
      }

      // Get current project progress before updating
      let currentProgress = 0;
      if (todoToComplete.project_id) {
        const { data: currentProject } = await supabase
          .from('projects')
          .select('budget')
          .eq('id', todoToComplete.project_id)
          .single();
        
        if (currentProject?.budget && typeof currentProject.budget === 'object') {
          const budget = currentProject.budget as ProjectBudget;
          currentProgress = budget.progress || 0;
        }
      }

      // Mark as completed in database
      const updatedTodo = await markTodoAsCompleted(todoId, completedBy);

      // Update local state
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === todoId ? updatedTodo : todo
        )
      );

      // Update project progress in Supabase if project_id exists
      if (todoToComplete.project_id) {
        const newProgress = Math.min(100, currentProgress + todoToComplete.percentage);
        
        console.log('Creating progress breakdown record:', {
          projectId: todoToComplete.project_id,
          todoId,
          completedBy,
          progressAdded: todoToComplete.percentage,
          previousProgress: currentProgress,
          newProgress,
          task: todoToComplete.task
        });
        
        // Create progress breakdown record - this MUST succeed
        let progressRecord = null;
        try {
          progressRecord = await createTodoCompletionProgress(
            todoToComplete.project_id,
            todoId,
            completedBy,
            todoToComplete.percentage,
            currentProgress,
            newProgress,
            todoToComplete.task
          );
          
          console.log('Progress breakdown record created successfully:', progressRecord);
        } catch (progressError) {
          console.error('Error creating progress breakdown record:', progressError);
          
          // Fallback: Try to create a basic progress breakdown record
          try {
            console.log('Attempting fallback progress breakdown creation...');
            progressRecord = await createProgressBreakdown({
              project_id: todoToComplete.project_id,
              todo_id: todoId,
              user_email: completedBy,
              progress_added: todoToComplete.percentage,
              previous_progress: currentProgress,
              new_progress: newProgress,
              reason: `Task completed: ${todoToComplete.task}`,
              details: `Completed task "${todoToComplete.task}" which contributed ${todoToComplete.percentage}% to project progress.`
            });
            console.log('Fallback progress breakdown record created:', progressRecord);
          } catch (fallbackError) {
            console.error('Fallback progress breakdown creation also failed:', fallbackError);
            // Show error to user but don't block the todo completion
            toast({
              title: "Warning",
              description: "Todo completed but progress tracking failed. Please check console for details.",
              variant: "destructive",
            });
          }
        }

        // Note: Project progress is automatically updated by database trigger
        // No need to call updateProjectProgress here as it would cause double updates
      }

      // Refresh stats after completion
      await refreshUserStats();
      await refreshGlobalStats();

      toast({
        title: "Success",
        description: "Task marked as completed. Project progress will be updated automatically.",
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

  // Report stats for current user - use database service
  const [userStats, setUserStats] = useState<{ completed: number; onTime: number; late: number; totalHours: number }>({
    completed: 0,
    onTime: 0,
    late: 0,
    totalHours: 0
  });
  const [globalStats, setGlobalStats] = useState<Array<{ user: string; completed: number; onTime: number; late: number; totalHours: number }>>([]);

  // Function to refresh user stats
  const refreshUserStats = async () => {
    if (userProfile?.email) {
      try {
        const stats = await getUserTodoStats(userProfile.email);
        setUserStats(stats);
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    }
  };

  // Function to refresh global stats
  const refreshGlobalStats = async () => {
    try {
      const stats = await getGlobalTodoStats();
      setGlobalStats(stats);
    } catch (error) {
      console.error('Error loading global stats:', error);
    }
  };

  // Load user stats when component mounts or user changes - optimized
  useEffect(() => {
    if (userProfile?.email) {
      // Load stats in background without blocking UI
      refreshUserStats();
    }
  }, [userProfile?.email]);

  // Load global stats for all users - optimized
  useEffect(() => {
    // Load stats in background without blocking UI
    refreshGlobalStats();
  }, [todos]); // Re-run when todos change

  // Pagination state for completed tasks
  const [completedPage, setCompletedPage] = useState(1);
  const completedPerPage = 5;
  const totalCompletedPages = Math.ceil(completedTodos.length / completedPerPage);
  const paginatedCompletedTodos = completedTodos.slice(
    (completedPage - 1) * completedPerPage,
    completedPage * completedPerPage
  );

  const PendingTaskCard: React.FC<{ todo: TodoItem }> = ({ todo }) => {
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
              {todo.deadline && (
                <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex-shrink-0 whitespace-pre-wrap break-words max-w-xs">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Deadline: {format(new Date(todo.deadline), 'MMM d, yyyy HH:mm')}</span>
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

  const CompletedTaskCard: React.FC<{ todo: TodoItem }> = ({ todo }) => {
    // Determine if late
    let isLate = false;
    if (todo.deadline && todo.completed_at) {
      isLate = new Date(todo.completed_at) > new Date(todo.deadline);
    }
    return (
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
                {todo.deadline && (
                  <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex-shrink-0">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium truncate max-w-40">Deadline: {format(new Date(todo.deadline), 'MMM d, yyyy HH:mm')}</span>
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
                    Completed: {format(new Date(todo.completed_at), 'MMM d, yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className="bg-green-100 text-green-800 border-green-200 flex-shrink-0">
              Completed
            </Badge>
            {isLate && (
              <Badge className="bg-red-100 text-red-800 border-red-200 flex-shrink-0 mt-1">
                Late
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <PageContainer
        title="Project to-do list"
        subtitle={`Organize and track your project tasks with completion percentages and multi-user assignments. ${isAdminOrPresident ? 'As admin/president, you can see all pending tasks.' : 'You\'ll only see tasks assigned to you.'}`}
      >
        <div className="flex justify-end mb-4 gap-2">
          <Button variant="outline" onClick={() => setShowReport(true)}>
            Report
          </Button>
          {isAdminOrPresident && (
            <Button variant="outline" onClick={() => setShowGlobalReport(true)}>
              Global Report
            </Button>
          )}
        </div>
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

        <ProgressiveLoading 
          isLoading={loading && todos.length === 0}
          showSpinner={todos.length === 0}
          className="h-64"
        >
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
              <CardHeader className="bg-gradient-to-r from-green-50 to-indigo-50 border-b border-green-100">
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
                  <>
                    <div className="space-y-4">
                      {paginatedCompletedTodos.map((todo) => (
                        <CompletedTaskCard
                          key={todo.id}
                          todo={todo}
                        />
                      ))}
                    </div>
                    {totalCompletedPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={completedPage === 1}
                          onClick={() => setCompletedPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        {Array.from({ length: totalCompletedPages }).map((_, idx) => (
                          <Button
                            key={idx}
                            variant={completedPage === idx + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCompletedPage(idx + 1)}
                          >
                            {idx + 1}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={completedPage === totalCompletedPages}
                          onClick={() => setCompletedPage((p) => Math.min(totalCompletedPages, p + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
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
        </ProgressiveLoading>
      </PageContainer>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-xl border border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-blue-900">
              <UserCheck className="h-5 w-5 text-blue-600" />
              My To-Do Completion Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Total completed by you:</span>
              <span className="text-blue-700">{userStats.completed}</span>
            </div>
            <div className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-green-600" />
              <span>Completed on time:</span>
              <span className="text-green-700 font-semibold">{userStats.onTime}</span>
            </div>
            <div className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Completed late:</span>
              <span className="text-red-700 font-semibold">{userStats.late}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReport(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Report Dialog */}
      <Dialog open={showGlobalReport} onOpenChange={setShowGlobalReport}>
        <DialogContent className="max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-blue-900">
              <UsersIcon className="h-5 w-5 text-blue-600" />
              Global To-Do Completion Report
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto py-2">
            <table className="min-w-full border text-sm rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-blue-50 text-blue-900">
                  <th className="px-4 py-2 border font-semibold">User</th>
                  <th className="px-4 py-2 border font-semibold">Completed</th>
                  <th className="px-4 py-2 border font-semibold">On Time</th>
                  <th className="px-4 py-2 border font-semibold">Late</th>
                </tr>
              </thead>
              <tbody>
                {globalStats.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-500">No completed to-dos yet.</td></tr>
                ) : (
                  globalStats.map((row) => (
                    <tr key={row.user} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-2 border font-medium text-blue-900 whitespace-nowrap">{row.user}</td>
                      <td className="px-4 py-2 border text-center text-blue-700 font-semibold">{row.completed}</td>
                      <td className="px-4 py-2 border text-center text-green-700 font-semibold">{row.onTime}</td>
                      <td className="px-4 py-2 border text-center text-red-700 font-semibold">{row.late}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGlobalReport(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TodoListPage;
