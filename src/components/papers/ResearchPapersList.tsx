
import { ResearchPaper } from "@/services/papers/papersService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getPaperFileUrl } from "@/services/papers/papersService";

interface ResearchPapersListProps {
  papers: ResearchPaper[];
  emptyMessage?: string;
}

export function ResearchPapersList({ papers, emptyMessage = "No papers found." }: ResearchPapersListProps) {
  const navigate = useNavigate();
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  
  if (papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const handleViewPaper = (paperId: string) => {
    navigate(`/papers/${paperId}`);
  };

  const handleDownloadPaper = async (paper: ResearchPaper) => {
    if (!paper.file_url) return;
    
    setLoadingFileId(paper.id);
    
    try {
      const url = await getPaperFileUrl(paper.file_url);
      
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Error downloading paper:", error);
    } finally {
      setLoadingFileId(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {papers.map((paper) => (
        <Card key={paper.id} className="overflow-hidden transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="line-clamp-2 text-lg">{paper.title}</CardTitle>
            <CardDescription className="line-clamp-1">
              {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors || 'Unknown authors'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {paper.abstract && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {paper.abstract}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mb-2">
              {paper.categories?.slice(0, 3).map((category, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {paper.categories && paper.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{paper.categories.length - 3}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3" />
              {formatDate(paper.created_at)}
            </div>
          </CardContent>
          <CardFooter className="pt-2 flex justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => handleViewPaper(paper.id)}
            >
              View Details
            </Button>
            {paper.file_url && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                disabled={loadingFileId === paper.id}
                onClick={() => handleDownloadPaper(paper)}
              >
                <Download className="h-3 w-3 mr-1" />
                {loadingFileId === paper.id ? 'Loading...' : 'Download'}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
