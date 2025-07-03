
import { ReactNode } from "react";

interface NavSectionProps {
  title?: string;
  children: ReactNode;
}

export function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="py-2">
      {title && <h3 className="px-3 text-xs font-semibold text-muted-foreground mb-2">{title}</h3>}
      <nav className="space-y-1">{children}</nav>
    </div>
  );
}
