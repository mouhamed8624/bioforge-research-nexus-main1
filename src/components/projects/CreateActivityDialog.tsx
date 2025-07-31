import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CreateActivityData } from "@/services/milestones/types";

interface CreateActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneId: string;
  onActivityCreated: (activityData: any) => void;
}

export function CreateActivityDialog({ 
  open, 
  onOpenChange, 
  milestoneId, 
  onActivityCreated 
}: CreateActivityDialogProps) {
  const [formData, setFormData] = useState<CreateActivityData>({
    milestone_id: milestoneId || '',
    name: '',
    description: '',
    assigned_to: []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate milestone ID
    if (!milestoneId || milestoneId.trim() === '') {
      toast({
        title: "Error",
        description: "Invalid milestone ID. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: "Error",
        description: "Activity name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Ensure milestone_id is properly set
      const activityData = {
        ...formData,
        milestone_id: milestoneId
      };
      
      console.log('CreateActivityDialog: Submitting activity data:', activityData);
      
      // Pass the form data to the parent component for database creation
      onActivityCreated(activityData);
      toast({
        title: "Activity Created",
        description: "The activity has been created successfully.",
      });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        milestone_id: milestoneId || '',
        name: '',
        description: '',
        assigned_to: []
      });
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: "Error",
        description: "Failed to create activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateActivityData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Activity</DialogTitle>
          <DialogDescription>
            Add a new activity to organize tasks within this milestone.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Activity Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter activity name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the activity objectives"
              rows={3}
            />
          </div>







          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 