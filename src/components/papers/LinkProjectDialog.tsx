
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { linkPaperToProject } from "@/services/papers/papersService";
import { supabase } from "@/integrations/supabase/client";

interface LinkProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  onSuccess?: () => void;
}

export function LinkProjectDialog({ open, onOpenChange, paperId, onSuccess }: LinkProjectDialogProps) {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load projects.",
        });
      }
    };
    
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedProject) {
      toast({
        title: "Selection required",
        description: "Please select a project.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await linkPaperToProject(paperId, selectedProject);
      if (success) {
        toast({
          title: "Success",
          description: "Paper linked to project successfully.",
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Error",
          description: "Failed to link paper to project.",
        });
      }
    } catch (error) {
      console.error("Error linking paper to project:", error);
      toast({
        title: "Error",
        description: "Failed to link paper to project.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Paper to Project</DialogTitle>
          <DialogDescription>
            Select a project to link this research paper to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select 
            onValueChange={setSelectedProject}
            value={selectedProject || undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedProject}>
            {isLoading ? "Linking..." : "Link Paper"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
