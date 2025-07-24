import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { RecentAllActivities } from "@/components/dashboard/RecentAllActivities";
import { RecentPapers } from "@/components/dashboard/RecentPapers";
import { BudgetChart } from "@/components/dashboard/BudgetChart";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { AttendanceSummary } from "@/components/dashboard/AttendanceSummary";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { supabase } from "@/integrations/supabase/client";
import { fetchInventoryItems } from "@/services/inventory/supabaseService";
import { 
  Users, 
  ClipboardList, 
  BookOpen, 
  PackageX, 
  TriangleAlert, 
  CheckSquare, 
  TestTube, 
  Beaker, 
  FolderOpen, 
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

const Dashboard = () => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;
  const isManagerOrDirector = userRole === 'manager' || userRole === 'general_director';
  const isLabUser = userRole === 'lab';
  const isAdminOrPresident = userRole === 'admin' || userRole === 'president';

  // State for dashboard metrics
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [pendingTasks, setPendingTasks] = useState<number | null>(null);
  const [paperCount, setPaperCount] = useState<number | null>(null);
  const [activeProjectsCount, setActiveProjectsCount] = useState<number | null>(null);
  const [pendingTodoCount, setPendingTodoCount] = useState<number | null>(null);
  const [dbsCount, setDbsCount] = useState<number | null>(null);
  const [bioBanksCount, setBioBanksCount] = useState<number | null>(null);
  const [plaquettesCount, setPlaquettesCount] = useState<number | null>(null);
  
  // Loading states
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState({
    tasks: false,
    patients: false,
    papers: false,
    activeProjects: false,
    todos: false,
    dbs: false,
    bioBanks: false,
    plaquettes: false,
  });

  // Database connectivity indicator state
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    if (isAdminOrPresident) {
      setDbStatus('loading');
      (async () => {
        try {
          const { error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
          if (error) setDbStatus('error');
          else setDbStatus('connected');
        } catch {
          setDbStatus('error');
        }
      })();
    }
  }, [isAdminOrPresident]);

  // Query for inventory summary for financial role
  const { data: inventorySummary, isLoading: isInventorySummaryLoading } = useQuery({
    queryKey: ['inventoryDashboardSummary'],
    queryFn: fetchInventoryItems, // Fetch all to summarize
    select: (data) => {
      if (!data) return { critical: 0, low: 0 };
      const critical = data.filter(item => item.status === "critical").length;
      const low = data.filter(item => item.status === "low").length;
      return { critical, low };
    },
    enabled: userRole === 'financial', // Only run for financial role
  });

  // Fetch pending todo count from localStorage - optimized
  useEffect(() => {
    const fetchPendingTodoCount = () => {
      if (isAdminOrPresident) {
        // Don't show loading for todo count updates
        try {
          const savedTodos = localStorage.getItem('todos');
          if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            const pendingCount = todos.filter((todo: any) => !todo.completed).length;
            setPendingTodoCount(pendingCount);
          } else {
            setPendingTodoCount(0);
          }
        } catch (err) {
          console.error("Error fetching pending todos:", err);
          setPendingTodoCount(0);
        }
      }
    };

    fetchPendingTodoCount();
    
    // Set up an interval to refresh the count every 10 seconds (less frequent)
    const interval = setInterval(fetchPendingTodoCount, 10000);
    
    return () => clearInterval(interval);
  }, [isAdminOrPresident]);

  // Fetch counts for admin/president roles
  useEffect(() => {
    const fetchCounts = async () => {
      if (isAdminOrPresident) {
        // Fetch Active Projects count
        setIsStatsLoading(prev => ({ ...prev, activeProjects: true }));
        try {
          const { count: activeProjectsCountResult, error: activeProjectsError } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
          if (activeProjectsError) {
            console.error("Error fetching active projects count:", activeProjectsError);
            setActiveProjectsCount(0);
          } else {
            setActiveProjectsCount(activeProjectsCountResult || 0);
          }
        } catch (err) {
          setActiveProjectsCount(0);
        } finally {
          setIsStatsLoading(prev => ({ ...prev, activeProjects: false }));
        }

        // Fetch DBS count
        setIsStatsLoading(prev => ({ ...prev, dbs: true }));
        try {
          const { count: dbsCountResult, error: dbsError } = await supabase
            .from('dbs_samples')
            .select('*', { count: 'exact', head: true });
          if (dbsError) {
            console.error("Error fetching DBS count:", dbsError);
            setDbsCount(0);
          } else {
            setDbsCount(dbsCountResult || 0);
          }
        } catch (err) {
          setDbsCount(0);
        } finally {
          setIsStatsLoading(prev => ({ ...prev, dbs: false }));
        }

        // Fetch Bio Banks count
        setIsStatsLoading(prev => ({ ...prev, bioBanks: true }));
        try {
          const { count: bioBanksCountResult, error: bioBanksError } = await supabase
            .from('bio_banks')
            .select('*', { count: 'exact', head: true });
          if (bioBanksError) {
            console.error("Error fetching Bio Banks count:", bioBanksError);
            setBioBanksCount(0);
          } else {
            setBioBanksCount(bioBanksCountResult || 0);
          }
        } catch (err) {
          setBioBanksCount(0);
        } finally {
          setIsStatsLoading(prev => ({ ...prev, bioBanks: false }));
        }

        // Fetch Plaquettes count
        setIsStatsLoading(prev => ({ ...prev, plaquettes: true }));
        try {
          const { count: plaquettesCountResult, error: plaquettesError } = await supabase
            .from('plaquettes' as any)
            .select('*', { count: 'exact', head: true });
          if (plaquettesError) {
            console.error("Error fetching Plaquettes count:", plaquettesError);
            setPlaquettesCount(0);
          } else {
            setPlaquettesCount(plaquettesCountResult || 0);
          }
        } catch (err) {
          setPlaquettesCount(0);
        } finally {
          setIsStatsLoading(prev => ({ ...prev, plaquettes: false }));
        }
      }
    };

    fetchCounts();
  }, [isAdminOrPresident]);

  // Fetch patient count - optimized
  useEffect(() => {
    const fetchPatientCount = async () => {
      // Only show loading on initial load
      if (patientCount === null) {
        setPatientsLoading(true);
        setIsStatsLoading(prev => ({ ...prev, patients: true }));
      }
      
      try {
        const { count, error } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
        if (error) {
          console.error("Error fetching patient count:", error);
          setPatientCount(0);
        } else {
          setPatientCount(count || 0);
        }
      } catch (err) {
        setPatientCount(0);
      } finally {
        setPatientsLoading(false);
        setIsStatsLoading(prev => ({ ...prev, patients: false }));
      }
    };
    
    // Initialize other stats for specific roles
    if (isLabUser) {
      setPendingTasks(0);
      setPaperCount(0);
      setIsStatsLoading(prev => ({ 
        ...prev, 
        tasks: false, 
        papers: false 
      }));
    } else if (userRole !== "field") {
      setPendingTasks(0);
      setPaperCount(0);
      setIsStatsLoading(prev => ({ 
        ...prev, 
        tasks: false, 
        papers: false 
      }));
    }
    
    fetchPatientCount();
  }, [userRole, isLabUser]);



  // Render FIELD role: minimal, just one centered stat card
  if (userRole === "field") {
    return (
      <MainLayout>
        <PageContainer>
          <div className="flex flex-col items-center mt-12 space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Patients</h1>
              <p className="text-muted-foreground text-lg">
                View your assigned patients and related information.
              </p>
            </div>
            <div className="flex justify-center">
              {patientsLoading ? (
                <div className="w-72 shadow-lg">
                  <Skeleton className="h-32 w-full animate-pulse bg-muted/80" />
                </div>
              ) : (
                <StatCard
                  title="Total Patients"
                  value={patientCount?.toString() || "0"}
                  icon={<Users className="h-7 w-7 text-indigo-600" />}
                  description="Total registered patients."
                  className="w-72 shadow-lg"
                />
              )}
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Render a stat card with loading state
  const renderStatCard = (title: string, value: number | null | undefined, icon: React.ReactNode, description: string, isLoading: boolean) => {
    if (isLoading) {
      return <Skeleton className="h-28 w-full animate-pulse bg-muted/80 rounded-xl" />;
    }
    
    return (
      <StatCard 
        title={title} 
        value={value?.toString() || "0"} 
        icon={icon} 
        description={description}
      />
    );
  };

  // Render LAB role specific dashboard
  if (isLabUser) {
    return (
      <MainLayout>
        <PageContainer title="Lab Dashboard" subtitle="Key tasks and information for lab personnel.">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderStatCard(
                "Pending Tasks",
                pendingTasks,
                <ClipboardList className="h-6 w-6" />,
                "Tasks requiring attention",
                isStatsLoading.tasks
              )}
              {renderStatCard(
                "Patients",
                patientCount,
                <Users className="h-6 w-6" />,
                "Total registered patients",
                isStatsLoading.patients
              )}
            </div>
            <RecentAllActivities />
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Financial role specific dashboard
  if (userRole === "financial") {
    return (
      <MainLayout>
        <PageContainer title="Financial Dashboard" subtitle="Overview of inventory and financial metrics.">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderStatCard(
                "Critical Stock Items", 
                inventorySummary?.critical, 
                <PackageX className="h-6 w-6 text-red-500" />, 
                "Items needing immediate restock",
                isInventorySummaryLoading
              )}
              {renderStatCard(
                "Low Stock Items", 
                inventorySummary?.low, 
                <TriangleAlert className="h-6 w-6 text-yellow-500" />, 
                "Items running low",
                isInventorySummaryLoading
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InventoryStatus />
              <RecentAllActivities />
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Default dashboard for other roles
  return (
    <MainLayout>
      <PageContainer title="Dashboard" subtitle="Overview of research activities and metrics.">
        {/* User Role Display */}
        {userRole && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Role:</span>
            <Badge variant="secondary" className="capitalize">{userRole}</Badge>
          </div>
        )}
        {/* DB Connectivity Indicator for admin/president */}
        {isAdminOrPresident && (
          <div className="mb-2 flex items-center gap-2 text-xs">
            {dbStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {dbStatus === 'connected' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {dbStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
            <span className="text-muted-foreground">Database connectivity</span>
            <span className={
              dbStatus === 'connected' ? 'text-green-600' : dbStatus === 'error' ? 'text-red-600' : 'text-muted-foreground'
            }>
              {dbStatus === 'connected' ? 'Connected' : dbStatus === 'error' ? 'Error' : 'Checking...'}
            </span>
          </div>
        )}


        <div className="space-y-6">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdminOrPresident ? 'lg:grid-cols-3' : isManagerOrDirector ? 'lg:grid-cols-2' : isLabUser ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
            {renderStatCard(
              "Pending Tasks", 
              pendingTasks, 
              <ClipboardList className="h-6 w-6" />, 
              "Tasks requiring attention",
              isStatsLoading.tasks
            )}
            {!isManagerOrDirector && renderStatCard(
              "Patients", 
              patientCount, 
              <Users className="h-6 w-6" />, 
              "Total registered patients",
              isStatsLoading.patients
            )}
            {isAdminOrPresident ? renderStatCard(
              "Active Projects", 
              activeProjectsCount, 
              <FolderOpen className="h-6 w-6 text-blue-600" />, 
              "Currently active projects",
              isStatsLoading.activeProjects
            ) : renderStatCard(
              "Research Papers", 
              paperCount, 
              <BookOpen className="h-6 w-6" />, 
              "Published papers",
              isStatsLoading.papers
            )}
            {isAdminOrPresident && renderStatCard(
              "Pending To-Do Items", 
              pendingTodoCount, 
              <CheckSquare className="h-6 w-6 text-green-600" />, 
              "Incomplete tasks and to-dos",
              isStatsLoading.todos
            )}
            {isAdminOrPresident && renderStatCard(
              "DBS Samples", 
              dbsCount, 
              <TestTube className="h-6 w-6 text-blue-600" />, 
              "Dry Blood Spot samples",
              isStatsLoading.dbs
            )}
            {isAdminOrPresident && renderStatCard(
              "Bio Banks", 
              bioBanksCount, 
              <Beaker className="h-6 w-6 text-cigass-600" />, 
              "Biological samples stored",
              isStatsLoading.bioBanks
            )}
            {isAdminOrPresident && renderStatCard(
              "Plaquettes", 
              plaquettesCount, 
              <CreditCard className="h-6 w-6 text-purple-600" />, 
              "Plaquettes stored",
              isStatsLoading.plaquettes
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!isLabUser && <RecentPapers />}
                <RecentAllActivities />
              </div>
            </div>
            <div className="space-y-6">
              {!isLabUser && <InventoryStatus />}
              <AttendanceSummary />
            </div>
          </div>
        </div>
      </PageContainer>
    </MainLayout>    
  );
};

export default Dashboard;
