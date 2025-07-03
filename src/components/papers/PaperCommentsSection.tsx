
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PaperComment } from "@/services/papers/types";
import { format } from "date-fns";

interface PaperCommentsSectionProps {
  comments: PaperComment[];
}

export function PaperCommentsSection({ comments }: PaperCommentsSectionProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  // Format the timestamp
  const formatTimestamp = (timestamp: string | null | undefined) => {
    if (!timestamp) return "";
    try {
      return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return timestamp;
    }
  };

  // Get initials for avatar
  const getInitials = (userId: string) => {
    // This is a placeholder. In a real app, you would get the user's name
    return userId.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {getInitials(comment.user_id)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">User {comment.user_id.substring(0, 8)}...</span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(comment.created_at)}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
