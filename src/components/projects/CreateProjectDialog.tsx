
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "completed" | "draft";
  startDate: string;
  endDate?: string;
  teamMembers: number;
  progress: number;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreate: (project: Project) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreate }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft" as Project["status"],
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    teamMembers: 1,
    progress: 0,
    budget: "",
    selectedTeamMembers: [] as string[],
    principalInvestigator: "",
    coPrincipalInvestigator: "",
    budgetFounder: "",
    organizations: [] as string[],
    newOrganization: "",
  });
  const [creating, setCreating] = useState(false);

  // Fetch team members from database
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("status", "active");
      
      if (error) {
        console.error("Error fetching team members:", error);
        return [];
      }
      
      return data || [];
    },
  });

  const handleTeamMemberToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTeamMembers: prev.selectedTeamMembers.includes(memberId)
        ? prev.selectedTeamMembers.filter(id => id !== memberId)
        : [...prev.selectedTeamMembers, memberId]
    }));
  };

  const handleAddOrganization = () => {
    if (formData.newOrganization.trim() && !formData.organizations.includes(formData.newOrganization.trim())) {
      setFormData(prev => ({
        ...prev,
        organizations: [...prev.organizations, prev.newOrganization.trim()],
        newOrganization: ""
      }));
    }
  };

  const handleRemoveOrganization = (orgToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      organizations: prev.organizations.filter(org => org !== orgToRemove)
    }));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, budget: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    if (creating) {
      console.log('Already creating project, skipping...');
      return;
    }

    setCreating(true);
    
    try {
      console.log('Creating project in database with data:', formData);
      
      // Get selected team member names for the team array
      const selectedTeamMemberNames = teamMembers
        .filter(member => formData.selectedTeamMembers.includes(member.id))
        .map(member => member.name);
      
      // Parse budget value
      const budgetValue = formData.budget === "" ? 0 : parseFloat(formData.budget) || 0;
      
      // Create project in Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          team: selectedTeamMemberNames,
          budget: {
            total: budgetValue,
            used: 0,
            progress: 0
          },
          principal_investigator: formData.principalInvestigator || null,
          co_principal_investigator: formData.coPrincipalInvestigator || null,
          budget_founder: formData.budgetFounder || null,
          organizations: formData.organizations.length > 0 ? formData.organizations : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project in database:', error);
        toast({
          title: "Error",
          description: `Failed to create project: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Project created successfully in database:', data);

      // Transform database project to UI format
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        status: data.status as Project["status"],
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        teamMembers: selectedTeamMemberNames.length,
        progress: formData.progress,
      };

      console.log('Transformed project for UI:', newProject);

      // Call the callback to update the parent component
      onProjectCreate(newProject);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        status: "draft",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        teamMembers: 1,
        progress: 0,
        budget: "",
        selectedTeamMembers: [],
        principalInvestigator: "",
        coPrincipalInvestigator: "",
        budgetFounder: "",
        organizations: [],
        newOrganization: "",
      });
      
      // Close dialog
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              required
              disabled={creating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              rows={3}
              disabled={creating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principalInvestigator">Principal Investigator (PI)</Label>
              <Input
                id="principalInvestigator"
                value={formData.principalInvestigator}
                onChange={(e) => setFormData(prev => ({ ...prev, principalInvestigator: e.target.value }))}
                placeholder="Enter PI name"
                disabled={creating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coPrincipalInvestigator">Co-Principal Investigator (CO-PI)</Label>
              <Input
                id="coPrincipalInvestigator"
                value={formData.coPrincipalInvestigator}
                onChange={(e) => setFormData(prev => ({ ...prev, coPrincipalInvestigator: e.target.value }))}
                placeholder="Enter CO-PI name"
                disabled={creating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetFounder">Budget Founder</Label>
            <Input
              id="budgetFounder"
              value={formData.budgetFounder}
              onChange={(e) => setFormData(prev => ({ ...prev, budgetFounder: e.target.value }))}
              placeholder="Enter budget founder name"
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label>Organizations</Label>
            <div className="flex gap-2">
              <Input
                value={formData.newOrganization}
                onChange={(e) => setFormData(prev => ({ ...prev, newOrganization: e.target.value }))}
                placeholder="Enter organization name"
                disabled={creating}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOrganization();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={handleAddOrganization}
                disabled={creating || !formData.newOrganization.trim()}
              >
                Add
              </Button>
            </div>
            {formData.organizations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.organizations.map((org, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {org}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveOrganization(org)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: Project["status"]) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="text"
                value={formData.budget}
                onChange={handleBudgetChange}
                placeholder="Enter budget amount"
                disabled={creating}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={creating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={creating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">Progress (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
              disabled={creating}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Assign Team Members</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members available</p>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={member.id}
                        checked={formData.selectedTeamMembers.includes(member.id)}
                        onCheckedChange={() => handleTeamMemberToggle(member.id)}
                        disabled={creating}
                      />
                      <Label htmlFor={member.id} className="text-sm font-normal cursor-pointer">
                        {member.name} - {member.role}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.selectedTeamMembers.length} team member(s) selected
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
