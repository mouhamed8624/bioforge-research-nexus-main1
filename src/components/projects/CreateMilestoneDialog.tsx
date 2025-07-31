import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CreateMilestoneData } from "@/services/milestones/types";

interface CreateMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onMilestoneCreated: (milestoneData: any) => void;
}

export function CreateMilestoneDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  onMilestoneCreated 
}: CreateMilestoneDialogProps) {
  const [formData, setFormData] = useState<CreateMilestoneData>({
    project_id: projectId,
    name: '',
    description: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pass the form data to the parent component for database creation
      onMilestoneCreated(formData);
      toast({
        title: "Milestone Created",
        description: "The milestone has been created successfully.",
      });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        project_id: projectId,
        name: '',
        description: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateMilestoneData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Milestone</DialogTitle>
          <DialogDescription>
            Add a new milestone to organize your project activities.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Milestone Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter milestone name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the milestone objectives"
              rows={3}
            />
          </div>



          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>



          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Creating..." : "Create Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 