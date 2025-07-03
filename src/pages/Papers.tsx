
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { ResearchPapersList } from "@/components/papers/ResearchPapersList";
import { AddPaperDialog } from "@/components/papers/AddPaperDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, MessageSquare, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPapers } from "@/services/papers/papersService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaperFilters } from "@/components/papers/PaperFilters";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ResearchCommentsSection } from "@/components/collaboration/ResearchCommentsSection";

const Papers = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [commentsSectionKey, setCommentsSectionKey] = useState(Date.now().toString());

  // Handle tab change to ensure components are refreshed when selected
  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    setActiveTab(value);
    
    // Force re-render of comments section when collaboration tab is selected
    if (value === "collaboration") {
      setCommentsSectionKey(Date.now().toString());
    }
  };

  const { data: papers = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["papers"],
    queryFn: getPapers,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Get current user ID
  useEffect(() => {
    const fetchUserData = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data?.user?.id || null);
    };
    
    fetchUserData();
  }, []);

  const filteredPapers = selectedCategory 
    ? papers.filter((paper) => paper.categories?.includes(selectedCategory))
    : papers;

  const handlePaperAdded = async () => {
    toast({
      title: "Refreshing papers list",
      description: "Updating the repository with your new paper...",
    });
    await refetch();
  };

  // Generate loading skeletons
  const renderSkeletons = (count = 4) => (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full" />
        </Card>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Research Papers Repository</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="transition-all duration-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              size="sm"
              disabled={isFetching}
              className="transition-all duration-200"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add Paper
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="animate-fade-in">
            <PaperFilters 
              onCategorySelect={setSelectedCategory} 
              selectedCategory={selectedCategory}
              onClearFilters={() => setSelectedCategory(null)}
            />
          </div>
        )}

        <Tabs defaultValue="all" className="mt-6" value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Papers</TabsTrigger>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
            <TabsTrigger value="my">My Uploads</TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Research Collaboration
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4 animate-fade-in">
            {isLoading ? renderSkeletons() : (
              <ResearchPapersList papers={filteredPapers} />
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="mt-4 animate-fade-in">
            {isLoading ? renderSkeletons(2) : (
              <ResearchPapersList 
                papers={filteredPapers
                  .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                  .slice(0, 6)} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="my" className="mt-4 animate-fade-in">
            {isLoading ? renderSkeletons(2) : (
              <ResearchPapersList 
                papers={filteredPapers.filter(paper => paper.created_by === currentUserId)} 
                emptyMessage="You haven't uploaded any papers yet."
              />
            )}
          </TabsContent>

          <TabsContent value="collaboration" className="mt-4 animate-fade-in">
            <ResearchCommentsSection key={commentsSectionKey} />
          </TabsContent>
        </Tabs>
        
        <AddPaperDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
          onPaperAdded={handlePaperAdded} 
        />
      </PageContainer>
    </MainLayout>
  );
};

export default Papers;
