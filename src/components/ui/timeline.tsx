
import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const TimelineContext = createContext<{ isLastItem: boolean }>({
  isLastItem: false,
});

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Timeline({ children, className, ...props }: TimelineProps) {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return (
            <TimelineContext.Provider 
              value={{ isLastItem: index === childrenArray.length - 1 }}
            >
              {child}
            </TimelineContext.Provider>
          );
        }
        return child;
      })}
    </div>
  );
}

export function TimelineItem({ children, className, ...props }: TimelineItemProps) {
  const { isLastItem } = useContext(TimelineContext);
  
  return (
    <div 
      className={cn(
        "relative pb-4",
        !isLastItem && "before:absolute before:left-[1.125rem] before:top-[2.5rem] before:h-full before:w-px before:bg-border",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
