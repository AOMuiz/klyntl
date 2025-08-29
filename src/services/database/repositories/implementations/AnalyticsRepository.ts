import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseError } from "../../service/utilService";

// Analytics Repository Implementation
export class AnalyticsRepository {
  constructor(private db: SQLiteDatabase) {}

  async getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    averageCustomerValue: number;
    topCustomersByValue: { id: string; name: string; totalSpent: number }[];
  }> {
    try {
      const now = new Date();
      const thisMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const sixtyDaysAgo = new Date(
        Date.now() - 60 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [
        totalCustomers,
        activeCustomers,
        newCustomers,
        avgValue,
        topCustomers,
      ] = await Promise.all([
        this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM customers"
        ),
        this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM customers WHERE lastPurchase >= ?",
          [sixtyDaysAgo]
        ),
        this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM customers WHERE createdAt >= ?",
          [thisMonth]
        ),
        this.db.getFirstAsync<{ avg: number }>(
          "SELECT COALESCE(AVG(totalSpent), 0) as avg FROM customers WHERE totalSpent > 0"
        ),
        this.db.getAllAsync<any>(
          "SELECT id, name, totalSpent FROM customers ORDER BY totalSpent DESC LIMIT 5"
        ),
      ]);

      return {
        totalCustomers: totalCustomers?.count || 0,
        activeCustomers: activeCustomers?.count || 0,
        newCustomersThisMonth: newCustomers?.count || 0,
        averageCustomerValue: avgValue?.avg || 0,
        topCustomersByValue: topCustomers || [],
      };
    } catch (error) {
      throw new DatabaseError("getCustomerAnalytics", error as Error);
    }
  }

  async getProductAnalytics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    topSellingProducts: { id: string; name: string; quantitySold: number }[];
  }> {
    try {
      const [total, active, lowStock, outOfStock, topSelling] =
        await Promise.all([
          this.db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM products"
          ),
          this.db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM products WHERE isActive = 1"
          ),
          this.db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM products WHERE stockQuantity <= lowStockThreshold AND stockQuantity > 0"
          ),
          this.db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM products WHERE stockQuantity = 0"
          ),
          // This would need transaction_items table for real implementation
          this.db.getAllAsync<any>(
            "SELECT id, name, 0 as quantitySold FROM products ORDER BY name LIMIT 5"
          ),
        ]);

      return {
        totalProducts: total?.count || 0,
        activeProducts: active?.count || 0,
        lowStockProducts: lowStock?.count || 0,
        outOfStockProducts: outOfStock?.count || 0,
        topSellingProducts: topSelling || [],
      };
    } catch (error) {
      throw new DatabaseError("getProductAnalytics", error as Error);
    }
  }

  async getRevenueAnalytics(days: number): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    dailyRevenue: { date: string; revenue: number; transactions: number }[];
    revenueGrowth: number;
  }> {
    try {
      const startDate = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();
      const prevStartDate = new Date(
        Date.now() - days * 2 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [currentPeriod, previousPeriod, dailyData] = await Promise.all([
        this.db.getFirstAsync<{ revenue: number; count: number }>(
          `SELECT COALESCE(SUM(amount), 0) as revenue, COUNT(*) as count 
           FROM transactions 
           WHERE type = 'sale' AND date >= ?`,
          [startDate]
        ),
        this.db.getFirstAsync<{ revenue: number }>(
          `SELECT COALESCE(SUM(amount), 0) as revenue 
           FROM transactions 
           WHERE type = 'sale' AND date >= ? AND date < ?`,
          [prevStartDate, startDate]
        ),
        this.db.getAllAsync<any>(
          `SELECT 
            DATE(date) as date,
            COALESCE(SUM(amount), 0) as revenue,
            COUNT(*) as transactions
           FROM transactions 
           WHERE type = 'sale' AND date >= ?
           GROUP BY DATE(date)
           ORDER BY date`,
          [startDate]
        ),
      ]);

      const currentRevenue = currentPeriod?.revenue || 0;
      const previousRevenue = previousPeriod?.revenue || 0;
      const revenueGrowth =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      return {
        totalRevenue: currentRevenue,
        totalTransactions: currentPeriod?.count || 0,
        averageTransactionValue: currentPeriod?.count
          ? currentRevenue / currentPeriod.count
          : 0,
        dailyRevenue: dailyData || [],
        revenueGrowth,
      };
    } catch (error) {
      throw new DatabaseError("getRevenueAnalytics", error as Error);
    }
  }

  async getInventoryAnalytics(): Promise<{
    totalStockValue: number;
    lowStockValue: number;
    categoryBreakdown: { category: string; value: number; quantity: number }[];
    stockTurnoverRate: number;
  }> {
    try {
      const [stockValue, lowStockValue, categoryData] = await Promise.all([
        this.db.getFirstAsync<{ value: number }>(
          "SELECT COALESCE(SUM(price * stockQuantity), 0) as value FROM products WHERE isActive = 1"
        ),
        this.db.getFirstAsync<{ value: number }>(
          `SELECT COALESCE(SUM(price * stockQuantity), 0) as value 
           FROM products 
           WHERE isActive = 1 AND stockQuantity <= lowStockThreshold`
        ),
        this.db.getAllAsync<any>(
          `SELECT 
            COALESCE(category, 'Uncategorized') as category,
            SUM(price * stockQuantity) as value,
            SUM(stockQuantity) as quantity
           FROM products 
           WHERE isActive = 1
           GROUP BY category`
        ),
      ]);

      return {
        totalStockValue: stockValue?.value || 0,
        lowStockValue: lowStockValue?.value || 0,
        categoryBreakdown: categoryData || [],
        stockTurnoverRate: 0, // Would need sales data to calculate properly
      };
    } catch (error) {
      throw new DatabaseError("getInventoryAnalytics", error as Error);
    }
  }
}
