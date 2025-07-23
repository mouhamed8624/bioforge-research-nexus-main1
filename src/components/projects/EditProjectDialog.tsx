
import { useState, useEffect } from "react";
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
  budget?: {
    total: number;
    used: number;
    progress: number;
  };
  principal_investigator?: string;
  co_principal_investigator?: string;
  budget_founder?: string;
  organizations?: string[];
  team?: string[]; // Added for team members array
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onProjectUpdate: (updatedProject: Project) => void;
}

export function EditProjectDialog({ open, onOpenChange, project, onProjectUpdate }: EditProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft" as Project["status"],
    startDate: "",
    endDate: "",
    progress: 0,
    budget: "",
    selectedTeamMembers: [] as string[],
    principalInvestigator: "",
    coPrincipalInvestigator: "",
    budgetFounder: "",
    organizations: [] as string[],
    newOrganization: "",
  });
  const [updating, setUpdating] = useState(false);

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

  // Fetch full project data from database when project changes
  useEffect(() => {
    const fetchProjectData = async () => {
      if (project?.id && open) {
        console.log('Fetching full project data for:', project.id);
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', project.id)
          .single();

        if (error) {
          console.error('Error fetching project data:', error);
          return;
        }

        console.log('Full project data from database:', data);
        
        const budgetTotal = data.budget && typeof data.budget === 'object' && !Array.isArray(data.budget) 
          ? (data.budget as any).total || 0 
          : 0;
        
        console.log('Extracted budget total:', budgetTotal);
        
        setFormData({
          name: data.name || "",
          description: data.description || "",
          status: data.status as Project["status"],
          startDate: project.startDate,
          endDate: project.endDate || "",
          progress: data.budget && typeof data.budget === 'object' && !Array.isArray(data.budget)
            ? (data.budget as any).progress || 0
            : project.progress,
          budget: budgetTotal.toString(),
          selectedTeamMembers: Array.isArray(data.team) ? data.team : [],
          principalInvestigator: data.principal_investigator || "",
          coPrincipalInvestigator: data.co_principal_investigator || "",
          budgetFounder: data.budget_founder || "",
          organizations: data.organizations || [],
          newOrganization: "",
        });
      }
    };

    fetchProjectData();
  }, [project, open]);

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

    if (!project) return;

    if (updating) {
      console.log('Already updating project, skipping...');
      return;
    }

    setUpdating(true);

    // Parse budget value
    const budgetValue = formData.budget === "" ? 0 : parseFloat(formData.budget) || 0;

    // Create updated project object for optimistic update
    const updatedProject: Project = {
      ...project,
      name: formData.name,
      description: formData.description,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      teamMembers: formData.selectedTeamMembers.length,
      progress: formData.progress,
      budget: {
        total: budgetValue,
        used: project.budget?.used || 0,
        progress: formData.progress
      },
      principal_investigator: formData.principalInvestigator,
      co_principal_investigator: formData.coPrincipalInvestigator,
      budget_founder: formData.budgetFounder,
      organizations: formData.organizations,
      team: formData.selectedTeamMembers,
    };

    console.log('Updated project for UI:', updatedProject);

    // Optimistically update UI immediately
    onProjectUpdate(updatedProject);
    
    // Close dialog immediately for better UX
    onOpenChange(false);

    try {
      console.log('Updating project in database:', project.id, 'with data:', formData);

      // Get selected team member names for the team array
      const selectedTeamMemberNames = teamMembers
        .filter(member => formData.selectedTeamMembers.includes(member.id))
        .map(member => member.name);

      // Update project in Supabase with comprehensive payload
      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          team: selectedTeamMemberNames.length > 0 ? selectedTeamMemberNames : Array.from({ length: formData.teamMembers }, (_, i) => `Team Member ${i + 1}`),
          budget: {
            total: budgetValue,
            used: project.budget?.used || 0,
            progress: formData.progress
          },
          principal_investigator: formData.principalInvestigator || null,
          co_principal_investigator: formData.coPrincipalInvestigator || null,
          budget_founder: formData.budgetFounder || null,
          organizations: formData.organizations.length > 0 ? formData.organizations : null
        })
        .eq('id', project.id);

      if (error) {
        console.error('Error updating project in database:', error);
        // Revert optimistic update on error
        onProjectUpdate(project);
        toast({
          title: "Error",
          description: `Failed to update project: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Project updated successfully in database');
      
      toast({
        title: "Project Updated",
        description: `${updatedProject.name} has been updated successfully`,
      });

    } catch (error) {
      console.error('Error updating project:', error);
      // Revert optimistic update on error
      onProjectUpdate(project);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
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
              disabled={updating}
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
              disabled={updating}
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
                disabled={updating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coPrincipalInvestigator">Co-Principal Investigator (CO-PI)</Label>
              <Input
                id="coPrincipalInvestigator"
                value={formData.coPrincipalInvestigator}
                onChange={(e) => setFormData(prev => ({ ...prev, coPrincipalInvestigator: e.target.value }))}
                placeholder="Enter CO-PI name"
                disabled={updating}
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
              disabled={updating}
            />
          </div>

          <div className="space-y-2">
            <Label>Organizations</Label>
            <div className="flex gap-2">
              <Input
                value={formData.newOrganization}
                onChange={(e) => setFormData(prev => ({ ...prev, newOrganization: e.target.value }))}
                placeholder="Enter organization name"
                disabled={updating}
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
                disabled={updating || !formData.newOrganization.trim()}
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
                disabled={updating}
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
                disabled={updating}
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
                disabled={updating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={updating}
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
              disabled={updating}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamMembers">Team Members (Automatic Count)</Label>
              <p className="text-sm text-muted-foreground">
                {formData.selectedTeamMembers.length} team member(s) selected
              </p>
            </div>
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
                        disabled={updating}
                      />
                      <Label htmlFor={member.id} className="text-sm font-normal cursor-pointer">
                        {member.name} - {member.role}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {formData.selectedTeamMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.selectedTeamMembers.map((memberId, idx) => {
                  const member = teamMembers.find(m => m.id === memberId);
                  return (
                    <div key={idx} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      <span>{member ? `${member.name}${member.email ? ` (${member.email})` : ''}` : memberId}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          selectedTeamMembers: prev.selectedTeamMembers.filter((_, i) => i !== idx)
                        }))}
                        className="ml-1 hover:text-red-600"
                        aria-label={`Remove ${member ? member.name : memberId}`}
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? "Updating..." : "Update Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
