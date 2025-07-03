
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

interface LabResult {
  id: string;
  testName: string;
  value: string;
  units: string;
}

interface SubmitLabDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export const SubmitLabDialog = ({ isOpen, onClose, patientId, patientName }: SubmitLabDialogProps) => {
  const [labResults, setLabResults] = useState<LabResult[]>([
    { id: '1', testName: '', value: '', units: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addLabResult = () => {
    const newId = (labResults.length + 1).toString();
    setLabResults([...labResults, { id: newId, testName: '', value: '', units: '' }]);
  };

  const removeLabResult = (id: string) => {
    if (labResults.length > 1) {
      setLabResults(labResults.filter(result => result.id !== id));
    }
  };

  const updateLabResult = (id: string, field: keyof LabResult, value: string) => {
    setLabResults(labResults.map(result => 
      result.id === id ? { ...result, [field]: value } : result
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all required fields are filled
    const validResults = labResults.filter(result => result.testName && result.value);
    
    if (validResults.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least one complete lab result (test name and value)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for insertion
      const labData = validResults.map(result => {
        const numericValue = parseFloat(result.value);
        if (isNaN(numericValue)) {
          throw new Error(`Invalid numeric value for ${result.testName}`);
        }

        return {
          patient_id: patientId,
          test_name: result.testName,
          value: numericValue,
          units: result.units || null,
          status: "pending"
        };
      });

      // Insert all lab results at once
      const { error } = await supabase
        .from("patient_lab_results")
        .insert(labData);

      if (error) {
        console.error("Error submitting lab results:", error);
        toast({
          title: "Error",
          description: "Failed to submit lab results. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${validResults.length} lab result${validResults.length > 1 ? 's' : ''} submitted successfully`,
      });

      // Reset form
      setLabResults([{ id: '1', testName: '', value: '', units: '' }]);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["labResults"] });
      queryClient.invalidateQueries({ queryKey: ["pendingSubmissions"] });
      
      onClose();
    } catch (error: any) {
      console.error("Error submitting lab results:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLabResults([{ id: '1', testName: '', value: '', units: '' }]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Lab Results for {patientName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {labResults.map((result, index) => (
              <Card key={result.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Lab Result {index + 1}</CardTitle>
                    {labResults.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLabResult(result.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`testName-${result.id}`}>Test Name *</Label>
                    <Select 
                      value={result.testName} 
                      onValueChange={(value) => updateLabResult(result.id, 'testName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Blood Glucose">Blood Glucose</SelectItem>
                        <SelectItem value="Hemoglobin">Hemoglobin</SelectItem>
                        <SelectItem value="White Blood Cell Count">White Blood Cell Count</SelectItem>
                        <SelectItem value="Platelet Count">Platelet Count</SelectItem>
                        <SelectItem value="Cholesterol">Cholesterol</SelectItem>
                        <SelectItem value="Creatinine">Creatinine</SelectItem>
                        <SelectItem value="ALT">ALT</SelectItem>
                        <SelectItem value="AST">AST</SelectItem>
                        <SelectItem value="Blood Pressure Systolic">Blood Pressure Systolic</SelectItem>
                        <SelectItem value="Blood Pressure Diastolic">Blood Pressure Diastolic</SelectItem>
                        <SelectItem value="Heart Rate">Heart Rate</SelectItem>
                        <SelectItem value="Temperature">Temperature</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`value-${result.id}`}>Test Value *</Label>
                      <Input
                        id={`value-${result.id}`}
                        type="number"
                        step="0.01"
                        value={result.value}
                        onChange={(e) => updateLabResult(result.id, 'value', e.target.value)}
                        placeholder="Enter test result value"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`units-${result.id}`}>Units</Label>
                      <Input
                        id={`units-${result.id}`}
                        value={result.units}
                        onChange={(e) => updateLabResult(result.id, 'units', e.target.value)}
                        placeholder="e.g., mg/dL, mmol/L"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addLabResult}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Lab Result
            </Button>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : `Submit ${labResults.filter(r => r.testName && r.value).length} Result${labResults.filter(r => r.testName && r.value).length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
