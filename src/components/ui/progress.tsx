
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"
import { Circle, CheckCircle, Flag, FlagTriangleRight } from "lucide-react"

// New interface for project phases
interface Phase {
  name: string;
  completed: boolean;
}

// Extended props interface
interface ExtendedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  phases?: Phase[];
  showPhases?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ExtendedProgressProps
>(({ className, value, phases, showPhases = false, ...props }, ref) => (
  <div className={showPhases ? "space-y-2" : ""}>
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
    
    {showPhases && phases && phases.length > 0 && (
      <div className="flex w-full justify-between mt-1 px-1">
        {phases.map((phase, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className={cn(
                "h-2 w-2 rounded-full",
                index * (100 / (phases.length - 1)) <= (value || 0) 
                  ? "bg-primary" 
                  : "bg-secondary border border-primary/30"
              )}
            />
            <span className="text-xs mt-1 text-muted-foreground">
              {phase.name}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
export type { Phase }
