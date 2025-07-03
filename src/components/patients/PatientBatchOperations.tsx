
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PatientBatchOperationsProps {
  selectedPatientIds: string[];
  onClearSelection: () => void;
  onBatchOperation: (operation: string, patientIds: string[]) => Promise<void>;
}

export function PatientBatchOperations({
  selectedPatientIds,
  onClearSelection,
  onBatchOperation,
}: PatientBatchOperationsProps) {
  const { toast } = useToast();
  const [operation, setOperation] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOperationChange = (value: string) => {
    setOperation(value);
  };

  const handleApply = () => {
    if (!operation) {
      toast({
        title: "No operation selected",
        description: "Please select an operation to apply",
        variant: "destructive",
      });
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmOperation = async () => {
    if (!operation || selectedPatientIds.length === 0) return;

    setIsLoading(true);
    try {
      await onBatchOperation(operation, selectedPatientIds);
      toast({
        title: "Operation successful",
        description: `${operation} applied to ${selectedPatientIds.length} patient(s)`,
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  if (selectedPatientIds.length === 0) {
    return null;
  }

  const operationOptions = [
    { label: "Update Status", value: "update_status" },
    { label: "Assign Project", value: "assign_project" },
    { label: "Flag for Review", value: "flag_review" },
    { label: "Export Data", value: "export" },
    { label: "Archive", value: "archive" },
  ];

  return (
    <>
      <Card className="mb-4 border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium">
            <Layers className="mr-2 h-4 w-4" /> 
            Batch Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
              {selectedPatientIds.length} patient{selectedPatientIds.length > 1 ? "s" : ""} selected
            </Badge>
          </div>
          <Select value={operation} onValueChange={handleOperationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select operation" />
            </SelectTrigger>
            <SelectContent>
              {operationOptions.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Clear selection
            </Button>
            <Button size="sm" onClick={handleApply} disabled={!operation}>
              Apply
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Batch Operation</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply "{operationOptions.find(op => op.value === operation)?.label}" 
              to {selectedPatientIds.length} selected patient{selectedPatientIds.length > 1 ? "s" : ""}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmOperation}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
