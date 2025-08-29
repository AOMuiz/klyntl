// New IAnalyticsRepository for analytics operations
export interface IAnalyticsRepository {
  getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    averageCustomerValue: number;
    topCustomersByValue: { id: string; name: string; totalSpent: number }[];
  }>;

  getProductAnalytics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    topSellingProducts: { id: string; name: string; quantitySold: number }[];
  }>;

  getRevenueAnalytics(days: number): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    dailyRevenue: { date: string; revenue: number; transactions: number }[];
    revenueGrowth: number; // Percentage growth
  }>;

  getInventoryAnalytics(): Promise<{
    totalStockValue: number;
    lowStockValue: number;
    categoryBreakdown: { category: string; value: number; quantity: number }[];
    stockTurnoverRate: number;
  }>;
}
