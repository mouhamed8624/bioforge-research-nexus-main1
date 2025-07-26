import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ProgressSummaryProps {
  projectProgress: number;
  completedTodos: Array<{
    percentage: number;
    task: string;
    completed_by?: string;
    completed_at?: string;
  }>;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  projectProgress,
  completedTodos
}) => {
  const totalProgressFromBreakdown = completedTodos.reduce((sum, todo) => sum + todo.percentage, 0);
  const isMatching = Math.abs(projectProgress - totalProgressFromBreakdown) < 1;

  return (
    <Card className="mb-4 border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Progress Summary</span>
          <Badge variant={isMatching ? "default" : "destructive"} className="text-xs">
            {isMatching ? "✓ Matching" : "⚠ Mismatch"}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-600">Project Progress:</span>
            <span className="ml-2 font-semibold text-blue-600">{projectProgress}%</span>
          </div>
          <div>
            <span className="text-gray-600">Breakdown Total:</span>
            <span className="ml-2 font-semibold text-green-600">{totalProgressFromBreakdown}%</span>
          </div>
          <div>
            <span className="text-gray-600">Completed Tasks:</span>
            <span className="ml-2 font-semibold text-purple-600">{completedTodos.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Difference:</span>
            <span className={`ml-2 font-semibold ${isMatching ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(projectProgress - totalProgressFromBreakdown).toFixed(1)}%
            </span>
          </div>
        </div>
        
        {!isMatching && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ Progress mismatch detected. Project shows {projectProgress}% but breakdown shows {totalProgressFromBreakdown}%.
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 