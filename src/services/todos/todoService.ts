import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type TodoItem = Tables<"todos">;

export interface CreateTodoData {
  task: string;
  assigned_to: string[];
  percentage: number;
  project_id?: string;
  deadline?: string;
}

export interface TodoStats {
  completed: number;
  onTime: number;
  late: number;
  totalHours: number;
}

export interface UserTodoStats {
  user: string;
  completed: number;
  onTime: number;
  late: number;
  totalHours: number;
}

// Fetch all todos from database
export const fetchTodos = async (): Promise<TodoItem[]> => {
  try {
    console.log('fetchTodos: Starting...');
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }

    console.log('fetchTodos: Fetched todos:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchTodos:', error);
    throw error;
  }
};

// Create new todo
export const createTodo = async (todoData: CreateTodoData): Promise<TodoItem> => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        task: todoData.task,
        assigned_to: todoData.assigned_to,
        percentage: todoData.percentage,
        project_id: todoData.project_id,
        deadline: todoData.deadline,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating todo:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createTodo:', error);
    throw error;
  }
};

// Mark todo as completed
export const markTodoAsCompleted = async (
  todoId: string, 
  completedBy: string
): Promise<TodoItem> => {
  try {
    console.log('markTodoAsCompleted: Starting with todoId:', todoId, 'completedBy:', completedBy);
    const completionTime = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('todos')
      .update({
        completed: true,
        completed_at: completionTime,
        completed_by: completedBy,
        updated_at: completionTime,
      })
      .eq('id', todoId)
      .select()
      .single();

    if (error) {
      console.error('Error marking todo as completed:', error);
      throw error;
    }

    console.log('markTodoAsCompleted: Successfully updated todo:', data);
    return data;
  } catch (error) {
    console.error('Error in markTodoAsCompleted:', error);
    throw error;
  }
};

// Get todo statistics for a specific user
export const getUserTodoStats = async (userEmail: string): Promise<TodoStats> => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('completed_by', userEmail)
      .eq('completed', true);

    if (error) {
      console.error('Error fetching user todo stats:', error);
      throw error;
    }

    const completedTodos = data || [];
    
    const onTime = completedTodos.filter(todo => 
      todo.deadline && todo.completed_at && 
      new Date(todo.completed_at) <= new Date(todo.deadline)
    ).length;
    
    const late = completedTodos.filter(todo => 
      todo.deadline && todo.completed_at && 
      new Date(todo.completed_at) > new Date(todo.deadline)
    ).length;

    // Calculate total hours: sum of actual time spent (completed_at - created_at)
    const totalHours = completedTodos.reduce((sum, todo) => {
      if (todo.completed_at && todo.created_at) {
        const diffMs = new Date(todo.completed_at).getTime() - new Date(todo.created_at).getTime();
        return sum + Math.max(0, diffMs / (1000 * 60 * 60));
      }
      return sum;
    }, 0);

    return {
      completed: completedTodos.length,
      onTime,
      late,
      totalHours,
    };
  } catch (error) {
    console.error('Error in getUserTodoStats:', error);
    throw error;
  }
};

// Get global todo statistics for all users
export const getGlobalTodoStats = async (): Promise<UserTodoStats[]> => {
  try {
    console.log('getGlobalTodoStats: Starting...');
    
    // First get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('email');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log('getGlobalTodoStats: Users fetched:', users);

    // Get all completed todos
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .eq('completed', true);

    if (todosError) {
      console.error('Error fetching todos:', todosError);
      throw todosError;
    }

    console.log('getGlobalTodoStats: Completed todos fetched:', todos);

    // Calculate stats for each user
    const userStatsMap: Record<string, TodoStats> = {};
    
    todos?.forEach(todo => {
      if (todo.completed_by) {
        if (!userStatsMap[todo.completed_by]) {
          userStatsMap[todo.completed_by] = { completed: 0, onTime: 0, late: 0, totalHours: 0 };
        }
        
        userStatsMap[todo.completed_by].completed++;
        
        if (todo.deadline && todo.completed_at) {
          const completedOnTime = new Date(todo.completed_at) <= new Date(todo.deadline);
          if (completedOnTime) {
            userStatsMap[todo.completed_by].onTime++;
          } else {
            userStatsMap[todo.completed_by].late++;
          }
        }
        
        if (todo.completed_at && todo.created_at) {
          const diffMs = new Date(todo.completed_at).getTime() - new Date(todo.created_at).getTime();
          userStatsMap[todo.completed_by].totalHours += Math.max(0, diffMs / (1000 * 60 * 60));
        }
      }
    });

    // Merge all users with stats, show zeroes for users with no completed todos
    const userStats: UserTodoStats[] = (users || []).map(user => {
      const email = user.email || '(no email)';
      const stats = userStatsMap[email] || { completed: 0, onTime: 0, late: 0, totalHours: 0 };
      return { user: email, ...stats };
    });

    console.log('getGlobalTodoStats: Final user stats:', userStats);
    console.log('getGlobalTodoStats: User stats map:', userStatsMap);

    return userStats;
  } catch (error) {
    console.error('Error in getGlobalTodoStats:', error);
    throw error;
  }
};

// Migrate todos from localStorage to database
export const migrateTodosFromLocalStorage = async (): Promise<void> => {
  try {
    const savedTodos = localStorage.getItem('todos');
    if (!savedTodos) {
      console.log('No todos found in localStorage to migrate');
      return;
    }

    const todos = JSON.parse(savedTodos);
    if (!Array.isArray(todos) || todos.length === 0) {
      console.log('No valid todos found in localStorage to migrate');
      return;
    }

    console.log(`Migrating ${todos.length} todos from localStorage to database`);

    // Insert todos into database
    const { error } = await supabase
      .from('todos')
      .insert(todos.map(todo => ({
        task: todo.task,
        completed: todo.completed || false,
        assigned_to: todo.assigned_to || [],
        completed_at: todo.completed_at || null,
        completed_by: todo.completed_by || null,
        created_at: todo.created_at || new Date().toISOString(),
        percentage: todo.percentage || 0,
        project_id: todo.project_id || null,
        deadline: todo.deadline || null,
      })));

    if (error) {
      console.error('Error migrating todos:', error);
      throw error;
    }

    console.log('Successfully migrated todos from localStorage to database');
    
    // Clear localStorage after successful migration
    localStorage.removeItem('todos');
  } catch (error) {
    console.error('Error in migrateTodosFromLocalStorage:', error);
    throw error;
  }
}; 