
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BudgetVisualizationProps {
  projectId: string;
  totalBudget: number;
}

export function BudgetVisualization({ projectId, totalBudget }: BudgetVisualizationProps) {
  // Fetch budget allocations
  const { data: budgetAllocations = [] } = useQuery({
    queryKey: ["budgetAllocations", projectId],
    queryFn: async () => {
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
  });

  // Fetch spending data
  const { data: spendingData = [] } = useQuery({
    queryKey: ["projectSpending", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spending")
        .select("*")
        .eq("project_id", projectId);
      
      if (error) {
        console.error("Error fetching spending data:", error);
        return [];
      }
      
      return data || [];
    },
  });

  // Process data for charts
  const pieData = budgetAllocations.map(allocation => {
    const allocatedAmount = (allocation.percentage / 100) * totalBudget;
    const categorySpending = spendingData
      .filter(expense => expense.category === allocation.category)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    return {
      name: allocation.category,
      value: allocation.percentage,
      allocated: allocatedAmount,
      spent: categorySpending,
      remaining: allocatedAmount - categorySpending,
      color: allocation.color
    };
  });

  const barData = pieData.map(item => ({
    category: item.name,
    allocated: item.allocated,
    spent: item.spent,
    remaining: item.remaining
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Percentage: {data.value}%</p>
          <p className="text-sm">Allocated: ${data.allocated?.toLocaleString()}</p>
          <p className="text-sm">Spent: ${data.spent?.toLocaleString()}</p>
          <p className="text-sm">Remaining: ${data.remaining?.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (budgetAllocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No budget allocation found for this project.</p>
            <p className="text-sm mt-2">Use the "Allocate Budget" button to set up categories.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pie">Allocation</TabsTrigger>
            <TabsTrigger value="bar">Spending vs Budget</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pie" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={150}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="bar" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Legend />
                  <Bar dataKey="allocated" fill="#8884d8" name="Allocated" />
                  <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                  <Bar dataKey="remaining" fill="#ffc658" name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
