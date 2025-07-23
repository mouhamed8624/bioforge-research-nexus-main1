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
  User,
  BookOpen,
  BarChart3,
  Clock
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
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState<Set<string>>(new Set());
  const { userProfile } = useAuth();
  const [allTodos, setAllTodos] = useState<any[]>([]);

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

  // Fetch all todos from localStorage when Project Details modal is opened
  useEffect(() => {
    if (selectedProject) {
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) {
        try {
          setAllTodos(JSON.parse(savedTodos));
        } catch {
          setAllTodos([]);
        }
      } else {
        setAllTodos([]);
      }
    }
  }, [selectedProject]);

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
    setShowProjectDetails(true);
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
      
      // Add timeout and better error handling
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - check your internet connection')), 10000)
      );
      
      const updatePromise = supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      
      const { error } = await Promise.race([updatePromise, timeoutPromise]);
      
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
        
        let errorMessage = "Failed to update project status";
        if (error.message.includes('fetch')) {
          errorMessage = "Network error - check your internet connection";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out - please try again";
        } else if (error.code) {
          errorMessage = `Database error: ${error.message}`;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Project status updated successfully in database');
      
      toast({
        title: "Status Updated",
        description: `${project.name} status changed to ${newStatus}`,
      });
      
    } catch (error: any) {
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
      
      let errorMessage = "Failed to update project status";
      if (error?.message?.includes('timeout')) {
        errorMessage = "Request timed out - check your internet connection";
      } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Load failed')) {
        errorMessage = "Network error - check your internet connection and try again";
      } else if (error?.name === 'TypeError') {
        errorMessage = "Connection error - please check your internet connection";
      }
      
      toast({
        title: "Error", 
        description: errorMessage,
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
                      disabled={operationInProgress.has(project.id)}
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                <CardDescription className="line-clamp-3 text-sm">
                  {project.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Principal Investigators */}
                {(project.principal_investigator || project.co_principal_investigator) && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Investigators</h4>
                    <div className="space-y-1">
                      {project.principal_investigator && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">PI:</span>
                          <span>{project.principal_investigator}</span>
                        </div>
                      )}
                      {project.co_principal_investigator && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Co-PI:</span>
                          <span>{project.co_principal_investigator}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Information */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Team</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {project.teamMembers} member{project.teamMembers !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Team Members List */}
                {project.team && project.team.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {project.team.slice(0, 3).map((member, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                      {project.team.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.team.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Budget Information */}
                {project.budget && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Budget</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ${project.budget.used.toLocaleString()} / ${project.budget.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          project.budget.progress > 90 ? 'bg-red-500' : 
                          project.budget.progress > 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(project.budget.progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.budget.progress.toFixed(1)}% used</span>
                      <span>${(project.budget.total - project.budget.used).toLocaleString()} remaining</span>
                    </div>
                  </div>
                )}

                {/* Project Timeline */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Timeline</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Started: {new Date(project.startDate).toLocaleDateString()}</div>
                    {project.endDate && (
                      <div>End: {new Date(project.endDate).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStatusChange(project.id, 
                        project.status === 'active' ? 'paused' : 
                        project.status === 'paused' ? 'active' : 'active'
                      );
                    }}
                    disabled={operationInProgress.has(project.id)}
                    className="flex-1"
                  >
                    {project.status === 'active' ? (
                      <>
                        <PauseCircle className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-1" />
                        {project.status === 'paused' ? 'Resume' : 'Start'}
                      </>
                    )}
                  </Button>
                  
                  {project.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStatusChange(project.id, 'completed');
                      }}
                      disabled={operationInProgress.has(project.id)}
                      className="flex-1"
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

      {/* Enhanced Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <FolderOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(selectedProject.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(selectedProject.status)}
                        {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                      </Badge>
                      <span className="text-white/80">•</span>
                      <span className="text-white/80">{selectedProject.progress}% Complete</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedProject(null)}
                  className="text-white hover:bg-white/20"
                >
                  <Plus className="h-6 w-6 rotate-45" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Project Overview */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Project Overview
                    </h2>
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-sm text-muted-foreground mb-2">Description</h3>
                            <p className="text-sm leading-relaxed">
                              {selectedProject.description || "No description provided for this project."}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-medium text-sm text-muted-foreground mb-2">Start Date</h3>
                              <p className="text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                {new Date(selectedProject.startDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            {selectedProject.endDate && (
                              <div>
                                <h3 className="font-medium text-sm text-muted-foreground mb-2">Expected End Date</h3>
                                <p className="text-sm flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-red-600" />
                                  {new Date(selectedProject.endDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress Tracking */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Progress Tracking
                    </h2>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Progress Tracking
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Project Duration</span>
                            <span className="font-medium">
                              {Math.ceil((new Date().getTime() - new Date(selectedProject.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Team Size</span>
                            <span className="font-medium">{selectedProject.teamMembers} members</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant="outline" className={getStatusColor(selectedProject.status)}>
                              {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                            </Badge>
                          </div>
                          {/* Progress Breakdown Table */}
                          <div className="mt-6">
                            <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Progress Breakdown
                            </h4>
                            {allTodos.filter(todo => todo.project_id === selectedProject.id && todo.completed).length === 0 ? (
                              <div className="text-muted-foreground text-sm">No completed to-dos for this project yet.</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="min-w-full border text-sm rounded-xl overflow-hidden">
                                  <thead>
                                    <tr className="bg-blue-50 text-blue-900">
                                      <th className="px-4 py-2 border font-semibold">Task</th>
                                      <th className="px-4 py-2 border font-semibold">Who</th>
                                      <th className="px-4 py-2 border font-semibold">Progress Added (%)</th>
                                      <th className="px-4 py-2 border font-semibold">Completed At</th>
                                      <th className="px-4 py-2 border font-semibold">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {allTodos.filter(todo => todo.project_id === selectedProject.id && todo.completed)
                                      .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
                                      .map((todo, idx) => {
                                        const isLate = todo.deadline && todo.completed_at && new Date(todo.completed_at) > new Date(todo.deadline);
                                        return (
                                          <tr key={todo.id || idx} className="even:bg-gray-50">
                                            <td className="px-4 py-2 border font-medium text-gray-900">{todo.task}</td>
                                            <td className="px-4 py-2 border text-blue-700 font-semibold">{todo.completed_by || '—'}</td>
                                            <td className="px-4 py-2 border text-center text-purple-700 font-semibold">{todo.percentage}</td>
                                            <td className="px-4 py-2 border text-center text-gray-700">{todo.completed_at ? new Date(todo.completed_at).toLocaleString() : '—'}</td>
                                            <td className="px-4 py-2 border text-center">
                                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${isLate ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {isLate ? 'Late' : 'On Time'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                          {/* End Progress Breakdown Table */}
                          {selectedProject.budget && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Budget</span>
                                <span className="font-medium">${selectedProject.budget.total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Budget Used</span>
                                <span className="font-medium">${selectedProject.budget.used.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Remaining</span>
                                <span className="font-medium text-green-600">
                                  ${(selectedProject.budget.total - selectedProject.budget.used).toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Team Management */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Team Management
                    </h2>
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {/* Investigators */}
                          {(selectedProject.principal_investigator || selectedProject.co_principal_investigator) && (
                            <div>
                              <h3 className="font-medium mb-4">Project Leaders</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedProject.principal_investigator && (
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="bg-blue-600 p-2 rounded-full">
                                        <User className="h-4 w-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-blue-900">Principal Investigator</p>
                                        <p className="text-blue-700">{selectedProject.principal_investigator}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {selectedProject.co_principal_investigator && (
                                  <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="bg-green-600 p-2 rounded-full">
                                        <User className="h-4 w-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-green-900">Co-Principal Investigator</p>
                                        <p className="text-green-700">{selectedProject.co_principal_investigator}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Team Members */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-medium">Team Members</h3>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {selectedProject.teamMembers} member{selectedProject.teamMembers !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {selectedProject.team && selectedProject.team.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {selectedProject.team.map((member, index) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <div className="bg-gray-400 w-8 h-8 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                          {member.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </span>
                                      </div>
                                      <span className="text-sm font-medium text-gray-700">{member}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">No team members assigned yet.</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PlayCircle className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => {
                          handleStatusChange(selectedProject.id, 
                            selectedProject.status === 'active' ? 'paused' : 
                            selectedProject.status === 'paused' ? 'active' : 'active'
                          );
                        }}
                        disabled={operationInProgress.has(selectedProject.id)}
                        className="w-full"
                        variant={selectedProject.status === 'active' ? 'destructive' : 'default'}
                      >
                        {selectedProject.status === 'active' ? (
                          <>
                            <PauseCircle className="h-4 w-4 mr-2" />
                            Pause Project
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            {selectedProject.status === 'paused' ? 'Resume Project' : 'Start Project'}
                          </>
                        )}
                      </Button>
                      
                      {selectedProject.status !== 'completed' && (
                        <Button
                          onClick={() => handleStatusChange(selectedProject.id, 'completed')}
                          disabled={operationInProgress.has(selectedProject.id)}
                          className="w-full"
                          variant="outline"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          handleEditProject(selectedProject);
                          setSelectedProject(null);
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Project Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Project Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Project Duration</span>
                          <span className="font-medium">
                            {Math.ceil((new Date().getTime() - new Date(selectedProject.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Team Size</span>
                          <span className="font-medium">{selectedProject.teamMembers} members</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant="outline" className={getStatusColor(selectedProject.status)}>
                            {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                          </Badge>
                        </div>

                        {selectedProject.budget && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Total Budget</span>
                              <span className="font-medium">${selectedProject.budget.total.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Budget Used</span>
                              <span className="font-medium">${selectedProject.budget.used.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Remaining</span>
                              <span className="font-medium text-green-600">
                                ${(selectedProject.budget.total - selectedProject.budget.used).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-500 w-3 h-3 rounded-full mt-1"></div>
                          <div>
                            <p className="font-medium text-sm">Project Started</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(selectedProject.startDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-500 w-3 h-3 rounded-full mt-1"></div>
                          <div>
                            <p className="font-medium text-sm">Current Progress</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedProject.progress}% completed
                            </p>
                          </div>
                        </div>
                        
                        {selectedProject.endDate && (
                          <div className="flex items-start gap-3">
                            <div className="bg-orange-500 w-3 h-3 rounded-full mt-1"></div>
                            <div>
                              <p className="font-medium text-sm">Expected End</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(selectedProject.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
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
