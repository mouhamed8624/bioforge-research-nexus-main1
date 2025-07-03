
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-hexagon-pattern">
      <div className="text-center max-w-lg mx-auto px-4">
        <div className="mb-8">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-600 to-cigass-500 mx-auto animate-pulse-glow"></div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-cigass-400 to-teal-400 text-transparent bg-clip-text mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          The research module you're looking for may have been moved or doesn't exist in this system.
        </p>
        <Link to="/">
          <Button className="bg-gradient-to-r from-purple-500 to-cigass-500 hover:from-purple-600 hover:to-cigass-600">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
