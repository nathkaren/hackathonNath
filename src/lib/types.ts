export interface PropertyData {
  id: string;
  name: string;
  address: string;
  type: "apartamento" | "casa" | "studio" | "cobertura";
  monthlyRevenue: number[];
  occupancyRate: number[];
  avgDailyRate: number[];
  reviewScore: number;
  totalReviews: number;
  months: string[];
}

export interface CompetitorData {
  id: string;
  name: string;
  avgRevenue: number;
  avgOccupancy: number;
  avgDailyRate: number;
  reviewScore: number;
}

export interface HealthScore {
  overall: number;
  revenue: number;
  occupancy: number;
  pricing: number;
  reviews: number;
  status: "excelente" | "bom" | "atenção" | "crítico";
}

export interface ActionPlan {
  priority: "alta" | "média" | "baixa";
  category: string;
  action: string;
  expectedImpact: string;
}

export interface AnalysisResult {
  property: PropertyData;
  competitors: CompetitorData[];
  health: HealthScore;
  actions: ActionPlan[];
  conclusion: string;
  performanceSummary: {
    avgRevenue: number;
    avgOccupancy: number;
    avgDailyRate: number;
    revenueGrowth: number;
    marketPosition: string;
  };
}
