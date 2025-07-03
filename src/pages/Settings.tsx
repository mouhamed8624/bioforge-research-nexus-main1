
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { User, Lock, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const {
    settings,
    loading,
    saveSettings,
  } = useUserSettings();
  
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await logout();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      navigate("/login");
      
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <MainLayout>
      <PageContainer
        title="Settings"
        subtitle="Configure your account and application preferences"
      >
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging Out..." : "Logout"}
          </Button>
        </div>
        
        <Tabs defaultValue="account" className="w-full">
          <div className={`${isMobile ? 'overflow-x-auto pb-2' : ''}`}>
            <TabsList className={`mb-6 ${isMobile ? 'w-max' : 'w-full'}`}>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="account">
            <AccountSettings 
              settings={settings}
              loading={loading}
              onSave={saveSettings}
            />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </MainLayout>
  );
};

export default Settings;
