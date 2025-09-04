import {
  Analytics,
  AnalyticsFilters,
  BusinessInsight,
  CustomerAnalytics,
  PurchaseBehaviorAnalytics,
  RevenueAnalytics,
} from "@/types/analytics";
import { Customer } from "@/types/customer";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogService } from "../service/AuditLogService";
import { DatabaseError } from "../service/utilService";
import { DatabaseConfig } from "../types";
import { IAnalyticsRepository } from "./interfaces/IAnalyticsRepository";

// ===== ANALYTICS REPOSITORY =====
export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(
    private db: SQLiteDatabase,
    private config: DatabaseConfig,
    private auditService: AuditLogService
  ) {}

  // Basic analytics (maintain backward compatibility)
  async getBasicAnalytics(): Promise<Analytics> {
    try {
      const [customerCount, transactionCount, totalRevenue, topCustomers] =
        await Promise.all([
          this.db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM customers"
          ),
          this.db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM transactions"
          ),
          this.db.getFirstAsync<{ total: number }>(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'sale'"
          ),
          this.db.getAllAsync<any>(
            "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 5"
          ),
        ]);

      return {
        totalCustomers: customerCount?.count || 0,
        totalTransactions: transactionCount?.count || 0,
        totalRevenue: totalRevenue?.total || 0,
        topCustomers: (topCustomers || []).map((customer) =>
          this.augmentCustomerData(customer)
        ),
      };
    } catch (error) {
      throw new DatabaseError("getBasicAnalytics", error as Error);
    }
  }

  // Enhanced revenue analytics
  async getRevenueAnalytics(
    days: number = 30,
    filters?: AnalyticsFilters
  ): Promise<RevenueAnalytics> {
    try {
      const startDate = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();
      const prevStartDate = new Date(
        Date.now() - days * 2 * 24 * 60 * 60 * 1000
      ).toISOString();

      // Build filter conditions
      let filterWhere = "";
      const filterParams: any[] = [];

      if (filters?.transactionType && filters.transactionType !== "all") {
        filterWhere += " AND type = ?";
        filterParams.push(filters.transactionType);
      }

      const [currentPeriod, previousPeriod, dailyData, monthlyData, typeData] =
        await Promise.all([
          this.db.getFirstAsync<{ revenue: number; count: number }>(
            `SELECT COALESCE(SUM(amount), 0) as revenue, COUNT(*) as count 
             FROM transactions 
             WHERE date >= ?${filterWhere}`,
            [startDate, ...filterParams]
          ),
          this.db.getFirstAsync<{ revenue: number }>(
            `SELECT COALESCE(SUM(amount), 0) as revenue 
             FROM transactions 
             WHERE date >= ? AND date < ?${filterWhere}`,
            [prevStartDate, startDate, ...filterParams]
          ),
          this.db.getAllAsync<any>(
            `SELECT 
              DATE(date) as date,
              COALESCE(SUM(amount), 0) as revenue,
              COUNT(*) as transactions
             FROM transactions 
             WHERE date >= ?${filterWhere}
             GROUP BY DATE(date)
             ORDER BY date`,
            [startDate, ...filterParams]
          ),
          this.db.getAllAsync<any>(
            `SELECT 
              strftime('%Y-%m', date) as month,
              COALESCE(SUM(amount), 0) as revenue
             FROM transactions 
             WHERE date >= ?${filterWhere}
             GROUP BY strftime('%Y-%m', date)
             ORDER BY month`,
            [
              new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
              ...filterParams,
            ]
          ),
          this.db.getAllAsync<any>(
            `SELECT 
              type,
              COALESCE(SUM(amount), 0) as revenue,
              COUNT(*) as count
             FROM transactions 
             WHERE date >= ?
             GROUP BY type
             ORDER BY revenue DESC`,
            [startDate]
          ),
        ]);

      const currentRevenue = currentPeriod?.revenue || 0;
      const previousRevenue = previousPeriod?.revenue || 0;
      const revenueGrowth =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      const totalTypeRevenue = typeData.reduce(
        (sum, item) => sum + item.revenue,
        0
      );

      return {
        totalRevenue: currentRevenue,
        totalTransactions: currentPeriod?.count || 0,
        averageTransactionValue: currentPeriod?.count
          ? currentRevenue / currentPeriod.count
          : 0,
        dailyRevenue: dailyData || [],
        revenueGrowth,
        monthlyRevenue: monthlyData || [],
        revenueByType:
          typeData?.map((item) => ({
            type: item.type,
            revenue: item.revenue,
            percentage:
              totalTypeRevenue > 0
                ? (item.revenue / totalTypeRevenue) * 100
                : 0,
          })) || [],
      };
    } catch (error) {
      throw new DatabaseError("getRevenueAnalytics", error as Error);
    }
  }

  // Enhanced customer analytics
  async getCustomerAnalytics(
    filters?: AnalyticsFilters
  ): Promise<CustomerAnalytics> {
    try {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const sixtyDaysAgo = new Date(
        Date.now() - 60 * 24 * 60 * 60 * 1000
      ).toISOString();
      const activeDays = this.config.customerActiveDays;
      const cutoffDate = new Date(
        Date.now() - activeDays * 24 * 60 * 60 * 1000
      ).toISOString();

      const [
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        previousMonthNewCustomers,
        topCustomers,
        retentionData,
      ] = await Promise.all([
        this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM customers"
        ),
        this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM customers WHERE lastPurchase >= ?",
          [cutoffDate]
        ),
        this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM customers WHERE createdAt >= ?",
          [thirtyDaysAgo]
        ),
        this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM customers WHERE createdAt >= ? AND createdAt < ?",
          [sixtyDaysAgo, thirtyDaysAgo]
        ),
        this.db.getAllAsync<any>(
          "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 10"
        ),
        this.db.getFirstAsync<{
          avg_lifetime: number;
          returning_customers: number;
        }>(
          `SELECT 
            AVG(JULIANDAY('now') - JULIANDAY(createdAt)) as avg_lifetime,
            COUNT(CASE WHEN totalSpent > 0 THEN 1 END) as returning_customers
           FROM customers`
        ),
      ]);

      const newCustomers = newCustomersThisMonth?.count || 0;
      const previousNewCustomers = previousMonthNewCustomers?.count || 0;
      const customerGrowth =
        previousNewCustomers > 0
          ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100
          : 0;

      const totalCustomerCount = totalCustomers?.count || 0;
      const returningCustomers = retentionData?.returning_customers || 0;
      const retentionRate =
        totalCustomerCount > 0
          ? (returningCustomers / totalCustomerCount) * 100
          : 0;

      return {
        totalCustomers: totalCustomerCount,
        activeCustomers: activeCustomers?.count || 0,
        newCustomers,
        customerGrowth,
        averageCustomerLifetime: retentionData?.avg_lifetime || 0,
        topCustomers: (topCustomers || []).map((customer) =>
          this.augmentCustomerData(customer)
        ),
        customerRetentionRate: retentionRate,
        churnRate: Math.max(0, 100 - retentionRate),
      };
    } catch (error) {
      throw new DatabaseError("getCustomerAnalytics", error as Error);
    }
  }

  // Purchase behavior analytics
  async getPurchaseBehaviorAnalytics(): Promise<PurchaseBehaviorAnalytics> {
    try {
      const [
        orderStats,
        seasonalData,
        timingData,
        productStats,
        lowStockProducts,
        topProducts,
      ] = await Promise.all([
        this.db.getFirstAsync<{
          avg_order: number;
          total_customers: number;
          total_transactions: number;
        }>(
          `SELECT 
            AVG(amount) as avg_order,
            COUNT(DISTINCT customerId) as total_customers,
            COUNT(*) as total_transactions
           FROM transactions WHERE type = 'sale'`
        ),
        this.db.getAllAsync<any>(
          `SELECT 
            strftime('%m', date) as month,
            COUNT(*) as volume,
            SUM(amount) as revenue
           FROM transactions 
           WHERE type = 'sale' AND date >= date('now', '-12 months')
           GROUP BY strftime('%m', date)
           ORDER BY month`
        ),
        this.db.getAllAsync<any>(
          `SELECT 
            strftime('%H', date) as hour,
            COUNT(*) as transactionCount
           FROM transactions 
           WHERE type = 'sale' AND date >= date('now', '-30 days')
           GROUP BY strftime('%H', date)
           ORDER BY hour`
        ),
        this.db.getFirstAsync<{ total_products: number }>(
          "SELECT COUNT(*) as total_products FROM products WHERE isActive = 1"
        ),
        this.db.getFirstAsync<{ low_stock_count: number }>(
          "SELECT COUNT(*) as low_stock_count FROM products WHERE stockQuantity <= lowStockThreshold AND isActive = 1"
        ),
        this.db.getAllAsync<any>(
          `SELECT 
            p.id as productId,
            p.name,
            COUNT(t.id) as quantitySold,
            SUM(t.amount) as revenue
           FROM products p
           LEFT JOIN transactions t ON p.id = t.productId AND t.type = 'sale'
           WHERE p.isActive = 1
           GROUP BY p.id, p.name
           ORDER BY revenue DESC
           LIMIT 10`
        ),
      ]);

      const totalCustomers = orderStats?.total_customers || 1;
      const totalTransactions = orderStats?.total_transactions || 0;
      const purchaseFrequency = totalTransactions / totalCustomers; // Transactions per customer

      return {
        averageOrderValue: orderStats?.avg_order || 0,
        purchaseFrequency,
        seasonalTrends:
          seasonalData?.map((item) => ({
            period: `Month ${item.month}`,
            volume: item.volume,
            revenue: item.revenue,
          })) || [],
        purchaseTiming:
          timingData?.map((item) => ({
            hour: parseInt(item.hour),
            transactionCount: item.transactionCount,
          })) || [],
        productAnalytics: {
          totalProducts: productStats?.total_products || 0,
          lowStockProducts: lowStockProducts?.low_stock_count || 0,
          topSellingProducts:
            topProducts?.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantitySold: item.quantitySold || 0,
              revenue: item.revenue || 0,
            })) || [],
        },
      };
    } catch (error) {
      throw new DatabaseError("getPurchaseBehaviorAnalytics", error as Error);
    }
  }

  // Generate business insights
  async generateBusinessInsights(): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    try {
      // Check for dormant customers
      const dormantCustomers = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM customers 
         WHERE lastPurchase < date('now', '-60 days') AND lastPurchase IS NOT NULL`
      );

      if (dormantCustomers?.count && dormantCustomers.count > 0) {
        insights.push({
          type: "risk",
          priority: "medium",
          title: "Dormant Customers Detected",
          description: `${dormantCustomers.count} customers haven't purchased in 60+ days`,
          action: "Launch reactivation campaign with special offers",
          estimatedImpact: "Potential 15-25% reactivation rate",
          affectedCustomers: dormantCustomers.count,
        });
      }

      // Check for high-value customers
      const vipCustomers = await this.db.getFirstAsync<{
        count: number;
        total_value: number;
      }>(
        `SELECT COUNT(*) as count, SUM(totalSpent) as total_value 
         FROM customers WHERE totalSpent > 50000`
      );

      if (vipCustomers?.count && vipCustomers.count > 0) {
        insights.push({
          type: "opportunity",
          priority: "high",
          title: "VIP Customer Opportunity",
          description: `${vipCustomers.count} high-value customers (₦50k+) identified`,
          action: "Create VIP loyalty program with exclusive benefits",
          estimatedImpact: "Increase retention by 30%",
          affectedCustomers: vipCustomers.count,
          potentialRevenue: vipCustomers.total_value * 0.2, // 20% potential increase
        });
      }

      // Check for low stock products
      const lowStock = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM products WHERE stockQuantity <= lowStockThreshold AND isActive = 1"
      );

      if (lowStock?.count && lowStock.count > 0) {
        insights.push({
          type: "warning",
          priority: "high",
          title: "Low Stock Alert",
          description: `${lowStock.count} products are running low on stock`,
          action: "Reorder inventory to avoid stockouts",
          estimatedImpact: "Prevent revenue loss from unavailable products",
        });
      }

      // Check for growth opportunity
      const recentGrowth = await this.db.getFirstAsync<{
        recent: number;
        previous: number;
      }>(
        `SELECT 
          COUNT(CASE WHEN createdAt >= date('now', '-30 days') THEN 1 END) as recent,
          COUNT(CASE WHEN createdAt >= date('now', '-60 days') AND createdAt < date('now', '-30 days') THEN 1 END) as previous
         FROM customers`
      );

      if (recentGrowth?.recent && recentGrowth?.previous) {
        const growth =
          ((recentGrowth.recent - recentGrowth.previous) /
            recentGrowth.previous) *
          100;
        if (growth > 20) {
          insights.push({
            type: "achievement",
            priority: "medium",
            title: "Strong Customer Growth",
            description: `Customer acquisition increased by ${growth.toFixed(
              1
            )}% this month`,
            action: "Scale successful marketing channels",
            estimatedImpact: "Maintain growth momentum",
          });
        }
      }

      return insights;
    } catch (error) {
      console.warn("Failed to generate insights:", error);
      return insights;
    }
  }

  // Helper method for customer data augmentation
  private augmentCustomerData(customer: any): Customer {
    const activeDays = this.config.customerActiveDays;
    const cutoffDate = new Date(Date.now() - activeDays * 24 * 60 * 60 * 1000);

    return {
      ...customer,
      customerType:
        customer.company && customer.company.trim() ? "business" : "individual",
      isActive: customer.lastPurchase
        ? new Date(customer.lastPurchase) > cutoffDate
        : false,
    };
  }
}
