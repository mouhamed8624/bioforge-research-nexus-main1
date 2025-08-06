import { supabase } from "@/integrations/supabase/client";

export interface TodoNotificationData {
  todoId: string;
  assignedTo: string[];
  taskTitle: string;
  taskDescription: string;
  projectName?: string;
  deadline?: string;
  assignedBy: string;
}

export interface NotificationResult {
  success: boolean;
  message: string;
  sent: number;
  failed: number;
}

class TodoNotificationService {
  private edgeFunctionUrl: string;

  constructor() {
    // Get the Supabase URL from environment or client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-todo-notification`;
  }

  async sendTodoNotifications(data: TodoNotificationData): Promise<NotificationResult> {
    try {
      console.log('Sending todo notifications for:', data);

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', errorText);
        throw new Error(`Edge function failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Todo notification result:', result);
      
      return result;
    } catch (error) {
      console.error('Error sending todo notifications:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        sent: 0,
        failed: data.assignedTo.length,
      };
    }
  }

  async sendTestNotification(userEmail: string): Promise<NotificationResult> {
    const testData: TodoNotificationData = {
      todoId: 'test-' + Date.now(),
      assignedTo: [userEmail],
      taskTitle: 'Test Task',
      taskDescription: 'This is a test task to verify email notifications are working.',
      projectName: 'Test Project',
      assignedBy: 'System Test',
    };

    return this.sendTodoNotifications(testData);
  }

  // Helper method to get user names from emails
  async getUserNames(emails: string[]): Promise<Record<string, string>> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, name')
        .in('email', emails);

      if (error) {
        console.error('Error fetching user profiles:', error);
        return {};
      }

      const nameMap: Record<string, string> = {};
      profiles?.forEach(profile => {
        nameMap[profile.email] = profile.name || profile.email.split('@')[0];
      });

      return nameMap;
    } catch (error) {
      console.error('Error in getUserNames:', error);
      return {};
    }
  }
}

// Export singleton instance
export const todoNotificationService = new TodoNotificationService(); 