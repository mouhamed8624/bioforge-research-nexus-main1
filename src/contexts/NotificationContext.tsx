import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUnreadTodosCount, getIncompleteTodosCount, markTodosAsRead } from '@/services/todos/todoService';

interface NotificationContextType {
  unreadTodosCount: number;
  incompleteTodosCount: number;
  refreshUnreadCount: () => Promise<void>;
  refreshIncompleteCount: () => Promise<void>;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadTodosCount, setUnreadTodosCount] = useState(0);
  const [incompleteTodosCount, setIncompleteTodosCount] = useState(0);
  const { currentUser } = useAuth();

  const refreshUnreadCount = async () => {
    if (!currentUser?.email) return;
    
    try {
      const count = await getUnreadTodosCount(currentUser.email);
      setUnreadTodosCount(count);
    } catch (error) {
      console.error('Error fetching unread todos count:', error);
    }
  };

  const refreshIncompleteCount = async () => {
    if (!currentUser?.email) return;
    
    try {
      const count = await getIncompleteTodosCount(currentUser.email);
      setIncompleteTodosCount(count);
    } catch (error) {
      console.error('Error fetching incomplete todos count:', error);
    }
  };

  const markAsRead = async () => {
    if (!currentUser?.email) return;
    
    try {
      await markTodosAsRead(currentUser.email);
      setUnreadTodosCount(0);
    } catch (error) {
      console.error('Error marking todos as read:', error);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      refreshUnreadCount();
      refreshIncompleteCount();
      
      // Set up polling to check for new todos every 30 seconds
      const interval = setInterval(() => {
        refreshUnreadCount();
        refreshIncompleteCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser?.email]);

  const value: NotificationContextType = {
    unreadTodosCount,
    incompleteTodosCount,
    refreshUnreadCount,
    refreshIncompleteCount,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 