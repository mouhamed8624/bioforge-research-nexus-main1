
import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function CalendarInstructions() {
  const [searchParams] = useSearchParams();
  const calendarUrl = searchParams.get("url") || "";

  const copyUrl = () => {
    navigator.clipboard.writeText(calendarUrl);
    toast({
      title: "Calendar URL copied",
      description: "Paste this URL in your calendar app to subscribe"
    });
  };

  return (
    <MainLayout>
      <PageContainer
        title="Link Your Calendar"
        subtitle="Follow these instructions to connect your personal calendar"
      >
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Calendar Subscription URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-3 bg-muted rounded-md flex items-center justify-between">
              <code className="text-sm break-all">{calendarUrl}</code>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Instructions:</h3>
              
              <div className="space-y-2">
                <h4 className="font-medium">Google Calendar:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Open Google Calendar in your browser</li>
                  <li>Click the "+" icon next to "Other calendars"</li>
                  <li>Select "From URL"</li>
                  <li>Paste the URL above and click "Add calendar"</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Apple Calendar:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Open Calendar app on your Mac or iOS device</li>
                  <li>Go to File → New Calendar Subscription (Mac) or Settings → Accounts → Add Account → Other → Add Subscribed Calendar (iOS)</li>
                  <li>Paste the URL above and follow the prompts</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Microsoft Outlook:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Open Outlook in your browser or desktop app</li>
                  <li>Go to Calendar view</li>
                  <li>Click "Add calendar" → "Subscribe from web"</li>
                  <li>Paste the URL above and click "Import"</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
}
