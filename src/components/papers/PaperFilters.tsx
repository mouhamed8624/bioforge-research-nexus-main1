
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PAPER_CATEGORIES } from "@/services/papers/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XCircle } from "lucide-react";

interface PaperFiltersProps {
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
  onClearFilters: () => void;
}

export function PaperFilters({ 
  onCategorySelect, 
  selectedCategory,
  onClearFilters 
}: PaperFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Filter by Category</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="h-8 text-xs flex items-center gap-1"
          >
            <XCircle className="h-3 w-3" />
            Clear filters
          </Button>
        </div>
        <ScrollArea className="h-[50px] pb-2">
          <div className="flex gap-2 flex-wrap pb-1">
            {PAPER_CATEGORIES.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => onCategorySelect(selectedCategory === category ? null : category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
