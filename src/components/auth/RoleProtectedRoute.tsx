import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const ROLE_NAV_CONFIG: Record<string, string[]> = {
  financial: [
    "dashboard",
    "inventory",
    "calendar",
    "reservations",
    "teams",
    "todo-list",
    "button-project"
  ],
  manager: [
    "teams",
    "dashboard",
    "calendar",
    "inventory",
    "todo-list",
    "button-project"
  ],
  general_director: [
    "teams",
    "dashboard",
    "calendar",
    "inventory",
    "todo-list",
    "button-project"
  ],
  lab: [
    "data-visualization",
    "pending-submissions",
    "bio-banks",
    "dashboard",
    "dbs",
    "plaquettes",
    "reservations",
    "patients",
    "todo-list"
  ],
  field: [
    "patients",
    "dashboard"
  ],
  front_desk: [
    "teams",
    "dashboard",
    "todo-list",
    "button-project"
  ],
  president: [
    "dashboard",
    "patients",
    "inventory",
    "papers",
    "bio-banks",
    "dbs",
    "calendar",
    "reservations",
    "finance",
    "teams",
    "settings",
    "data-visualization",
    "pending-submissions",
    "todo-list",
    "button-project"
  ],
  admin: [
    "dashboard",
    "patients",
    "inventory",
    "papers",
    "bio-banks",
    "dbs",
    "calendar",
    "reservations",
    "finance",
    "teams",
    "settings",
    "data-visualization",
    "pending-submissions",
    "todo-list",
    "button-project"
  ]
};

export const RoleProtectedRoute = ({ children, allowedRoles, redirectTo = "/dashboard" }: RoleProtectedRouteProps) => {
  const { userProfile } = useAuth();
  const location = useLocation();
  
  // If no user profile yet, show loading
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  const userRole = userProfile.role;
  
  // If user has no role, allow dashboard access temporarily to prevent infinite redirects
  if (!userRole) {
    const currentPath = location.pathname;
    if (currentPath === "/" || currentPath === "/dashboard") {
      return <>{children}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  // Simplified access check - just check if user's role is in allowed roles
  const hasAccess = allowedRoles.includes(userRole);
  
  // If no access, redirect but prevent infinite redirects
  if (!hasAccess) {
    const currentPath = location.pathname;
    if (currentPath !== redirectTo) {
      return <Navigate to={redirectTo} replace />;
    } else {
      // Already on redirect page, allow access to prevent infinite redirect
      return <>{children}</>;
    }
  }

  return <>{children}</>;
};
