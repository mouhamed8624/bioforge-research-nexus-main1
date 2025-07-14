import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, 
  Layout, 
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
  ChevronDown,
  ChevronRight,
  Eye,
  Shield,
  Crown,
  Microscope,
  Briefcase,
  MapPin,
  DollarSign,
  User
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface RolePermissionsOverviewProps {
  teamMembers: TeamMember[];
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
    "plaquettes",
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
    "plaquettes",
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

const PAGE_LABELS: Record<string, { label: string; icon: any; description: string }> = {
  dashboard: { label: "Dashboard", icon: Layout, description: "Main overview and metrics" },
  patients: { label: "Patients", icon: Users, description: "Patient management and records" },
  inventory: { label: "Inventory", icon: Package, description: "Equipment and supplies management" },
  papers: { label: "Papers", icon: BookOpen, description: "Research papers and publications" },
  "todo-list": { label: "Todo List", icon: CheckSquare, description: "Task and project management" },
  "button-project": { label: "Projects", icon: FolderOpen, description: "Research project management" },
  "bio-banks": { label: "Bio Banks", icon: Beaker, description: "Biological sample storage" },
  dbs: { label: "DBS", icon: Droplets, description: "Dry Blood Spot samples" },
  plaquettes: { label: "Plaquettes", icon: CreditCard, description: "Plaquette samples" },
  calendar: { label: "Calendar", icon: Calendar, description: "Scheduling and events" },
  reservations: { label: "Reservations", icon: Clock, description: "Resource booking" },
  finance: { label: "Finance", icon: Coins, description: "Budget and financial management" },
  teams: { label: "Teams", icon: Users2, description: "Team member management" },
  settings: { label: "Settings", icon: Settings, description: "System configuration" },
  "data-visualization": { label: "Data Visualization", icon: BarChart3, description: "Analytics and reports" },
  "pending-submissions": { label: "Pending Submissions", icon: ClipboardCheck, description: "Lab result approvals" }
};

const ROLE_CONFIG = {
  president: {
    title: "President",
    description: "Executive leadership with full system access",
    icon: Crown,
    color: "bg-purple-600",
    badge: "bg-purple-100 text-purple-800"
  },
  admin: {
    title: "Administrator",
    description: "System administration and user management",
    icon: Settings,
    color: "bg-blue-600",
    badge: "bg-blue-100 text-blue-800"
  },
  lab: {
    title: "Laboratory Staff",
    description: "Sample management and laboratory operations",
    icon: Microscope,
    color: "bg-green-600",
    badge: "bg-green-100 text-green-800"
  },
  general_director: {
    title: "General Director",
    description: "Strategic oversight and organizational management",
    icon: Briefcase,
    color: "bg-indigo-600",
    badge: "bg-indigo-100 text-indigo-800"
  },
  manager: {
    title: "Manager",
    description: "Team leadership and project coordination",
    icon: Users,
    color: "bg-cyan-600",
    badge: "bg-cyan-100 text-cyan-800"
  },
  field: {
    title: "Field Staff",
    description: "Field operations and data collection",
    icon: MapPin,
    color: "bg-teal-600",
    badge: "bg-teal-100 text-teal-800"
  },
  front_desk: {
    title: "Front Desk",
    description: "Reception and patient coordination",
    icon: User,
    color: "bg-orange-600",
    badge: "bg-orange-100 text-orange-800"
  },
  financial: {
    title: "Financial Staff",
    description: "Budget management and financial operations",
    icon: DollarSign,
    color: "bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-800"
  }
};

export const RolePermissionsOverview = ({ teamMembers }: RolePermissionsOverviewProps) => {
  const [activeTab, setActiveTab] = useState("by-role");
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  // Group team members by role
  const membersByRole = teamMembers.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = [];
    }
    acc[member.role].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  // Get unique roles from team members
  const activeRoles = Object.keys(membersByRole);

  const toggleRoleExpansion = (role: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(role)) {
      newExpanded.delete(role);
    } else {
      newExpanded.add(role);
    }
    setExpandedRoles(newExpanded);
  };

  const getPermissionLevel = (role: string) => {
    const permissions = ROLE_NAV_CONFIG[role] || [];
    if (permissions.length >= 15) return { level: "Full Access", color: "bg-green-500" };
    if (permissions.length >= 10) return { level: "High Access", color: "bg-blue-500" };
    if (permissions.length >= 5) return { level: "Medium Access", color: "bg-yellow-500" };
    return { level: "Limited Access", color: "bg-red-500" };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          Team Access Overview
        </CardTitle>
        <CardDescription>
          View and understand what each team member can access in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="by-role">By Role</TabsTrigger>
            <TabsTrigger value="by-member">By Member</TabsTrigger>
          </TabsList>

          <TabsContent value="by-role" className="space-y-4">
            <div className="space-y-4">
              {activeRoles.map((role) => {
                const roleConfig = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                const permissions = ROLE_NAV_CONFIG[role] || [];
                const permissionLevel = getPermissionLevel(role);
                const isExpanded = expandedRoles.has(role);
                const Icon = roleConfig?.icon || User;

                return (
                  <Card key={role} className="border-l-4 border-l-purple-500">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleRoleExpansion(role)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${roleConfig?.color || 'bg-gray-600'} text-white`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {roleConfig?.title || role}
                                </CardTitle>
                                <CardDescription>
                                  {membersByRole[role].length} member{membersByRole[role].length !== 1 ? 's' : ''} • {permissions.length} permissions
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${permissionLevel.color} text-white`}>
                                {permissionLevel.level}
                              </Badge>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Team Members */}
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">Team Members</h4>
                              <div className="flex flex-wrap gap-2">
                                {membersByRole[role].map((member) => (
                                  <Badge key={member.id} variant="outline" className="text-xs">
                                    {member.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Permissions */}
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">Accessible Sections</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {permissions.map((permission) => {
                                  const pageInfo = PAGE_LABELS[permission];
                                  const PageIcon = pageInfo?.icon || Layout;
                                  
                                  return (
                                    <div key={permission} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                      <PageIcon className="h-4 w-4 text-gray-600" />
                                      <span className="text-sm font-medium">{pageInfo?.label || permission}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="by-member" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG];
                const permissions = ROLE_NAV_CONFIG[member.role] || [];
                const permissionLevel = getPermissionLevel(member.role);
                const Icon = roleConfig?.icon || User;

                return (
                  <Card key={member.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${roleConfig?.color || 'bg-gray-600'} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{member.name}</CardTitle>
                          <CardDescription>{member.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleConfig?.badge || "bg-gray-100 text-gray-800"}>
                          {roleConfig?.title || member.role}
                        </Badge>
                        <Badge className={`${permissionLevel.color} text-white text-xs`}>
                          {permissions.length} sections
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-gray-700">Can Access:</h5>
                        <div className="flex flex-wrap gap-1">
                          {permissions.slice(0, 6).map((permission) => {
                            const pageInfo = PAGE_LABELS[permission];
                            return (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {pageInfo?.label || permission}
                              </Badge>
                            );
                          })}
                          {permissions.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{permissions.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 