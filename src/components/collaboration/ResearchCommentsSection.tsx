
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, RefreshCw, User, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Comment = {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  dataset_id: string | null;
};

export function ResearchCommentsSection() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [lastFetched, setLastFetched] = useState<number>(0);

  // Clear deleted comments when navigating to this page
  useEffect(() => {
    // Reset comment deletion tracking on page load to prevent issues with deleted comment persistence
    localStorage.removeItem('deletedCommentIds');
  }, []);

  // Fetch comments on component mount and set up real-time subscription
  useEffect(() => {
    console.log("ResearchCommentsSection mounted, fetching comments");
    fetchComments();
    
    // Set up real-time listener for comments
    const channel = supabase
      .channel('research-comments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'research_comments'
        },
        (payload) => {
          console.log('New comment added:', payload);
          
          // Add the new comment to our state
          if (payload.new) {
            const newComment = payload.new as Comment;
            setComments(prev => [newComment, ...prev]);
            
            // Show toast for new comments from other users
            if (newComment.author_name !== currentUser?.email) {
              toast({
                title: "New Comment",
                description: `${newComment.author_name} added a new comment`
              });
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log("ResearchCommentsSection unmounting, removing channel");
      supabase.removeChannel(channel);
    };
  }, [currentUser?.email]);

  // This effect will re-fetch comments when the component is shown again
  // after changing tabs and coming back
  useEffect(() => {
    // When component becomes visible again after tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Tab is now visible, refreshing comments");
        fetchComments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch all comments from the database
  const fetchComments = async () => {
    setIsLoading(true);
    const now = Date.now();
    setLastFetched(now);
    console.log("Fetching comments at:", new Date(now).toISOString());
    
    try {
      const { data, error } = await supabase
        .from('research_comments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log("Fetched comments:", data?.length);
      setComments(data || []);
      
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Post a new comment
  const postComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please login to post a comment",
        variant: "destructive"
      });
      return;
    }
    
    setIsPosting(true);
    
    try {
      const { data, error } = await supabase
        .from('research_comments')
        .insert({
          content: newComment,
          author_name: currentUser.email || "Anonymous User",
          dataset_id: null // Optional reference to specific dataset
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Clear the input field
      setNewComment('');
      
      toast({
        title: "Comment Posted",
        description: "Your comment has been added to the discussion"
      });
      
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Generate avatar initials from name
  const getInitials = (name: string) => {
    return name
      .split('@')[0] // Get the part before the @ symbol for email addresses
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-400" />
          Research Discussion
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={fetchComments}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Comment input form */}
        <div className="mb-6">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {currentUser ? getInitials(currentUser.email || "") : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                className="w-full rounded-lg border border-border p-3 min-h-[100px] bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Share your thoughts or feedback on this research..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isPosting || !currentUser}
              ></textarea>
              <div className="mt-2 flex justify-end">
                <Button
                  className="bg-gradient-to-r from-purple-500 to-cigass-500 hover:from-purple-600 hover:to-cigass-600"
                  onClick={postComment}
                  disabled={!newComment.trim() || isPosting || !currentUser}
                >
                  {isPosting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {isLoading && comments.length === 0 ? (
            <div className="text-center py-10">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="h-16 w-16 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground">Be the first to start the discussion!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {getInitials(comment.author_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{comment.author_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(comment.created_at)}
                    </div>
                  </div>
                  <div className="mt-1 text-sm whitespace-pre-line">{comment.content}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {comments.length > 5 && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={fetchComments} disabled={isLoading}>
              {isLoading ? "Loading..." : "Load More Comments"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
