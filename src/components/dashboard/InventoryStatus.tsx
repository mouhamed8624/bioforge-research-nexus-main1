
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchInventoryItems } from "@/services/inventory/supabaseService";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const getStatusColor = (status: string) => {
  switch (status) {
    case "ok":
      return "bg-teal-600 text-white";
    case "low":
      return "bg-yellow-600 text-white";
    case "critical":
      return "bg-red-600 text-white";
    case "overstock":
      return "bg-blue-600 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStockPercentage = (quantite_restante: number, seuil_alerte: number) => {
  if (!seuil_alerte || seuil_alerte <= 0) return 100;
  return (quantite_restante / seuil_alerte) * 100;
};

export function InventoryStatus() {
  const { userProfile } = useAuth();
  if (userProfile?.role === "lab") {
    return null;
  }

  // Use react-query to fetch inventory items from Supabase
  const { data: inventoryItems = [], isLoading, isError } = useQuery({
    queryKey: ["dashboardInventoryItems"],
    queryFn: fetchInventoryItems,
    select: (data) => {
      // Filter to low or critical items and take the first 3
      return data
        .filter(item => item.status === "low" || item.status === "critical")
        .slice(0, 3);
    }
  });

  // Use another query to get a count of all low/critical items for the summary
  const { data: inventorySummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["inventorySummary"],
    queryFn: fetchInventoryItems,
    select: (data) => {
      const total = data.length;
      const critical = data.filter(item => item.status === "critical").length;
      const low = data.filter(item => item.status === "low").length;
      const ok = data.filter(item => item.status === "ok").length;
      const overstock = data.filter(item => item.status === "overstock").length;
      
      return { total, critical, low, ok, overstock };
    }
  });

  if (isLoading || isSummaryLoading) {
    return (
      <Card className="neo-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-md font-semibold">Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-5 w-[60px]" />
                </div>
                <Skeleton className="h-2 w-full mt-2" />
                <div className="flex items-center justify-between mt-1">
                  <Skeleton className="h-3 w-[80px]" />
                  <Skeleton className="h-3 w-[60px]" />
                </div>
                <Skeleton className="h-3 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="neo-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-md font-semibold">Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md">
            Unable to load inventory data. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display warning alert if there are critical or low items
  const hasWarnings = (inventorySummary?.critical || 0) > 0 || (inventorySummary?.low || 0) > 0;

  return (
    <Card className="neo-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-md font-semibold">Inventory Status</CardTitle>
        <Link to="/inventory">
          <Button variant="ghost" size="sm" className="gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Inventory Summary Section */}
        {inventorySummary && (
          <div className="mb-4">
            {hasWarnings && (
              <Alert className={`mb-3 ${(inventorySummary.critical > 0) ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <AlertTriangle className={`h-4 w-4 ${inventorySummary.critical > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
                <AlertTitle className="text-sm font-medium">
                  {inventorySummary.critical > 0 
                    ? `Critical: ${inventorySummary.critical} items need immediate attention`
                    : `Warning: ${inventorySummary.low} items running low`
                  }
                </AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  {inventorySummary.critical > 0 && inventorySummary.low > 0 
                    ? `Additionally, ${inventorySummary.low} items are running low.`
                    : inventorySummary.critical > 0 
                      ? "These items require immediate reordering."
                      : "Consider reordering soon to maintain adequate supplies."
                  }
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-red-100 text-red-800 p-2 rounded">
                <div className="font-bold">{inventorySummary.critical}</div>
                <div>Critical</div>
              </div>
              <div className="bg-yellow-100 text-yellow-800 p-2 rounded">
                <div className="font-bold">{inventorySummary.low}</div>
                <div>Low</div>
              </div>
              <div className="bg-green-100 text-green-800 p-2 rounded">
                <div className="font-bold">{inventorySummary.ok}</div>
                <div>OK</div>
              </div>
              <div className="bg-blue-100 text-blue-800 p-2 rounded">
                <div className="font-bold">{inventorySummary.overstock}</div>
                <div>Overstock</div>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Items Section */}
        <h3 className="font-medium text-sm mb-3">Low Stock Items</h3>
        <div className="space-y-4">
          {inventoryItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No low stock items at the moment.</p>
          ) : (
            inventoryItems.map((item) => (
              <div key={item.id} className={`space-y-2 p-3 rounded-md ${item.status === 'critical' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{item.produit}</h3>
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex-1">
                    <Progress 
                      value={getStockPercentage(item.quantite_restante, item.seuil_alerte || 1)} 
                      className={`h-2 ${item.status === 'critical' ? 'bg-red-200' : 'bg-yellow-200'}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs">{item.type || 'Product'}</span>
                      <span className="text-xs font-medium">
                        {item.quantite_restante} / {item.seuil_alerte || 0} units
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{item.rayon || 'No location specified'}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
