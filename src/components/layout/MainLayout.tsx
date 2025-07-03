
import { ReactNode, useEffect, useState } from "react";
import { Header } from "./Header";
import Sidebar from "./Sidebar"; 
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Track sidebar state to adjust main content
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Add event listener to detect sidebar state changes
  useEffect(() => {
    // Create a mutation observer to detect changes to the sidebar width
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof HTMLElement) {
          const sidebarEl = mutation.target as HTMLElement;
          // Check if the sidebar width is 4rem (64px) which is the collapsed state (w-16)
          setSidebarCollapsed(sidebarEl.offsetWidth === 64);
        }
      });
    });
    
    // Start observing the sidebar element for attribute changes
    const sidebarEl = document.querySelector('[class*="flex flex-col h-screen bg-sidebar"]');
    if (sidebarEl) {
      observer.observe(sidebarEl, { attributes: true });
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <Sidebar />
      <div 
        className={cn(
          "min-h-screen flex flex-col transition-all duration-300 bg-white",
          // Fixed the spacing issue by adjusting the left padding when sidebar is collapsed
          sidebarCollapsed ? "pl-16" : "pl-16 md:pl-64"
        )}
      >
        <Header />
        <main className="flex-1 w-full p-6 bg-white">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        
        {/* Subtle footer with gradient line */}
        <footer className="py-4 px-6 text-center text-xs text-muted-foreground bg-white">
          <div className="h-[1px] w-full max-w-md mx-auto mb-4 bg-gradient-to-r from-transparent via-purple-200 to-transparent"></div>
          <p>CIGASS • Advanced Research Platform © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
