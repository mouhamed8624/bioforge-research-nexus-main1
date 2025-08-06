import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { simpleEmailService } from "@/services/email/simpleEmailService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, XCircle, Loader2, Settings } from "lucide-react";

export function EmailStatusTest() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const emailStatus = simpleEmailService.getStatus();

  const handleTestEmail = async () => {
    if (!currentUser?.email) {
      toast({
        title: "Error",
        description: "Please log in to test email notifications",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const result = await simpleEmailService.sendTestEmail(currentUser.email);
      setTestResult(result.message);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Email test completed! Check the console for details.",
        });
      } else {
        toast({
          title: "Error",
          description: `Email test failed: ${result.message}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing email notification:", error);
      toast({
        title: "Error",
        description: "Failed to test email notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={emailStatus.enabled ? "default" : "secondary"}>
              {emailStatus.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {emailStatus.message}
          </p>
        </div>
        
        {currentUser?.email && (
          <div className="text-sm">
            <span className="text-muted-foreground">Your email: </span>
            <span className="font-medium">{currentUser.email}</span>
          </div>
        )}
        
        <Button 
          onClick={handleTestEmail} 
          disabled={loading || !currentUser?.email || !emailStatus.enabled}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing Email...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Test Email Notification
            </>
          )}
        </Button>
        
        {testResult && (
          <div className="space-y-2 p-3 rounded-md bg-gray-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Test Result</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {testResult}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Note:</strong> This is a simulation mode. No actual emails are sent.</p>
          <p>Check the browser console for detailed email content.</p>
          <p>To enable real emails, set VITE_EMAIL_ENABLED=true in your environment.</p>
        </div>
      </CardContent>
    </Card>
  );
} 