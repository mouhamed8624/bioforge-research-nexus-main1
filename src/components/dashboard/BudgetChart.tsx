
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BudgetDataItem {
  name: string;
  value: number;
  color: string;
}

// Placeholder data for when no real data is available
const placeholderData: BudgetDataItem[] = [
  { name: "No Budget Data", value: 100, color: "#8a61ee" }
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function BudgetChart() {
  // Try to fetch real budget data if available
  const { data: budgetData = placeholderData, isLoading } = useQuery({
    queryKey: ['budgetAllocation'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('budget_allocation')
          .select('*');
        if (error) {
          console.error("Error fetching budget data:", error);
          return placeholderData;
        }
        console.log("Raw Supabase budget_allocation data:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          const processedData = data.map((item: any, index: number) => {
            console.log(`Processing item ${index}:`, item);
            
            // Safely extract category - handle if it's an object or primitive
            let categoryName = "Unknown";
            if (item.category !== null && item.category !== undefined) {
              if (typeof item.category === "object") {
                categoryName = String(item.category?.name || item.category?.category || "Unknown");
              } else {
                categoryName = String(item.category);
              }
            }

            // Safely extract percentage - handle if it's an object or primitive
            let percentageValue = 0;
            if (item.percentage !== null && item.percentage !== undefined) {
              if (typeof item.percentage === "object") {
                percentageValue = Number(item.percentage?.percentage || item.percentage?.value || 0);
              } else {
                percentageValue = Number(item.percentage);
              }
            }

            // Ensure color is a string
            const colorValue = String(item.color || getRandomColor(categoryName));

            const processedItem = {
              name: categoryName,
              value: percentageValue,
              color: colorValue
            };

            console.log(`Processed item ${index}:`, processedItem);
            return processedItem;
          });

          console.log("Final processed budget data:", processedData);
          return processedData as BudgetDataItem[];
        }
        return placeholderData;
      } catch (error) {
        console.error("Error fetching budget data:", error);
        return placeholderData;
      }
    }
  });

  // Function to generate a color based on category name
  function getRandomColor(str: string): string {
    const colors = ["#8a61ee", "#12db93", "#0c8de5", "#f97316", "#6366f1", "#ec4899", "#d946ef"];
    const index = Math.abs(str.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0) % colors.length);
    return colors[index];
  }

  // Simplified placeholder display when loading or no data
  if (isLoading || budgetData.length === 0 || (budgetData.length === 1 && budgetData[0].name === "No Budget Data")) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-md font-semibold">Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">No budget data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader>
        <CardTitle className="text-md font-semibold">Budget Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={String(entry.color)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [
                  String(value || ""),
                  String(name || "")
                ]}
                contentStyle={{ backgroundColor: "#1c212e", borderColor: "#3d4663" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend 
                formatter={(value: any) => String(value || "")}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Custom display under the chart for actual data */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {budgetData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span 
                  className="block w-3 h-3 rounded-full" 
                  style={{backgroundColor: String(entry.color)}} 
                />
                <span className="font-bold">{String(entry.name || "")}</span>
                <span className="ml-auto">{Number(entry.value || 0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
