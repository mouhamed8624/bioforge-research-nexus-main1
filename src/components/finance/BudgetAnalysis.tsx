
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, DollarSign } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

interface BudgetAnalysisProps {
  projectId: string | null;
  totalBudget: number;
  totalSpent: number;
}

export function BudgetAnalysis({ projectId, totalBudget, totalSpent }: BudgetAnalysisProps) {
  // Fetch spending data with date ranges
  const { data: spendingHistory = [] } = useQuery({
    queryKey: ["spendingHistory", projectId],
    queryFn: async () => {
      if (!projectId || projectId === "all") return [];
      
      const { data, error } = await supabase
        .from("spending")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: true });
      
      if (error) {
        console.error("Error fetching spending history:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!projectId && projectId !== "all",
  });

  // Fetch budget allocations
  const { data: budgetAllocations = [] } = useQuery({
    queryKey: ["budgetAllocations", projectId],
    queryFn: async () => {
      if (!projectId || projectId === "all") return [];
      
      const { data, error } = await supabase
        .from("budget_allocation")
        .select("*")
        .eq("project_id", projectId);
      
      if (error) {
        console.error("Error fetching budget allocations:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!projectId && projectId !== "all",
  });

  // Process spending trends over time
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const monthlyTrends = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthlySpending = spendingHistory
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      })
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    return {
      month: format(month, "MMM yyyy"),
      spending: monthlySpending,
      cumulative: spendingHistory
        .filter(expense => new Date(expense.date) <= monthEnd)
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
    };
  });

  // Calculate category performance
  const categoryPerformance = budgetAllocations.map(allocation => {
    const categorySpending = spendingHistory
      .filter(expense => expense.category === allocation.category)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    const allocatedAmount = (allocation.percentage / 100) * totalBudget;
    const utilizationRate = allocatedAmount > 0 ? (categorySpending / allocatedAmount) * 100 : 0;
    
    return {
      category: allocation.category,
      allocated: allocatedAmount,
      spent: categorySpending,
      remaining: allocatedAmount - categorySpending,
      utilization: utilizationRate,
      status: utilizationRate > 100 ? 'over' : utilizationRate > 75 ? 'warning' : 'good',
      color: allocation.color
    };
  });

  // Calculate burn rate and projections
  const currentDate = new Date();
  const last30Days = spendingHistory.filter(expense => {
    const expenseDate = new Date(expense.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return expenseDate >= thirtyDaysAgo;
  });

  const monthlyBurnRate = last30Days.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const remainingBudget = totalBudget - totalSpent;
  const projectedMonthsRemaining = monthlyBurnRate > 0 ? remainingBudget / monthlyBurnRate : Infinity;

  // Generate projections for next 6 months
  const projections = eachMonthOfInterval({
    start: new Date(),
    end: subMonths(new Date(), -5)
  }).map((month, index) => {
    const projectedSpending = monthlyBurnRate * (index + 1);
    const projectedTotal = totalSpent + projectedSpending;
    
    return {
      month: format(month, "MMM yyyy"),
      projected: Math.min(projectedTotal, totalBudget),
      budgetLine: totalBudget
    };
  });

  // Risk assessment
  const riskFactors = [];
  if (totalSpent / totalBudget > 0.75) {
    riskFactors.push("High budget utilization (>75%)");
  }
  if (monthlyBurnRate > totalBudget * 0.2) {
    riskFactors.push("High monthly burn rate");
  }
  if (projectedMonthsRemaining < 3) {
    riskFactors.push("Budget depletion risk within 3 months");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  if (!projectId || projectId === "all") {
    return (
      <Card className="bg-gradient-to-br from-teal-50 to-green-50 border-teal-200">
        <CardHeader>
          <CardTitle className="text-teal-800">Budget Analysis</CardTitle>
          <CardDescription className="text-teal-600">
            Select a specific project to view detailed budget analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-teal-400">
            <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Budget analysis requires a specific project selection.</p>
            <p className="text-sm mt-2">Choose a project from the dropdown above to see detailed performance metrics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-green-50 border-teal-200">
      <CardHeader>
        <CardTitle className="text-teal-800">Budget Analysis</CardTitle>
        <CardDescription className="text-teal-600">
          Detailed budget performance and projections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Budget Utilization</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
                  </div>
                  <Progress 
                    value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} 
                    className="mt-2"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    ${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()} used
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Monthly Burn Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">
                    ${monthlyBurnRate.toLocaleString()}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    Average monthly spending
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Projected Duration</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">
                    {projectedMonthsRemaining === Infinity ? "∞" : Math.ceil(projectedMonthsRemaining)}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    {projectedMonthsRemaining === Infinity ? "No spending rate" : "months remaining"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {riskFactors.length > 0 && (
              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-center gap-2 text-red-700">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Spending Trends (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                        name="Monthly Spending"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.3}
                        name="Cumulative Spending"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryPerformance.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category.category}</span>
                          <Badge className={getStatusColor(category.status)}>
                            {category.utilization.toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>${category.spent.toLocaleString()} spent</span>
                            <span>${category.allocated.toLocaleString()} allocated</span>
                          </div>
                          <Progress 
                            value={Math.min(category.utilization, 100)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>Budget Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryPerformance}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="allocated"
                          label={({ category, value }) => `${category}: $${value.toLocaleString()}`}
                        >
                          {categoryPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Allocated"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projections" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Budget Projections (Next 6 Months)</CardTitle>
                <CardDescription>
                  Based on current spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Projected Spending"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="budgetLine" 
                        stroke="#ff7300" 
                        strokeDasharray="5 5"
                        name="Budget Limit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Projection Notes:</strong> Based on the current monthly burn rate of ${monthlyBurnRate.toLocaleString()}, 
                    the budget is projected to {projectedMonthsRemaining < 12 ? `last approximately ${Math.ceil(projectedMonthsRemaining)} months` : 'last more than a year'}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
