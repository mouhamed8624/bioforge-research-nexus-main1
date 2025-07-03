import { ReactNode, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(value);

  // Update display value whenever the prop changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <Card className={cn("neo-card", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gradient-cigass">
                {displayValue}
              </h3>
              {trend && (
                <div
                  className={cn(
                    "flex items-center text-xs font-semibold",
                    trend.isPositive ? "text-teal-500" : "text-red-500"
                  )}
                >
                  {trend.isPositive ? "▲" : "▼"}
                  {Math.abs(trend.value)}%
                </div>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1 max-w-[150px]">{description}</p>}
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cigass-100 text-cigass-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
