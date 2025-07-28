import {
  Layout, 
  Users,
  Package,
  Calendar,
  Clock,
  Coins,
  Users2,
  Settings,
  BarChart3,
  ClipboardCheck,
  BookOpen,
  Beaker,
  Droplets,
  CheckSquare,
  FolderOpen,
  CreditCard,
  Thermometer,
} from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";
import { NavSection } from "@/components/layout/NavSection";
import { useEffect, useState } from "react";
import { usePathname } from "@/hooks/use-pathname";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"; 
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  className?: string;
}

const ROLE_NAV_CONFIG: Record<string, string[]> = {
  financial: [
    "dashboard",
    "inventory",
    "calendar",
    "reservations",
    "teams",
    "finance",
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
    "plaquettes",
    "calendar",
    "reservations",
    "finance",
    "teams",
    "settings",
    "data-visualization",
    "pending-submissions",
    "todo-list",
    "button-project",
    "temp-captors"
  ],
  admin: [
    "dashboard",
    "patients",
    "inventory",
    "papers",
    "bio-banks",
    "dbs",
    "plaquettes",
    "calendar",
    "reservations",
    "finance",
    "teams",
    "settings",
    "data-visualization",
    "pending-submissions",
    "todo-list",
    "button-project",
    "temp-captors"
  ]
};

const NAV_ITEMS = [
  {
    section: null,
    links: [
      { to: "/dashboard", label: "Dashboard", icon: <Layout />, key: "dashboard" },
      { to: "/patients", label: "Patients", icon: <Users />, key: "patients" },
      { to: "/inventory", label: "Inventory", icon: <Package />, key: "inventory" },
      { to: "/papers", label: "Papers", icon: <BookOpen />, key: "papers" },
      { to: "/temp-captors", label: "Temp Captors", icon: <Thermometer />, key: "temp-captors" },
      { to: "/todo-list", label: "Todo List", icon: <CheckSquare />, key: "todo-list" },
      { to: "/button-project", label: "Project", icon: <FolderOpen />, key: "button-project" },
    ]
  },
  {
    section: "Échantillon",
    links: [
      { to: "/bio-banks", label: "Bio Banks", icon: <Beaker />, key: "bio-banks" },
      { to: "/dbs", label: "DBS", icon: <Droplets />, key: "dbs" },
      { to: "/plaquettes", label: "Plaquettes", icon: <CreditCard />, key: "plaquettes" },
    ]
  },
  {
    section: "Schedule",
    links: [
      { to: "/calendar", label: "Calendar", icon: <Calendar />, key: "calendar" },
      { to: "/reservations", label: "Reservations", icon: <Clock />, key: "reservations" },
    ]
  },
  {
    section: "Administration",
    links: [
      { to: "/finance", label: "Finance", icon: <Coins />, key: "finance" },
      { to: "/teams", label: "Teams", icon: <Users2 />, key: "teams" },
      { to: "/settings", label: "Settings", icon: <Settings />, key: "settings" },
    ]
  },
  {
    section: "Analytics",
    links: [
      { to: "/data-visualization", label: "Data Visualization", icon: <BarChart3 />, key: "data-visualization" },
      { to: "/pending-submissions", label: "Pending Submissions", icon: <ClipboardCheck />, key: "pending-submissions" },
    ]
  }
];

const Sidebar = ({ className }: SidebarProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Get the user's role from userProfile
  const userRole = userProfile?.role || null;

  // Get allowed pages for this role
  const allowedKeys = userRole && userRole in ROLE_NAV_CONFIG
    ? ROLE_NAV_CONFIG[userRole]
    : [];

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Helper to check if link is allowed for the user
  const isLinkAllowed = (key: string) => {
    if (!userRole || !allowedKeys.length) return false; // hide all if no role determined
    return allowedKeys.includes(key);
  };

  return (
    <aside className={`${className} ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed left-0 top-0 z-40 h-screen transition-transform md:w-64`}>
      <div className="flex h-full flex-col overflow-y-auto border-r bg-background/40 backdrop-blur-xl px-3 py-4">
        {/* Logo section */}
        <div className="mb-6 flex items-center justify-between pl-2">
          <img 
            src="/cigass-logo.png" 
            alt="CIGASS" 
            className="h-8 w-auto"
          />
          <button
            onClick={toggleSidebar}
            className="focus:shadow-outline rounded-lg focus:outline-none p-2 md:hidden"
          >
            <svg fill="currentColor" viewBox="0 0 20 20" className="h-6 w-6">
              {isOpen ? (
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <div className="space-y-4">
          {NAV_ITEMS.map((section) => {
            const visibleLinks = section.links.filter(link => isLinkAllowed(link.key));
            
            if (visibleLinks.length === 0) {
              return null;
            }
            
            return (
              <NavSection key={section.section || 'main'} title={section.section || undefined}>
                {visibleLinks.map(link => (
                  <NavLink key={link.to} to={link.to} icon={link.icon} label={link.label} />
                ))}
              </NavSection>
            );
          })}
        </div>
        
        {/* User section at bottom */}
        <div className="mt-auto pt-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-8 w-full items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{currentUser?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-left text-sm font-medium">{currentUser?.email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
