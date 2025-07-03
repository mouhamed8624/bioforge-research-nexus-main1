
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Activity, Calendar, FileText } from "lucide-react";

interface PatientTimelineProps {
  patientId: string;
}

export const PatientTimeline = ({ patientId }: PatientTimelineProps) => {
  const { data: labResults = [], isLoading } = useQuery({
    queryKey: ["patientLabResults", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_lab_results")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching lab results:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Patient Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Patient Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {labResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lab results found for this patient</p>
          </div>
        ) : (
          <div className="space-y-4">
            {labResults.map((result) => (
              <div key={result.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{result.test_name}</h4>
                    <Badge variant={result.status === "approved" ? "default" : "secondary"}>
                      {result.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Value: {result.value} {result.units && `${result.units}`}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(result.created_at), "MMM dd, yyyy 'at' HH:mm")}
                  </div>
                  {result.approved_by && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Approved by: {result.approved_by}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
