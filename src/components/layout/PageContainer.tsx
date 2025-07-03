
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function PageContainer({ children, title, subtitle }: PageContainerProps) {
  return (
    <div className="flex flex-col">
      {(title || subtitle) && (
        <div className="mb-8">
          {title && (
            <h1 className="text-3xl font-bold tracking-tight relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-purple-400 to-teal-400">
                {title}
              </span>
              <div className="absolute -bottom-2 left-0 h-1 w-12 bg-gradient-to-r from-purple-600 to-teal-400 rounded-full"></div>
            </h1>
          )}
          {subtitle && (
            <p className="text-muted-foreground mt-3 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="space-y-8">
        {children}
      </div>
    </div>
  );
}
