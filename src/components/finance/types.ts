
// Define common types used in finance components

// AnomalyItem interface for the RiskDashboard
export interface AnomalyItem {
  category: string;
  expected: number;
  actual: number;
  change: number;
  project: string;
}

// Project phase information
export interface ProjectPhase {
  name: string;
  percentage: number;
  isCompleted: boolean;
}

// Project Type definition
export interface Project {
  id: string;
  name: string;
  progress: number;
  status: "active" | "pending" | "completed" | "paused";
  budget: {
    total: number;
    used: number;
  };
  team: string[];
  priority: "high" | "medium" | "low";
  description?: string;
  created_at: string | null;
  objective?: string;
  methods?: string;
  results?: string;
  tools?: string;
  outcome?: string;
  phases?: string[];
}

// Define other shared finance-related types here as needed
