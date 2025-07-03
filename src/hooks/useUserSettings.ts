
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface UserSettings {
  language: string;
  timeZone: string;
  dateFormat: string;
  crashReports: boolean;
  usageAnalytics: boolean;
  profileData?: string;
}

export interface NotificationPreferences {
  projectUpdates: boolean;
  equipmentReservations: boolean;
  financialUpdates: boolean;
  systemAnnouncements: boolean;
  marketingCommunications: boolean;
}

export const useUserSettings = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    language: "English",
    timeZone: "UTC",
    dateFormat: "MM/DD/YYYY",
    crashReports: true,
    usageAnalytics: true,
  });
  
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    projectUpdates: true,
    equipmentReservations: true,
    financialUpdates: true,
    systemAnnouncements: true,
    marketingCommunications: false,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadUserSettings();
      loadNotificationPreferences();
    }
  }, [currentUser]);

  const loadUserSettings = async () => {
    if (!currentUser) return;
    
    try {
      // Since user_settings table doesn't exist in types, we'll use mock data
      console.log("Loading user settings - using defaults since table not available");
      // Mock successful load
      setSettings({
        language: "English",
        timeZone: "UTC",
        dateFormat: "MM/DD/YYYY",
        crashReports: true,
        usageAnalytics: true,
      });
    } catch (error) {
      console.error("Error loading user settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationPreferences = async () => {
    if (!currentUser) return;
    
    try {
      // Since notification_preferences table doesn't exist in types, we'll use mock data
      console.log("Loading notification preferences - using defaults since table not available");
      // Mock successful load
      setNotifications({
        projectUpdates: true,
        equipmentReservations: true,
        financialUpdates: true,
        systemAnnouncements: true,
        marketingCommunications: false,
      });
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Mock successful save since table doesn't exist
      console.log("Saving user settings - mocked since table not available", updatedSettings);
      
      setSettings(updatedSettings);
      return true;
    } catch (error) {
      console.error("Error saving user settings:", error);
      return false;
    }
  };

  const saveNotifications = async (newNotifications: Partial<NotificationPreferences>): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const updatedNotifications = { ...notifications, ...newNotifications };
      
      // Mock successful save since table doesn't exist
      console.log("Saving notification preferences - mocked since table not available", updatedNotifications);
      
      setNotifications(updatedNotifications);
      return true;
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      return false;
    }
  };

  return {
    settings,
    notifications,
    loading,
    saveSettings,
    saveNotifications,
  };
};
