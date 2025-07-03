import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptText, PlusCircle, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

// Define local types since some tables aren't in generated types yet
type SpendingEntry = Tables<'spending'>;
type ProjectWithBudget = Tables<'projects'>;
type BudgetAllocation = Tables<'budget_allocation'>;

export function SpendingTracker({ projectId }: { projectId: string | null }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spendingToDelete, setSpendingToDelete] = useState<SpendingEntry | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budget allocations for categories
  const { data: allocations = [] } = useQuery({
    queryKey: ["budgetAllocations", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      try {
        const { data, error } = await supabase
          .from("budget_allocation")
          .select("*")
          .eq("project_id", projectId);

        if (error) {
          console.error("Error fetching budget allocations:", error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.error("Error fetching budget allocations:", err);
        return [];
      }
    },
    enabled: !!projectId,
  });

  // Fetch spending entries directly from spending table
  const { data: spendingEntries = [], isLoading: isLoadingSpending } = useQuery({
    queryKey: ["projectSpending", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      try {
        const { data, error } = await supabase
          .from('spending')
          .select('*')
          .eq('project_id', projectId)
          .order('date', { ascending: false });
        
        if (error) {
          console.error("Error fetching spending data:", error);
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.error("Error fetching spending data:", err);
        return [];
      }
    },
    enabled: !!projectId,
  });

  // Fetch project details
  const { data: projectData } = useQuery({
    queryKey: ['selectedProject', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        
        if (error) {
          console.error("Error fetching project:", error);
          return null;
        }
        
        return data;
      } catch (err) {
        console.error("Error fetching project:", err);
        return null;
      }
    },
    enabled: !!projectId,
  });

  const handleAddSpending = async () => {
    if (!projectId || !category || !amount || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('spending')
        .insert({
          project_id: projectId,
          category: category,
          amount: amountValue,
          description: description
        });

      if (insertError) {
        toast({
          title: "Error",
          description: "Failed to record spending",
          variant: "destructive",
        });
        console.error("Error recording spending:", insertError);
        return;
      }

      toast({
        title: "Success",
        description: "Spending recorded successfully",
      });

      // Reset form and close dialog
      setAmount("");
      setDescription("");
      setCategory("");
      setIsDialogOpen(false);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["projectSpending", projectId] });
      queryClient.invalidateQueries({ queryKey: ["selectedProject", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectsForBudget"] });
      queryClient.invalidateQueries({ queryKey: ["riskProjects"] });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to record spending",
        variant: "destructive",
      });
      console.error("Error recording spending:", err);
    }
  };

  const openDeleteDialog = (spending: SpendingEntry) => {
    setSpendingToDelete(spending);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSpending = async () => {
    if (!spendingToDelete || !projectId) return;

    try {
      const { error: deleteError } = await supabase
        .from('spending')
        .delete()
        .eq('id', spendingToDelete.id);

      if (deleteError) {
        toast({
          title: "Error",
          description: "Failed to delete spending record",
          variant: "destructive",
        });
        console.error("Error deleting spending record:", deleteError);
        return;
      }

      toast({
        title: "Success",
        description: "Spending record deleted successfully",
      });

      // Close dialog and clear selected item
      setDeleteDialogOpen(false);
      setSpendingToDelete(null);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["projectSpending", projectId] });
      queryClient.invalidateQueries({ queryKey: ["selectedProject", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projectsForBudget"] });
      queryClient.invalidateQueries({ queryKey: ["riskProjects"] });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete spending record",
        variant: "destructive",
      });
      console.error("Error deleting spending record:", err);
    }
  };

  // Calculate total spending by category
  const spendingByCategory = spendingEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = 0;
    }
    acc[entry.category] += Number(entry.amount);
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = spendingEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  
  if (!projectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            <span>Spending Tracker</span>
          </CardTitle>
          <CardDescription>Select a project to track spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <p>Please select a project first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            <span>Spending Tracker</span>
          </div>
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => setIsDialogOpen(true)}
            disabled={!projectId || allocations.length === 0}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Record Spending
          </Button>
        </CardTitle>
        <CardDescription>
          Track expenses for {projectData?.name || "this project"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingSpending ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading spending data...</p>
          </div>
        ) : spendingEntries.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <ReceiptText className="h-10 w-10 mb-2 opacity-20" />
            <p>No spending records found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
              disabled={allocations.length === 0}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Record First Expense
            </Button>
            {allocations.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                You need to create budget allocations first
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spendingEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(entry.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDeleteDialog(entry)}
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="pt-2">
              <p className="text-sm font-medium">
                Category Spending Summary
              </p>
              <div className="mt-2 space-y-2">
                {Object.entries(spendingByCategory).map(([cat, amount]) => {
                  const allocation = allocations.find(a => a.category === cat);
                  const budgetTotal = projectData?.budget && typeof projectData.budget === 'object' && 'total' in projectData.budget ? 
                    Number(projectData.budget.total) : 0;
                  const allocatedAmount = allocation ? 
                    (allocation.percentage / 100) * budgetTotal : 0;
                  const percentUsed = allocatedAmount > 0 ? 
                    (amount / allocatedAmount) * 100 : 0;
                  
                  return (
                    <div key={cat} className="flex justify-between items-center text-sm p-2 rounded-md border">
                      <span>{cat}</span>
                      <div className="flex items-center gap-2">
                        <span 
                          className={`${percentUsed > 100 ? 'text-red-500' : 'text-muted-foreground'}`}
                        >
                          ${amount.toLocaleString()} of ${allocatedAmount.toLocaleString()}
                        </span>
                        <span 
                          className={`min-w-14 text-right font-medium ${
                            percentUsed > 100 ? 'text-red-500' : 
                            percentUsed > 75 ? 'text-amber-500' : 'text-green-600'
                          }`}
                        >
                          {percentUsed.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center p-2 font-medium">
                  <span>Total Spent</span>
                  <span>${totalSpent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Spending</DialogTitle>
            <DialogDescription>
              Add a new expense to this project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select 
                value={category} 
                onValueChange={setCategory}
              >
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {allocations.map((allocation) => (
                    <SelectItem key={allocation.id} value={allocation.category}>
                      {allocation.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount ($)
              </Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter expense amount"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Brief description of the expense"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSpending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this spending record? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSpending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
