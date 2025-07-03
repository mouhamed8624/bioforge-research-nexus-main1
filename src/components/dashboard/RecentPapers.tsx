
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getPapers } from "@/services/papers/papersService";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentPapers() {
  const navigate = useNavigate();
  
  const { data: papers = [], isLoading } = useQuery({
    queryKey: ["dashboardRecentPapers"],
    queryFn: async () => {
      const data = await getPapers();
      return data.slice(0, 5); // Only get the 5 most recent papers
    }
  });
  
  const handleViewPaper = (paperId: string) => {
    navigate(`/papers/${paperId}`);
  };

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-md font-semibold">Recent Research Papers</CardTitle>
          <CardDescription>Latest published papers in the repository</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="rounded-md p-2 bg-primary/10">
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No papers in the repository yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map((paper) => (
              <div key={paper.id} className="flex gap-3 items-start">
                <div className="rounded-md p-2 bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-left text-sm hover:no-underline"
                    onClick={() => handleViewPaper(paper.id)}
                  >
                    {paper.title && paper.title.length > 50 ? `${String(paper.title).substring(0, 50)}...` : String(paper.title || 'Untitled')}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {Array.isArray(paper.authors) 
                      ? paper.authors.slice(0, 2).join(", ") + (paper.authors.length > 2 ? " et al." : "")
                      : String(paper.authors || "Unknown authors")
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
