
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface BudgetAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onAllocationUpdate: () => void;
}

interface AllocationItem {
  category: string;
  percentage: number;
  color: string;
}

const BUDGET_CATEGORIES = [
  "Personnel",
  "Equipment",
  "Supplies",
  "Travel",
  "Other Direct Costs",
  "Indirect Costs"
];

const COLORS = [
  "#8a61ee",
  "#12db93", 
  "#0c8de5",
  "#f97316",
  "#6366f1",
  "#ec4899",
  "#d946ef",
  "#84cc16"
];

export function BudgetAllocationDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onAllocationUpdate 
}: BudgetAllocationDialogProps) {
  const [allocations, setAllocations] = useState<AllocationItem[]>([
    { category: "", percentage: 0, color: COLORS[0] }
  ]);
  const [saving, setSaving] = useState(false);

  const addAllocation = () => {
    const colorIndex = allocations.length % COLORS.length;
    setAllocations([
      ...allocations,
      { category: "", percentage: 0, color: COLORS[colorIndex] }
    ]);
  };

  const removeAllocation = (index: number) => {
    if (allocations.length > 1) {
      setAllocations(allocations.filter((_, i) => i !== index));
    }
  };

  const updateAllocation = (index: number, field: keyof AllocationItem, value: string | number) => {
    const updated = [...allocations];
    updated[index] = { ...updated[index], [field]: value };
    setAllocations(updated);
  };

  const getTotalPercentage = () => {
    return allocations.reduce((sum, allocation) => sum + allocation.percentage, 0);
  };

  const handleSave = async () => {
    const totalPercentage = getTotalPercentage();
    
    if (totalPercentage !== 100) {
      toast({
        title: "Invalid Allocation",
        description: "Total percentage must equal 100%",
        variant: "destructive",
      });
      return;
    }

    const hasEmptyCategories = allocations.some(allocation => !allocation.category);
    if (hasEmptyCategories) {
      toast({
        title: "Invalid Allocation",
        description: "Please select a category for all allocations",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      // Delete existing allocations for this project
      await supabase
        .from('budget_allocation')
        .delete()
        .eq('project_id', projectId);

      // Insert new allocations
      const allocationData = allocations.map(allocation => ({
        project_id: projectId,
        category: allocation.category,
        percentage: allocation.percentage,
        color: allocation.color
      }));

      const { error } = await supabase
        .from('budget_allocation')
        .insert(allocationData);

      if (error) {
        console.error('Error saving budget allocation:', error);
        toast({
          title: "Error",
          description: "Failed to save budget allocation",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Budget allocation saved successfully",
      });

      onAllocationUpdate();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error saving budget allocation:', error);
      toast({
        title: "Error",
        description: "Failed to save budget allocation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const totalPercentage = getTotalPercentage();
  const isValidTotal = totalPercentage === 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Allocate Project Budget</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Define how the project budget should be allocated across different categories.
          </div>
          
          {allocations.map((allocation, index) => (
            <div key={index} className="flex gap-2 items-end p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`category-${index}`}>Category</Label>
                <Select 
                  value={allocation.category} 
                  onValueChange={(value) => updateAllocation(index, 'category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-24 space-y-2">
                <Label htmlFor={`percentage-${index}`}>%</Label>
                <Input
                  id={`percentage-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  value={allocation.percentage}
                  onChange={(e) => updateAllocation(index, 'percentage', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div className="w-12 space-y-2">
                <Label>Color</Label>
                <div 
                  className="w-8 h-8 rounded border cursor-pointer"
                  style={{ backgroundColor: allocation.color }}
                  onClick={() => {
                    const nextColorIndex = (COLORS.indexOf(allocation.color) + 1) % COLORS.length;
                    updateAllocation(index, 'color', COLORS[nextColorIndex]);
                  }}
                />
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeAllocation(index)}
                disabled={allocations.length === 1}
                className="mb-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addAllocation}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="font-medium">Total Allocation:</span>
            <span className={`font-bold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
              {totalPercentage}%
            </span>
          </div>
          
          {!isValidTotal && (
            <div className="text-sm text-red-600">
              Total must equal 100%. Current total: {totalPercentage}%
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !isValidTotal}
          >
            {saving ? "Saving..." : "Save Allocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
