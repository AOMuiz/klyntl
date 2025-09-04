import {
  Analytics,
  AnalyticsFilters,
  BusinessInsight,
  CustomerAnalytics,
  CustomerSegment,
  DateRange,
  EnhancedAnalytics,
  PurchaseBehaviorAnalytics,
  RevenueAnalytics,
  RFMAnalysis,
} from "@/types/analytics";

// ===== ANALYTICS REPOSITORY INTERFACE =====
// Defines the contract for analytics-specific operations

// 📊 Implementation Priority Suggestions:
// High Priority: RFM Analysis, Customer Segmentation, Enhanced Analytics
// Medium Priority: Product Performance, Geographic Analytics, Time-based Analytics
// Low Priority: Predictive Analytics, Cohort Analysis, Real-time features

export interface IAnalyticsRepository {
  // Basic analytics (maintain backward compatibility)
  getBasicAnalytics(): Promise<Analytics>;

  // Enhanced revenue analytics
  getRevenueAnalytics(
    days?: number,
    filters?: AnalyticsFilters
  ): Promise<RevenueAnalytics>;

  // Enhanced customer analytics
  getCustomerAnalytics(filters?: AnalyticsFilters): Promise<CustomerAnalytics>;

  // Purchase behavior analytics
  getPurchaseBehaviorAnalytics(): Promise<PurchaseBehaviorAnalytics>;

  // Generate business insights
  generateBusinessInsights(): Promise<BusinessInsight[]>;

  // ===== FUTURE FEATURE INTERFACES =====

  // RFM (Recency, Frequency, Monetary) Analysis
  getRFMAnalysis?(dateRange?: DateRange): Promise<RFMAnalysis[]>;

  // Customer Segmentation
  getCustomerSegments?(): Promise<CustomerSegment[]>;

  // Enhanced Analytics (combines all analytics)
  getEnhancedAnalytics?(filters?: AnalyticsFilters): Promise<EnhancedAnalytics>;

  // Predictive Analytics
  getChurnPrediction?(days?: number): Promise<{
    atRiskCustomers: number;
    predictedChurnRate: number;
    recommendations: string[];
  }>;

  // Product Performance Analytics
  getProductPerformanceAnalytics?(dateRange?: DateRange): Promise<{
    topProducts: {
      productId: string;
      name: string;
      revenue: number;
      quantitySold: number;
      profitMargin: number;
    }[];
    slowMovingProducts: {
      productId: string;
      name: string;
      daysSinceLastSale: number;
      stockLevel: number;
    }[];
    productTrends: {
      productId: string;
      name: string;
      growthRate: number;
      trend: "increasing" | "decreasing" | "stable";
    }[];
  }>;

  // Geographic Analytics
  getGeographicAnalytics?(): Promise<{
    revenueByLocation: {
      location: string;
      revenue: number;
      customerCount: number;
      averageOrderValue: number;
    }[];
    customerDistribution: {
      location: string;
      customerCount: number;
      percentage: number;
    }[];
  }>;

  // Time-based Analytics
  getTimeBasedAnalytics?(
    period: "hourly" | "daily" | "weekly" | "monthly",
    dateRange?: DateRange
  ): Promise<
    {
      period: string;
      revenue: number;
      transactions: number;
      customers: number;
      averageOrderValue: number;
    }[]
  >;

  // Cohort Analysis
  getCohortAnalysis?(
    cohortType: "acquisition" | "behavioral",
    period: "monthly" | "quarterly"
  ): Promise<
    {
      cohort: string;
      size: number;
      retention: {
        period: number;
        retained: number;
        retentionRate: number;
      }[];
      lifetimeValue: number;
    }[]
  >;

  // Competitive Analytics
  getCompetitiveAnalytics?(): Promise<{
    marketPosition: {
      percentile: number;
      benchmark: string;
      status: "above" | "below" | "average";
    }[];
    opportunities: {
      area: string;
      potential: number;
      action: string;
    }[];
  }>;

  // Real-time Analytics
  getRealTimeAnalytics?(): Promise<{
    activeUsers: number;
    currentRevenue: number;
    pendingOrders: number;
    alerts: {
      type: "warning" | "critical";
      message: string;
      action: string;
    }[];
  }>;

  // Custom Report Generation
  generateCustomReport?(
    reportType: string,
    filters: AnalyticsFilters,
    dateRange: DateRange
  ): Promise<{
    reportId: string;
    title: string;
    data: any;
    generatedAt: string;
    filters: AnalyticsFilters;
  }>;

  // Analytics Export
  exportAnalytics?(
    format: "csv" | "json" | "pdf",
    data: any,
    filename: string
  ): Promise<{
    url: string;
    expiresAt: string;
  }>;

  // Analytics Dashboard Configuration
  getDashboardConfig?(userId: string): Promise<{
    widgets: {
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config: any;
    }[];
    refreshInterval: number;
  }>;

  saveDashboardConfig?(
    userId: string,
    config: {
      widgets: any[];
      refreshInterval: number;
    }
  ): Promise<void>;
}
