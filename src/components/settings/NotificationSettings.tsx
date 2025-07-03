
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { NotificationPreferences } from '@/hooks/useUserSettings';
import { useIsMobile } from "@/hooks/use-mobile";

interface NotificationSettingsProps {
  preferences: NotificationPreferences | null;
  loading: boolean;
  onSave: (prefs: Partial<NotificationPreferences>) => Promise<boolean>;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  preferences,
  loading,
  onSave
}) => {
  const isMobile = useIsMobile();
  
  const handleToggleChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    
    await onSave({ [key]: value } as Partial<NotificationPreferences>);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure how and when you receive alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-11 bg-gray-300 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure how and when you receive alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p>Unable to load notification preferences.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Configure how and when you receive alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[
            {
              key: 'projectUpdates' as keyof NotificationPreferences,
              title: 'Project Updates',
              description: 'Get notified about changes to your projects',
              checked: preferences.projectUpdates
            },
            {
              key: 'equipmentReservations' as keyof NotificationPreferences,
              title: 'Equipment Reservations',
              description: 'Receive alerts for upcoming reservations',
              checked: preferences.equipmentReservations
            },
            {
              key: 'financialUpdates' as keyof NotificationPreferences,
              title: 'Financial Updates',
              description: 'Budget alerts and financial changes',
              checked: preferences.financialUpdates
            },
            {
              key: 'systemAnnouncements' as keyof NotificationPreferences,
              title: 'System Announcements',
              description: 'Important system updates and maintenance notices',
              checked: preferences.systemAnnouncements
            },
            {
              key: 'marketingCommunications' as keyof NotificationPreferences,
              title: 'Marketing Communications',
              description: 'Newsletters and product updates',
              checked: preferences.marketingCommunications
            }
          ].map((item, index) => (
            <div key={index} className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch 
                checked={item.checked} 
                onCheckedChange={(checked) => handleToggleChange(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
