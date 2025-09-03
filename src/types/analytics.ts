import { Customer } from "./customer";

// Basic Analytics Interface (current)
export interface Analytics {
  totalCustomers: number;
  totalRevenue: number;
  totalTransactions: number;
  topCustomers: Customer[];
}

// Enhanced Analytics Interfaces (for future implementation)
export interface RevenueAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  dailyRevenue: { date: string; revenue: number; transactions: number }[];
  revenueGrowth: number;
  monthlyRevenue: { month: string; revenue: number }[];
  revenueByType: { type: string; revenue: number; percentage: number }[];
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number; // Last 30 days
  newCustomers: number; // This month
  customerGrowth: number; // Percentage growth
  averageCustomerLifetime: number; // Days
  topCustomers: Customer[];
  customerRetentionRate: number;
  churnRate: number;
}

export interface RFMAnalysis {
  customerId: string;
  customerName: string;
  recency: number; // Days since last purchase
  frequency: number; // Number of transactions
  monetary: number; // Total amount spent
  rfmScore: string; // e.g., "555"
  segment: string; // e.g., "Champions", "At Risk"
  locationCategory?: string;
  recommendations: string[];
}

export interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  averageValue: number;
  characteristics: string[];
}

export interface PurchaseBehaviorAnalytics {
  averageOrderValue: number;
  purchaseFrequency: number; // Purchases per customer per month
  seasonalTrends: { period: string; volume: number; revenue: number }[];
  purchaseTiming: { hour: number; transactionCount: number }[];
  productAnalytics: {
    totalProducts: number;
    lowStockProducts: number;
    topSellingProducts: {
      productId: string;
      name: string;
      quantitySold: number;
      revenue: number;
    }[];
  };
}

export interface BusinessInsight {
  type: "opportunity" | "risk" | "achievement" | "warning";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  estimatedImpact: string;
  affectedCustomers?: number;
  potentialRevenue?: number;
}

export interface EnhancedAnalytics extends Analytics {
  revenue: RevenueAnalytics;
  customers: CustomerAnalytics;
  behavior: PurchaseBehaviorAnalytics;
  segments: CustomerSegment[];
  rfmAnalysis?: RFMAnalysis[];
  insights: BusinessInsight[];
  lastUpdated: string;
}

// Date range for analytics queries
export interface DateRange {
  startDate: string;
  endDate: string;
}

// Analytics filters
export interface AnalyticsFilters {
  dateRange?: DateRange;
  customerType?: "individual" | "business" | "all";
  location?: string;
  productCategory?: string;
  transactionType?: "sale" | "refund" | "payment" | "all";
}
