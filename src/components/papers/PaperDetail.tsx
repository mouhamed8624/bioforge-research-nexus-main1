
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getPaperById, 
  deletePaper, 
  getPaperFileUrl,
  getPaperProjects
} from "@/services/papers/papersService";
import { ResearchPaper } from "@/services/papers/types";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Calendar, 
  BookOpen, 
  Download, 
  ArrowLeft, 
  Trash2, 
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LinkProjectDialog } from "./LinkProjectDialog";
import { ResearchCommentsSection } from "@/components/collaboration/ResearchCommentsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<ResearchPaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isLinkProjectOpen, setIsLinkProjectOpen] = useState(false);
  const [paperFileUrl, setPaperFileUrl] = useState<string | null>(null);
  const [linkedProjects, setLinkedProjects] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  
  const fetchPaperData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const paperData = await getPaperById(id);
      if (paperData) {
        setPaper(paperData);
        
        // Fetch linked projects
        const projectIds = await getPaperProjects(id);
        setLinkedProjects(projectIds);
        
        // If there's a file path, get the URL
        if (paperData.file_path) {
          const url = await getPaperFileUrl(paperData.file_path);
          setPaperFileUrl(url);
        }
      } else {
        toast({
          title: "Paper not found",
          description: "The requested paper could not be found.",
        });
        navigate("/papers");
      }
    } catch (error) {
      console.error("Error fetching paper details:", error);
      toast({
        title: "Error",
        description: "Failed to load paper details.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPaperData();
  }, [id, navigate]);
  
  const handleBack = () => {
    navigate("/papers");
  };
  
  const handleDeletePaper = async () => {
    if (!id) return;
    
    try {
      const success = await deletePaper(id);
      if (success) {
        navigate("/papers");
      }
    } catch (error) {
      console.error("Error deleting paper:", error);
      toast({
        title: "Error",
        description: "Failed to delete paper.",
      });
    } finally {
      setConfirmDelete(false);
    }
  };
  
  const handleDownload = async () => {
    if (!paper?.file_path) return;
    
    setIsDownloading(true);
    try {
      const url = await getPaperFileUrl(paper.file_path);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Failed to generate download link.",
        });
      }
    } catch (error) {
      console.error("Error downloading paper:", error);
      toast({
        title: "Error",
        description: "Failed to download paper.",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleProjectLinkSuccess = () => {
    toast({
      title: "Success",
      description: "Paper linked to project successfully.",
    });
    fetchPaperData(); // Refresh data to update linked projects
  };
  
  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    setActiveTab(value);
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Papers
            </Button>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-40 bg-muted rounded w-full"></div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }
  
  if (!paper) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Papers
            </Button>
          </div>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Paper Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The requested paper could not be found or may have been deleted.
            </p>
            <Button onClick={handleBack}>Return to Repository</Button>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <MainLayout>
      <PageContainer>
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Papers
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Paper
          </Button>
        </div>
        
        <div className="grid gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{paper.title}</h1>
            <p className="text-muted-foreground mb-4">
              {paper.authors?.join(', ') || 'Unknown authors'}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {paper.categories?.map((category, idx) => (
                <Badge key={idx} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
            
            <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
              <TabsList>
                <TabsTrigger value="details">Paper Details</TabsTrigger>
                <TabsTrigger value="discussion" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Discussion
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {paper.publication_date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Published: {formatDate(paper.publication_date)}</span>
                    </div>
                  )}
                  
                  {paper.journal && (
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Journal: {paper.journal}</span>
                    </div>
                  )}
                </div>
                
                {paper.abstract && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Abstract</h2>
                    <p className="text-muted-foreground">{paper.abstract}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {paper.file_path && (
                    <Button onClick={handleDownload} disabled={isDownloading}>
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? "Preparing..." : "Download Paper"}
                    </Button>
                  )}
                  
                  {paper.doi && (
                    <Button variant="outline" onClick={() => window.open(`https://doi.org/${paper.doi}`, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View DOI: {paper.doi}
                    </Button>
                  )}
                </div>
                
                {linkedProjects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-2">Linked Projects</h3>
                    <div className="flex flex-wrap gap-2">
                      {linkedProjects.map((projectId) => (
                        <Badge key={projectId} variant="outline" className="bg-blue-50">
                          {projectId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {paper.keywords && paper.keywords.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {paper.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="discussion" className="mt-4">
                <ResearchCommentsSection key={`discussion-${activeTab}`} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this paper?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the paper
                and all associated comments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePaper} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {id && (
          <LinkProjectDialog 
            open={isLinkProjectOpen} 
            onOpenChange={setIsLinkProjectOpen}
            paperId={id}
            onSuccess={handleProjectLinkSuccess}
          />
        )}
      </PageContainer>
    </MainLayout>
  );
}
