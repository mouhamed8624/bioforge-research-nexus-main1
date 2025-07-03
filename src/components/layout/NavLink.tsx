
import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "@/hooks/use-pathname";

interface NavLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
}

export function NavLink({ to, icon, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
      )}
    >
      <div className="text-current">{icon}</div>
      <span className="text-current">{label}</span>
    </Link>
  );
}
