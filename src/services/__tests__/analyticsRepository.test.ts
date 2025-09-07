import * as SQLite from "expo-sqlite";
import { AnalyticsRepository } from "../database/repositories/AnalyticsRepository";
import { AuditLogService } from "../database/service/AuditLogService";
import { DatabaseConfig } from "../database/types";

// Mock expo-sqlite for testing
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

const mockSQLite = SQLite as jest.Mocked<typeof SQLite>;

describe("AnalyticsRepository", () => {
  let analyticsRepository: AnalyticsRepository;
  let mockDb: any;
  let mockAuditService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock database methods
    mockDb = {
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
      withTransactionAsync: jest.fn().mockImplementation(async (callback) => {
        await callback();
      }),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    // Mock audit service
    mockAuditService = {
      logEntry: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock SQLite.openDatabaseAsync to return our mock database
    mockSQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    const config: DatabaseConfig = {
      defaultPageSize: 10,
      customerActiveDays: 30,
    };

    analyticsRepository = new AnalyticsRepository(
      mockDb,
      config,
      mockAuditService
    );
  });

  describe("getBasicAnalytics", () => {
    it("should return basic analytics data", async () => {
      // Mock database responses
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 100 }) // customer count
        .mockResolvedValueOnce({ count: 250 }) // transaction count
        .mockResolvedValueOnce({ total: 500000 }); // total revenue

      mockDb.getAllAsync.mockResolvedValue([
        {
          id: "cust_1",
          name: "John Doe",
          totalSpent: 50000,
        },
        {
          id: "cust_2",
          name: "Jane Smith",
          totalSpent: 45000,
        },
      ]);

      const result = await analyticsRepository.getBasicAnalytics();

      expect(result).toEqual({
        totalCustomers: 100,
        totalTransactions: 250,
        totalRevenue: 500000,
        totalOutstandingDebts: 0,
        topCustomers: [
          {
            id: "cust_1",
            name: "John Doe",
            totalSpent: 50000,
            customerType: "individual",
            isActive: false,
          },
          {
            id: "cust_2",
            name: "Jane Smith",
            totalSpent: 45000,
            customerType: "individual",
            isActive: false,
          },
        ],
      });

      expect(mockDb.getFirstAsync).toHaveBeenCalledTimes(4);
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1);
    });

    it("should handle empty results", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await analyticsRepository.getBasicAnalytics();

      expect(result).toEqual({
        totalCustomers: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        totalOutstandingDebts: 0,
        topCustomers: [],
      });
    });

    it("should handle database errors", async () => {
      mockDb.getFirstAsync.mockRejectedValue(new Error("Database error"));

      await expect(analyticsRepository.getBasicAnalytics()).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getRevenueAnalytics", () => {
    it("should return revenue analytics with default 30 days", async () => {
      const mockRevenueData = [
        { date: "2024-01-01", revenue: 10000, transactions: 5 },
        { date: "2024-01-02", revenue: 15000, transactions: 8 },
      ];

      const mockMonthlyData = [
        { month: "2024-01", revenue: 50000 },
        { month: "2024-02", revenue: 75000 },
      ];

      const mockTypeData = [
        { type: "sale", revenue: 100000, count: 50 },
        { type: "refund", revenue: -5000, count: 2 },
      ];

      mockDb.getFirstAsync
        .mockResolvedValueOnce({ revenue: 125000, count: 60 }) // current period
        .mockResolvedValueOnce({ revenue: 100000 }) // previous period
        .mockResolvedValueOnce({ revenue: 125000, count: 60 }); // current period again

      mockDb.getAllAsync
        .mockResolvedValueOnce(mockRevenueData) // daily data
        .mockResolvedValueOnce(mockMonthlyData) // monthly data
        .mockResolvedValueOnce(mockTypeData); // type data

      const result = await analyticsRepository.getRevenueAnalytics();

      expect(result.totalRevenue).toBe(125000);
      expect(result.totalTransactions).toBe(60);
      expect(result.averageTransactionValue).toBe(125000 / 60);
      expect(result.revenueGrowth).toBe(25); // ((125000 - 100000) / 100000) * 100
      expect(result.dailyRevenue).toEqual(mockRevenueData);
      expect(result.monthlyRevenue).toEqual(mockMonthlyData);
      expect(result.revenueByType).toHaveLength(2);
    });

    it("should apply filters correctly", async () => {
      const filters = {
        transactionType: "sale" as const,
      };

      mockDb.getFirstAsync
        .mockResolvedValueOnce({ revenue: 100000, count: 50 })
        .mockResolvedValueOnce({ revenue: 80000 })
        .mockResolvedValueOnce({ revenue: 100000, count: 50 });

      mockDb.getAllAsync
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await analyticsRepository.getRevenueAnalytics(30, filters);

      expect(result.totalRevenue).toBeDefined();
      expect(result.totalTransactions).toBeDefined();

      // Verify that filter conditions are applied in SQL queries
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining("type = ?"),
        expect.any(Array)
      );
    });

    it("should handle zero previous revenue for growth calculation", async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ revenue: 50000, count: 25 })
        .mockResolvedValueOnce({ revenue: 0 }) // previous period
        .mockResolvedValueOnce({ revenue: 50000, count: 25 });

      mockDb.getAllAsync
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await analyticsRepository.getRevenueAnalytics();

      expect(result.revenueGrowth).toBe(0);
    });
  });

  describe("getCustomerAnalytics", () => {
    it("should return comprehensive customer analytics", async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 200 }) // total customers
        .mockResolvedValueOnce({ count: 150 }) // active customers
        .mockResolvedValueOnce({ count: 25 }) // new customers this month
        .mockResolvedValueOnce({ count: 20 }) // previous month new customers
        .mockResolvedValueOnce({
          avg_lifetime: 180,
          returning_customers: 120,
        });

      mockDb.getAllAsync.mockResolvedValue([
        { id: "cust_1", name: "VIP Customer", totalSpent: 100000 },
        { id: "cust_2", name: "Regular Customer", totalSpent: 25000 },
      ]);

      const result = await analyticsRepository.getCustomerAnalytics();

      expect(result.totalCustomers).toBe(200);
      expect(result.activeCustomers).toBe(150);
      expect(result.newCustomers).toBe(25);
      expect(result.customerGrowth).toBe(25); // ((25 - 20) / 20) * 100
      expect(result.averageCustomerLifetime).toBe(180);
      expect(result.customerRetentionRate).toBe(60); // (120 / 200) * 100
      expect(result.churnRate).toBe(40); // 100 - 60
      expect(result.topCustomers).toHaveLength(2);
    });

    it("should handle zero previous new customers for growth calculation", async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 200 })
        .mockResolvedValueOnce({ count: 150 })
        .mockResolvedValueOnce({ count: 25 })
        .mockResolvedValueOnce({ count: 0 }) // previous month
        .mockResolvedValueOnce({
          avg_lifetime: 180,
          returning_customers: 120,
        });

      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await analyticsRepository.getCustomerAnalytics();

      expect(result.customerGrowth).toBe(0);
    });
  });

  describe("getPurchaseBehaviorAnalytics", () => {
    it("should return purchase behavior insights", async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({
          avg_order: 25000,
          total_customers: 100,
          total_transactions: 300,
        })
        .mockResolvedValueOnce({ total_products: 50 })
        .mockResolvedValueOnce({ low_stock_count: 5 });

      mockDb.getAllAsync
        .mockResolvedValueOnce([
          { month: "01", volume: 50, revenue: 100000 },
          { month: "02", volume: 75, revenue: 150000 },
        ])
        .mockResolvedValueOnce([
          { hour: "10", transactionCount: 15 },
          { hour: "14", transactionCount: 20 },
        ])
        .mockResolvedValueOnce([
          {
            productId: "prod_1",
            name: "Product A",
            quantitySold: 100,
            revenue: 200000,
          },
        ]);

      const result = await analyticsRepository.getPurchaseBehaviorAnalytics();

      expect(result.averageOrderValue).toBe(25000);
      expect(result.purchaseFrequency).toBe(3); // 300 transactions / 100 customers / 12 months * 12
      expect(result.seasonalTrends).toHaveLength(2);
      expect(result.purchaseTiming).toHaveLength(2);
      expect(result.productAnalytics.totalProducts).toBe(50);
      expect(result.productAnalytics.lowStockProducts).toBe(5);
      expect(result.productAnalytics.topSellingProducts).toHaveLength(1);
    });
  });

  describe("generateBusinessInsights", () => {
    it("should generate actionable business insights", async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 15 }) // dormant customers
        .mockResolvedValueOnce({ count: 3, total_value: 500000 }) // VIP customers
        .mockResolvedValueOnce({ count: 8 }); // low stock products

      const insights = await analyticsRepository.generateBusinessInsights();

      expect(insights.length).toBeGreaterThan(0);

      // Check for dormant customers insight
      const dormantInsight = insights.find((i) => i.type === "risk");
      expect(dormantInsight).toBeDefined();
      expect(dormantInsight?.title).toContain("Dormant Customers");

      // Check for VIP customers insight
      const vipInsight = insights.find((i) => i.type === "opportunity");
      expect(vipInsight).toBeDefined();
      expect(vipInsight?.title).toContain("VIP Customer");

      // Check for low stock insight
      const stockInsight = insights.find((i) => i.type === "warning");
      expect(stockInsight).toBeDefined();
      expect(stockInsight?.title).toContain("Low Stock");
    });

    it("should handle cases with no insights to generate", async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

      const insights = await analyticsRepository.generateBusinessInsights();

      expect(insights).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      mockDb.getFirstAsync.mockRejectedValue(new Error("Database error"));

      const insights = await analyticsRepository.generateBusinessInsights();

      // Should return empty array instead of throwing
      expect(insights).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should handle database errors in getRevenueAnalytics", async () => {
      mockDb.getFirstAsync.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(analyticsRepository.getRevenueAnalytics()).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database errors in getCustomerAnalytics", async () => {
      mockDb.getFirstAsync.mockRejectedValue(new Error("Query failed"));

      await expect(analyticsRepository.getCustomerAnalytics()).rejects.toThrow(
        "Query failed"
      );
    });

    it("should handle database errors in getPurchaseBehaviorAnalytics", async () => {
      mockDb.getFirstAsync.mockRejectedValue(new Error("Connection timeout"));

      await expect(
        analyticsRepository.getPurchaseBehaviorAnalytics()
      ).rejects.toThrow("Connection timeout");
    });
  });
});
