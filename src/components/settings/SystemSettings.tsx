
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Globe, Shield, Database } from "lucide-react";
import { UserSettings } from '@/hooks/useUserSettings';
import { useIsMobile } from "@/hooks/use-mobile";

interface SystemSettingsProps {
  settings: UserSettings | null;
  loading: boolean;
  onSave: (settings: Partial<UserSettings>) => Promise<boolean>;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  settings,
  loading,
  onSave
}) => {
  const isMobile = useIsMobile();
  
  const handleToggleChange = async (key: keyof UserSettings, value: boolean) => {
    if (!settings) return;
    
    await onSave({ [key]: value } as Partial<UserSettings>);
  };
  
  const handleInputChange = async (key: keyof UserSettings, value: string) => {
    if (!settings) return;
    
    await onSave({ [key]: value } as Partial<UserSettings>);
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6`}>
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-40 bg-gray-300 rounded mb-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-300 rounded"></div>
                    <div className="h-10 w-full bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6`}>
        <Card>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p>Unable to load system settings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            <span>Regional Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input 
                id="language" 
                value={settings.language} 
                onChange={(e) => handleInputChange('language', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Input 
                id="timezone" 
                value={settings.timeZone}
                onChange={(e) => handleInputChange('timeZone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Input 
                id="dateFormat" 
                value={settings.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <span>Privacy & Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
              <div>
                <p className="font-medium">Usage Analytics</p>
                <p className="text-sm text-muted-foreground">Share anonymous usage data</p>
              </div>
              <Switch 
                checked={settings.usageAnalytics}
                onCheckedChange={(checked) => handleToggleChange('usageAnalytics', checked)}
              />
            </div>
            
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
              <div>
                <p className="font-medium">Crash Reports</p>
                <p className="text-sm text-muted-foreground">Send error reports automatically</p>
              </div>
              <Switch 
                checked={settings.crashReports}
                onCheckedChange={(checked) => handleToggleChange('crashReports', checked)}
              />
            </div>
            
            <div className="pt-2">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Download Personal Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
