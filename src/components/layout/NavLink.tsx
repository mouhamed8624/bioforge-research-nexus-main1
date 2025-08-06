
import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "@/hooks/use-pathname";
import { useNotifications } from "@/contexts/NotificationContext";

interface NavLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
}

export function NavLink({ to, icon, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === to;
  const { unreadTodosCount, incompleteTodosCount } = useNotifications();
  
  // Check if this is the todo-list link and if there are unread todos
  const showRedNotification = to === "/todo-list" && unreadTodosCount > 0;
  // Check if this is the todo-list link and if there are incomplete todos
  const showYellowNotification = to === "/todo-list" && incompleteTodosCount > 0;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
      )}
    >
      <div className="text-current relative">
        {icon}
        {showRedNotification && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
        {showYellowNotification && !showRedNotification && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" />
        )}
      </div>
      <span className="text-current">{label}</span>
    </Link>
  );
}
