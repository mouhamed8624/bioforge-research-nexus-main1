import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { simpleEmailService } from "@/services/email/simpleEmailService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";

export function TestEmailNotification() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { currentUser } = useAuth();

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
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Test email sent! Check your inbox at ${currentUser.email}`,
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to send test email: ${result.message}`,
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
          Test Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Test the email notification system by sending a test email to your account.
        </div>
        
        {currentUser?.email && (
          <div className="text-sm">
            <span className="text-muted-foreground">Target email: </span>
            <span className="font-medium">{currentUser.email}</span>
          </div>
        )}
        
        <Button 
          onClick={handleTestEmail} 
          disabled={loading || !currentUser?.email}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Test Email...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>
        
        {testResult && (
          <div className="space-y-2 p-3 rounded-md bg-gray-50">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">
                {testResult.success ? "Test Successful" : "Test Failed"}
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {testResult.message}
            </div>
            
            <div className="text-sm text-muted-foreground">
              {testResult.message}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> This tests the email notification system. Make sure your Supabase Edge Function is deployed and configured with an email service.</p>
        </div>
      </CardContent>
    </Card>
  );
} 