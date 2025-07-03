import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpendingTracker } from "@/components/finance/SpendingTracker";
import { BudgetAllocationDialog } from "@/components/finance/BudgetAllocationDialog";
import { BudgetVisualization } from "@/components/finance/BudgetVisualization";
import { BudgetAnalysis } from "@/components/finance/BudgetAnalysis";
import { DollarSign, TrendingUp, TrendingDown, PieChart, Calendar, Download, Settings, BarChart3, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Finance = () => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("month");
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);

  // Fetch projects from database
  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      console.log("Fetching projects...");
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
      
      console.log("Projects fetched:", data?.length || 0);
      return data || [];
    },
  });

  // Fetch budget allocations
  const { data: budgetAllocations = [], refetch: refetchAllocations } = useQuery({
    queryKey: ["budgetAllocations", selectedProject],
    queryFn: async () => {
      if (selectedProject === "all") return [];
      
      console.log("Fetching budget allocations for project:", selectedProject);
      const { data, error } = await supabase
        .from("budget_allocation")
        .select("*")
        .eq("project_id", selectedProject);
      
      if (error) {
        console.error("Error fetching budget allocations:", error);
        return [];
      }
      
      console.log("Budget allocations fetched:", data?.length || 0);
      return data || [];
    },
    enabled: selectedProject !== "all",
  });

  // Fetch spending data with better error handling and logging
  const { data: spendingData = [], refetch: refetchSpending, isLoading: isLoadingSpending } = useQuery({
    queryKey: ["spending", selectedProject],
    queryFn: async () => {
      console.log("Fetching spending data for project:", selectedProject);
      let query = supabase.from("spending").select("*");
      
      if (selectedProject !== "all") {
        query = query.eq("project_id", selectedProject);
      }
      
      const { data, error } = await query.order("date", { ascending: false });
      
      if (error) {
        console.error("Error fetching spending data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch spending data",
          variant: "destructive",
        });
        return [];
      }
      
      console.log("Spending data fetched:", data?.length || 0, "records");
      console.log("Total spending amount:", data?.reduce((sum, expense) => sum + Number(expense.amount), 0));
      return data || [];
    },
  });

  // Calculate financial overview from real data with better logging
  const selectedProjectData = selectedProject !== "all" ? projects.find(p => p.id === selectedProject) : null;
  
  const totalBudget = selectedProjectData?.budget && typeof selectedProjectData.budget === 'object' && 'total' in selectedProjectData.budget 
    ? Number(selectedProjectData.budget.total) 
    : projects.reduce((sum, project) => {
        const budget = project.budget && typeof project.budget === 'object' && 'total' in project.budget 
          ? Number(project.budget.total) 
          : 0;
        return sum + budget;
      }, 0);

  const totalSpent = spendingData.reduce((sum, expense) => sum + Number(expense.amount), 0);
  console.log("Financial calculations - Total Budget:", totalBudget, "Total Spent:", totalSpent);
  
  const remaining = totalBudget - totalSpent;
  
  // Calculate monthly burn rate (last 30 days) with better date handling
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const monthlySpending = spendingData.filter(expense => {
    const expenseDate = new Date(expense.date);
    const isRecent = expenseDate >= thirtyDaysAgo;
    if (isRecent) {
      console.log("Recent spending:", expense.description, expense.amount, expense.date);
    }
    return isRecent;
  });
  
  const monthlyBurn = monthlySpending.reduce((sum, expense) => sum + Number(expense.amount), 0);
  console.log("Monthly burn calculation - Recent expenses:", monthlySpending.length, "Total monthly burn:", monthlyBurn);

  const financialOverview = {
    totalBudget,
    totalSpent,
    remaining,
    monthlyBurn,
    projectedCompletion: monthlyBurn > 0 ? `${Math.ceil(remaining / monthlyBurn)} months` : "N/A"
  };

  // Calculate budget categories from allocations and spending
  const budgetCategories = budgetAllocations.map(allocation => {
    const categorySpending = spendingData
      .filter(expense => expense.category === allocation.category)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    const allocatedAmount = (allocation.percentage / 100) * totalBudget;
    const percentage = allocatedAmount > 0 ? (categorySpending / allocatedAmount) * 100 : 0;
    
    return {
      name: allocation.category,
      allocated: allocatedAmount,
      spent: categorySpending,
      percentage: Math.round(percentage)
    };
  });

  // Recent transactions (last 5)
  const recentTransactions = spendingData.slice(0, 5).map(expense => ({
    description: expense.description,
    amount: -Number(expense.amount),
    date: new Date(expense.date).toISOString().split('T')[0],
    category: expense.category
  }));

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return "destructive";
    if (percentage >= 75) return "secondary";
    return "default";
  };

  const projectsForSelect = [
    { id: "all", name: "All Projects" },
    ...projects.map(project => ({ id: project.id, name: project.name }))
  ];

  const handleAllocationUpdate = () => {
    refetchAllocations();
    refetchProjects();
    refetchSpending();
  };

  const handleRefreshData = async () => {
    console.log("Manually refreshing all financial data...");
    await Promise.all([
      refetchProjects(),
      refetchAllocations(),
      refetchSpending()
    ]);
    toast({
      title: "Data Refreshed",
      description: "Financial data has been updated",
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
        <div className="space-y-6 p-6">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Finance Dashboard</h1>
                <p className="text-purple-100 text-lg">
                  Monitor budgets, track spending, and manage financial resources
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectsForSelect.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshData}
                  disabled={isLoadingSpending}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSpending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {selectedProject !== "all" && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllocationDialog(true)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Allocate Budget
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowVisualization(!showVisualization)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {showVisualization ? "Hide" : "Show"} Graph
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Financial Overview Cards with enhanced colors */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">Total Budget</CardTitle>
                <div className="p-2 bg-emerald-500 rounded-full">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-700">${financialOverview.totalBudget.toLocaleString()}</div>
                <p className="text-xs text-emerald-600 mt-1">
                  {selectedProject === "all" ? "Across all projects" : "For selected project"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Total Spent</CardTitle>
                <div className="p-2 bg-blue-500 rounded-full">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">${financialOverview.totalSpent.toLocaleString()}</div>
                <p className="text-xs text-blue-600 mt-1">
                  {totalBudget > 0 ? `${((financialOverview.totalSpent / totalBudget) * 100).toFixed(1)}% of budget` : "No budget set"}
                </p>
              </CardContent>
            </Card>

            <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 ${remaining >= 0 ? 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${remaining >= 0 ? 'text-teal-800' : 'text-red-800'}`}>Remaining</CardTitle>
                <div className={`p-2 rounded-full ${remaining >= 0 ? 'bg-teal-500' : 'bg-red-500'}`}>
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${remaining >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
                  ${Math.abs(financialOverview.remaining).toLocaleString()}
                </div>
                <p className={`text-xs mt-1 ${remaining >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                  {remaining >= 0 ? "Available for allocation" : "Over budget"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Monthly Burn</CardTitle>
                <div className="p-2 bg-purple-500 rounded-full">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">${financialOverview.monthlyBurn.toLocaleString()}</div>
                <p className="text-xs text-purple-600 mt-1">
                  {financialOverview.projectedCompletion} at current rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Visualization */}
          {showVisualization && selectedProject !== "all" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <BudgetVisualization 
                projectId={selectedProject} 
                totalBudget={totalBudget}
              />
            </div>
          )}

          {/* Main Content Tabs with enhanced styling */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <Tabs defaultValue="overview" className="space-y-0">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                <TabsList className="bg-white shadow-sm">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Overview</TabsTrigger>
                  <TabsTrigger value="spending" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">Spending Tracker</TabsTrigger>
                  <TabsTrigger value="budget" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">Budget Analysis</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="overview" className="space-y-6 mt-0">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800">
                          <div className="p-2 bg-orange-500 rounded-full">
                            <PieChart className="h-5 w-5 text-white" />
                          </div>
                          Budget Categories
                        </CardTitle>
                        <CardDescription className="text-orange-600">
                          Spending breakdown by category
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {budgetCategories.length === 0 ? (
                          <div className="text-center py-8 text-orange-400">
                            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No budget categories found</p>
                            <p className="text-sm mt-2">Select a project with budget allocations</p>
                          </div>
                        ) : (
                          budgetCategories.map((category) => (
                            <div key={category.name} className="space-y-2 p-3 bg-white rounded-lg shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                                <Badge variant={getBadgeVariant(category.percentage)} className="font-semibold">
                                  {category.percentage}%
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>${category.spent.toLocaleString()} spent</span>
                                  <span>${category.allocated.toLocaleString()} allocated</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      category.percentage >= 90 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                                      category.percentage >= 75 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-green-400 to-green-500'
                                    }`}
                                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                      <CardHeader>
                        <CardTitle className="text-cyan-800">Recent Transactions</CardTitle>
                        <CardDescription className="text-cyan-600">
                          Latest financial activities
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentTransactions.length === 0 ? (
                            <div className="text-center py-8 text-cyan-400">
                              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No recent transactions</p>
                            </div>
                          ) : (
                            recentTransactions.map((transaction, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-cyan-100 hover:shadow-md transition-shadow">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                                    <Badge variant="outline" className="text-xs">{transaction.category}</Badge>
                                  </div>
                                </div>
                                <span className={`font-bold text-lg ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="spending" className="mt-0">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                    <SpendingTracker projectId={selectedProject === "all" ? null : selectedProject} />
                  </div>
                </TabsContent>

                <TabsContent value="budget" className="space-y-4 mt-0">
                  <BudgetAnalysis 
                    projectId={selectedProject === "all" ? null : selectedProject}
                    totalBudget={totalBudget}
                    totalSpent={totalSpent}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Budget Allocation Dialog */}
          {selectedProject !== "all" && (
            <BudgetAllocationDialog
              open={showAllocationDialog}
              onOpenChange={setShowAllocationDialog}
              projectId={selectedProject}
              onAllocationUpdate={handleAllocationUpdate}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Finance;
