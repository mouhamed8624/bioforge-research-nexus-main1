import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, ChartPie } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type BudgetAllocationItem = {
  id: string;
  category: string;
  percentage: number;
  color: string;
};

const COLORS = ["#8a61ee", "#12db93", "#0c8de5", "#f97316", "#6366f1", "#ec4899", "#d946ef"];

export function BudgetAllocationSection() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetAllocationItem | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newPercentage, setNewPercentage] = useState("");

  const { data: allocations = [], refetch } = useQuery({
    queryKey: ["budgetAllocations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_allocation")
        .select("*")
        .order("percentage", { ascending: false });

      if (error) {
        console.error("Error fetching budget allocations:", error);
        return [];
      }
      return data as BudgetAllocationItem[];
    },
  });

  const handleAddAllocation = async () => {
    if (!newCategory || !newPercentage || isNaN(Number(newPercentage))) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid category and percentage",
        variant: "destructive",
      });
      return;
    }

    const percentage = Number(newPercentage);
    if (percentage <= 0 || percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Percentage must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    // Calculate total of existing percentages
    const existingTotal = allocations.reduce((sum, item) => sum + item.percentage, 0);
    if (existingTotal + percentage > 100) {
      toast({
        title: "Exceeds 100%",
        description: `Total allocation cannot exceed 100%. Available: ${100 - existingTotal}%`,
        variant: "destructive",
      });
      return;
    }

    // Generate a color for the new category
    const colorIndex = allocations.length % COLORS.length;
    const color = COLORS[colorIndex];

    const { error } = await supabase.from("budget_allocation").insert({
      category: newCategory,
      percentage: percentage,
      color: color,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add budget allocation",
        variant: "destructive",
      });
      console.error("Error adding budget allocation:", error);
      return;
    }

    toast({
      title: "Success",
      description: "Budget allocation added successfully",
    });
    
    setNewCategory("");
    setNewPercentage("");
    setAddDialogOpen(false);
    refetch();
  };

  const handleUpdateAllocation = async () => {
    if (!selectedItem) return;
    
    const percentage = Number(newPercentage);
    if (percentage <= 0 || percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Percentage must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    // Calculate total of existing percentages excluding the current item
    const existingTotal = allocations
      .filter(item => item.id !== selectedItem.id)
      .reduce((sum, item) => sum + item.percentage, 0);

    if (existingTotal + percentage > 100) {
      toast({
        title: "Exceeds 100%",
        description: `Total allocation cannot exceed 100%. Available: ${100 - existingTotal}%`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("budget_allocation")
      .update({
        category: newCategory || selectedItem.category,
        percentage: percentage,
      })
      .eq("id", selectedItem.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update budget allocation",
        variant: "destructive",
      });
      console.error("Error updating budget allocation:", error);
      return;
    }

    toast({
      title: "Success",
      description: "Budget allocation updated successfully",
    });
    
    setEditDialogOpen(false);
    refetch();
  };

  const handleEditClick = (item: BudgetAllocationItem) => {
    setSelectedItem(item);
    setNewCategory(item.category);
    setNewPercentage(item.percentage.toString());
    setEditDialogOpen(true);
  };

  const handleDeleteAllocation = async () => {
    if (!selectedItem) return;

    const { error } = await supabase
      .from("budget_allocation")
      .delete()
      .eq("id", selectedItem.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete budget allocation",
        variant: "destructive",
      });
      console.error("Error deleting budget allocation:", error);
      return;
    }

    toast({
      title: "Success",
      description: "Budget allocation deleted successfully",
    });
    
    setEditDialogOpen(false);
    refetch();
  };

  // Check if total is less than 100%
  const totalPercentage = allocations.reduce((sum, item) => sum + item.percentage, 0);
  const remainingPercentage = 100 - totalPercentage;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartPie className="h-5 w-5 text-blue-500" />
            <span>Budget Allocation</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setAddDialogOpen(true)}
            disabled={remainingPercentage <= 0}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Allocation</span>
          </Button>
        </CardTitle>
        <CardDescription>How project budget is allocated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {allocations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ChartPie className="h-10 w-10 mb-2 opacity-20" />
              <p>No budget allocations defined yet.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add First Allocation
              </Button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocations}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                  nameKey="category"
                >
                  {allocations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {allocations.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span>{item.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{item.percentage}%</span>
                <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {remainingPercentage > 0 && (
          <div className="mt-4 p-2 border rounded border-dashed text-sm text-muted-foreground">
            <span>{remainingPercentage}% of budget remaining to allocate</span>
          </div>
        )}
      </CardContent>

      {/* Add Allocation Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Allocation</DialogTitle>
            <DialogDescription>
              Define how project budget is allocated across categories.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Equipment, Reagents, Staff"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="percentage" className="text-right">
                Percentage (%)
              </Label>
              <Input
                id="percentage"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                className="col-span-3"
                type="number"
                min="1"
                max="100"
                placeholder={`Available: ${remainingPercentage}%`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAllocation}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Allocation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Allocation</DialogTitle>
            <DialogDescription>
              Update how project budget is allocated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Input
                id="edit-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-percentage" className="text-right">
                Percentage (%)
              </Label>
              <Input
                id="edit-percentage"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                className="col-span-3"
                type="number"
                min="1"
                max="100"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleDeleteAllocation}>
              Delete
            </Button>
            <div>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleUpdateAllocation}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
