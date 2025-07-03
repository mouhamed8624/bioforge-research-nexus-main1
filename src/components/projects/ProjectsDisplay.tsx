import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen, 
  Calendar, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  DollarSign,
  User
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { EditProjectDialog } from "./EditProjectDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  team?: string[];
}

// Define budget interface to safely handle Json type
interface ProjectBudget {
  used?: number;
  total?: number;
  progress?: number;
  [key: string]: any;
}

const getStatusColor = (status: Project["status"]) => {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "paused": return "bg-yellow-100 text-yellow-800";
    case "completed": return "bg-blue-100 text-blue-800";
    case "draft": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: Project["status"]) => {
  switch (status) {
    case "active": return <PlayCircle className="h-4 w-4" />;
    case "paused": return <PauseCircle className="h-4 w-4" />;
    case "completed": return <CheckCircle2 className="h-4 w-4" />;
    case "draft": return <Edit className="h-4 w-4" />;
    default: return <FolderOpen className="h-4 w-4" />;
  }
};

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export function ProjectsDisplay() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState<Set<string>>(new Set());
  const { userProfile } = useAuth();

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log('Fetching projects from Supabase...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        });
        return;
      }

      // Transform database projects to match UI interface
      const transformedProjects: Project[] = (data || []).map(project => {
        console.log('Processing project from database:', project);
        
        // Ensure we use the proper UUID from the database
        if (!project.id || !isValidUUID(project.id)) {
          console.error('Invalid project ID from database:', project.id);
          return null;
        }

        // Safely extract progress and budget from budget
        let progress = 0;
        let budget = undefined;
        if (project.budget && typeof project.budget === 'object' && !Array.isArray(project.budget)) {
          const budgetObj = project.budget as ProjectBudget;
          progress = budgetObj.progress || 0;
          budget = {
            total: budgetObj.total || 0,
            used: budgetObj.used || 0,
            progress: budgetObj.progress || 0
          };
        }

        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          status: project.status as Project["status"],
          startDate: project.created_at,
          teamMembers: Array.isArray(project.team) ? project.team.length : 0,
          progress: progress,
          budget: budget,
          principal_investigator: project.principal_investigator,
          co_principal_investigator: project.co_principal_investigator,
          team: Array.isArray(project.team) ? project.team : []
        };
      }).filter(Boolean) as Project[];

      console.log('Successfully fetched and transformed projects:', transformedProjects.length);
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = () => {
    console.log("Creating new project...");
    setShowCreateDialog(true);
  };

  const handleProjectCreate = (newProject: Project) => {
    console.log('Adding new project to state:', newProject);
    
    // Validate the new project has a proper UUID
    if (!newProject.id || !isValidUUID(newProject.id)) {
      console.error('Invalid project ID received from creation:', newProject.id);
      toast({
        title: "Error",
        description: "Invalid project ID format",
        variant: "destructive",
      });
      return;
    }

    setProjects(prev => [newProject, ...prev]);
    toast({
      title: "Success",
      description: `Project "${newProject.name}" has been created successfully`,
    });
  };

  const handleEditProject = (project: Project) => {
    console.log("Editing project:", project.name);
    setProjectToEdit(project);
    setShowEditDialog(true);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(p => 
        p.id === updatedProject.id 
          ? updatedProject
          : p
      )
    );
    
    // Update selected project if it's the one being edited
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    console.log('Delete button clicked for project ID:', projectId, typeof projectId);
    
    // Validate that projectId is a valid UUID
    if (!projectId || typeof projectId !== 'string' || !isValidUUID(projectId)) {
      console.error('Invalid project ID for deletion:', projectId);
      toast({
        title: "Error",
        description: "Invalid project ID format",
        variant: "destructive",
      });
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive",
      });
      return;
    }
    
    if (operationInProgress.has(projectId)) {
      console.log('Operation already in progress for project:', projectId);
      return;
    }

    // Add to in-progress operations
    setOperationInProgress(prev => new Set(prev).add(projectId));
    
    // Optimistically update UI immediately
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // Close details if the deleted project was selected
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }
    
    try {
      console.log('Deleting project:', project.name, 'with ID:', projectId);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) {
        console.error('Supabase deletion error:', error);
        // Revert optimistic update on error
        setProjects(prev => [project, ...prev].sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        ));
        toast({
          title: "Error",
          description: `Failed to delete project: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Project successfully deleted from database');
      
      toast({
        title: "Project Deleted",
        description: `${project.name} has been deleted successfully`,
        variant: "destructive",
      });

      console.log('Local state updated, project removed from UI');
      
    } catch (error) {
      console.error('Error deleting project:', error);
      // Revert optimistic update on error
      setProjects(prev => [project, ...prev].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      ));
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      // Remove from in-progress operations
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const handleViewProject = (project: Project) => {
    console.log("Viewing project details:", project.name);
    setSelectedProject(project);
    toast({
      title: "Project Details",
      description: `Viewing details for ${project.name}`,
    });
  };

  const handleStatusChange = async (projectId: string, newStatus: Project["status"]) => {
    console.log('Status change requested for project ID:', projectId, 'type:', typeof projectId, 'new status:', newStatus);
    
    // Validate that projectId is a valid UUID
    if (!projectId || typeof projectId !== 'string' || !isValidUUID(projectId)) {
      console.error('Invalid project ID for status update:', projectId);
      toast({
        title: "Error",
        description: "Invalid project ID format",
        variant: "destructive",
      });
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found for status update:', projectId);
      toast({
        title: "Error",
        description: "Project not found",
        variant: "destructive",
      });
      return;
    }

    if (operationInProgress.has(projectId)) {
      console.log('Operation already in progress for project:', projectId);
      return;
    }
    
    // Add to in-progress operations
    setOperationInProgress(prev => new Set(prev).add(projectId));
    
    // Optimistically update UI immediately
    setProjects(prev => 
      prev.map(p => 
        p.id === projectId 
          ? { ...p, status: newStatus }
          : p
      )
    );

    // Update selected project if it's the one being updated
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null);
    }
    
    try {
      console.log('Updating project status in database:', projectId, 'to:', newStatus);
      
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      
      if (error) {
        console.error('Error updating project status:', error);
        // Revert optimistic update on error
        setProjects(prev => 
          prev.map(p => 
            p.id === projectId 
              ? { ...p, status: project.status }
              : p
          )
        );
        if (selectedProject?.id === projectId) {
          setSelectedProject(prev => prev ? { ...prev, status: project.status } : null);
        }
        toast({
          title: "Error",
          description: `Failed to update project status: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Project status updated successfully in database');
      
      toast({
        title: "Status Updated",
        description: `${project.name} status changed to ${newStatus}`,
      });
      
    } catch (error) {
      console.error('Error updating project status:', error);
      // Revert optimistic update on error
      setProjects(prev => 
        prev.map(p => 
          p.id === projectId 
            ? { ...p, status: project.status }
            : p
        )
      );
      if (selectedProject?.id === projectId) {
        setSelectedProject(prev => prev ? { ...prev, status: project.status } : null);
      }
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      });
    } finally {
      // Remove from in-progress operations
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Research Projects</h2>
          {userProfile?.role !== 'manager' && (
            <Button onClick={handleCreateProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
        <div className="text-center py-8">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Research Projects</h2>
        {userProfile?.role !== 'manager' && (
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No projects found. Create your first project!</p>
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(project.status)} flex items-center gap-1`}
                  >
                    {getStatusIcon(project.status)}
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleViewProject(project);
                      }}
                      className="h-8 w-8"
                      title="View project details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditProject(project);
                      }}
                      className="h-8 w-8"
                      title="Edit project"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      title="Delete project"
                      disabled={operationInProgress.has(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="text-sm">
                  {project.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Project Info */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{project.teamMembers} team members</span>
                  </div>
                  {project.budget && userProfile?.role === 'president' && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Budget: ${project.budget.total.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {project.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(project.id, "paused")}
                      className="flex-1"
                      disabled={operationInProgress.has(project.id)}
                    >
                      <PauseCircle className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  {project.status === "paused" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(project.id, "active")}
                      className="flex-1"
                      disabled={operationInProgress.has(project.id)}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  {project.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(project.id, "active")}
                      className="flex-1"
                      disabled={operationInProgress.has(project.id)}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {(project.status === "active" || project.status === "paused") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(project.id, "completed")}
                      className="flex-1"
                      disabled={operationInProgress.has(project.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Enhanced Selected Project Details */}
      {selectedProject && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Project Details: {selectedProject.name}</CardTitle>
            <CardDescription>
              Comprehensive view of {selectedProject.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedProject.description || "No description provided"}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Timeline</h4>
                <p className="text-sm text-muted-foreground">
                  Started: {new Date(selectedProject.startDate).toLocaleDateString()}
                  {selectedProject.endDate && (
                    <span> - Expected End: {new Date(selectedProject.endDate).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Team</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProject.teamMembers} active team members
                </p>
                {selectedProject.team && selectedProject.team.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Team members:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {selectedProject.team.map((member, index) => (
                        <li key={index}>{member}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Progress & Budget</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProject.progress}% completed
                </p>
                {selectedProject.budget && userProfile?.role === 'president' && (
                  <p className="text-sm text-muted-foreground">
                    Budget: ${selectedProject.budget.total.toLocaleString()} 
                    (Used: ${selectedProject.budget.used.toLocaleString()})
                  </p>
                )}
              </div>
              
              {selectedProject.principal_investigator && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Principal Investigator
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedProject.principal_investigator}</p>
                </div>
              )}
              
              {selectedProject.co_principal_investigator && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Co-Principal Investigator
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedProject.co_principal_investigator}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedProject(null)}
              >
                Close Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Project Dialog */}
      {userProfile?.role !== 'manager' && (
        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onProjectCreate={handleProjectCreate}
        />
      )}

      {/* Edit Project Dialog */}
      <EditProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        project={projectToEdit}
        onProjectUpdate={handleProjectUpdate}
      />
    </div>
  );
}
