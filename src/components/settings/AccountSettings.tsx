
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserSettings } from '@/hooks/useUserSettings';
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

interface AccountSettingsProps {
  settings: UserSettings | null;
  loading: boolean;
  onSave: (settings: Partial<UserSettings>) => Promise<boolean>;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ 
  settings, 
  loading
}) => {
  const { currentUser, userProfile } = useAuth();
  const [email, setEmail] = React.useState<string>("");
  const isMobile = useIsMobile();
  
  // Set the email from the authenticated user
  React.useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      president: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      lab: "bg-green-100 text-green-800",
      general_director: "bg-indigo-100 text-indigo-800",
      manager: "bg-orange-100 text-orange-800",
      field: "bg-teal-100 text-teal-800",
      front_desk: "bg-pink-100 text-pink-800",
      financial: "bg-yellow-100 text-yellow-800"
    };
    return roleColors[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleTitle = (role: string) => {
    const roleTitles: Record<string, string> = {
      president: "President",
      admin: "Administrator",
      lab: "Laboratory Staff",
      general_director: "General Director",
      manager: "Manager",
      field: "Field Staff",
      front_desk: "Front Desk",
      financial: "Financial Staff"
    };
    return roleTitles[role] || role;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-40 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 w-60 bg-gray-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 w-20 bg-gray-300 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-10 w-full bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Your account details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-cigass-500 flex items-center justify-center text-white text-2xl font-bold">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : '?'}
            </div>
            {userProfile && (
              <div className="flex flex-col gap-2">
                <Badge className={getRoleColor(userProfile.role)}>
                  {getRoleTitle(userProfile.role)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(userProfile.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
