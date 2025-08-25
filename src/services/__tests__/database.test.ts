import * as SQLite from "expo-sqlite";
import { CreateCustomerInput, UpdateCustomerInput } from "../../types/customer";
import { CreateTransactionInput } from "../../types/transaction";
import { DatabaseService } from "../database/index";

// Mock expo-sqlite for testing
jest.mock("expo-sqlite");

describe("DatabaseService", () => {
  let databaseService: DatabaseService;
  let mockTransaction: jest.Mock;
  let mockExecuteSql: jest.Mock;

  const setupMockExecuteSql = () => {
    // Reset the mock and set up default behavior
    mockExecuteSql.mockReset();
    mockExecuteSql.mockImplementation((sql, params, success, error) => {
      if (success && typeof success === "function") {
        success();
      }
    });
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock functions with proper callback handling
    mockExecuteSql = jest.fn();

    mockTransaction = jest.fn((callback, errorCallback, successCallback) => {
      const tx = { executeSql: mockExecuteSql };
      try {
        callback(tx);
        if (successCallback) successCallback();
      } catch (err) {
        if (errorCallback) errorCallback(err);
      }
    });

    // Mock the database instance
    const mockDb = { transaction: mockTransaction };

    // Mock SQLite.openDatabase
    const mockedSQLite = SQLite as jest.Mocked<typeof SQLite>;
    mockedSQLite.openDatabase.mockReturnValue(mockDb as any);

    databaseService = new DatabaseService("test.db");

    // Set default success behavior for executeSql
    setupMockExecuteSql();
  });
  describe("initialize", () => {
    it("should initialize database tables correctly", async () => {
      await databaseService.initialize();

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS customers")
      );
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS transactions")
      );
    });

    it("should only initialize once", async () => {
      await databaseService.initialize();
      await databaseService.initialize();

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("should handle initialization errors", async () => {
      mockTransaction.mockImplementationOnce((callback, errorCallback) => {
        if (errorCallback) errorCallback(new Error("Database error"));
      });

      await expect(databaseService.initialize()).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("createCustomer", () => {
    const customerInput: CreateCustomerInput = {
      name: "John Doe",
      phone: "+2348012345678",
      email: "john@example.com",
      address: "123 Lagos Street",
    };

    it("should create a customer successfully", async () => {
      setupMockExecuteSql();

      const result = await databaseService.createCustomer(customerInput);

      expect(result).toMatchObject({
        name: customerInput.name,
        phone: customerInput.phone,
        email: customerInput.email,
        address: customerInput.address,
        totalSpent: 0,
      });
      expect(result.id).toMatch(/^cust_\d+_[a-z0-9]+$/);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should handle creation errors", async () => {
      // Set up mock to simulate error during the customer creation (not initialization)
      let callCount = 0;
      mockExecuteSql.mockImplementation((sql, params, success, error) => {
        callCount++;
        if (callCount <= 2) {
          // First two calls are for initialization - let them succeed
          if (success) success();
        } else {
          // Third call is the actual customer creation - make it fail
          if (error) {
            error(null, new Error("Duplicate phone number"));
          }
        }
      });

      await expect(
        databaseService.createCustomer(customerInput)
      ).rejects.toThrow("Duplicate phone number");
    });

    it("should generate unique customer IDs", async () => {
      setupMockExecuteSql();

      const customer1 = await databaseService.createCustomer(customerInput);
      const customer2 = await databaseService.createCustomer({
        ...customerInput,
        phone: "+2348012345679",
      });

      expect(customer1.id).not.toBe(customer2.id);
    });
  });

  describe("getCustomers", () => {
    const mockCustomers = [
      {
        id: "cust_1",
        name: "John Doe",
        phone: "+2348012345678",
        email: "john@example.com",
        totalSpent: 50000,
      },
      {
        id: "cust_2",
        name: "Jane Smith",
        phone: "+2348012345679",
        email: "jane@example.com",
        totalSpent: 75000,
      },
    ];

    it("should return all customers when no search query", async () => {
      // Set up mock to handle initialization calls first, then the actual query
      let callCount = 0;
      mockExecuteSql.mockImplementation((sql, params, success) => {
        callCount++;
        if (callCount <= 2) {
          // First two calls are for initialization
          if (success) success();
        } else {
          // Third call is the actual query
          const rows = {
            length: mockCustomers.length,
            item: (index: number) => mockCustomers[index],
          };
          if (success) success(null, { rows });
        }
      });

      const result = await databaseService.getCustomers();

      expect(result).toEqual(mockCustomers);
    });

    it("should filter customers by search query", async () => {
      const filteredCustomers = [mockCustomers[0]];

      let callCount = 0;
      mockExecuteSql.mockImplementation((sql, params, success) => {
        callCount++;
        if (callCount <= 2) {
          // First two calls are for initialization
          if (success) success();
        } else {
          // Third call is the actual query
          const rows = {
            length: filteredCustomers.length,
            item: (index: number) => filteredCustomers[index],
          };
          if (success) success(null, { rows });
        }
      });

      const result = await databaseService.getCustomers("John");

      expect(result).toEqual(filteredCustomers);
      expect(mockExecuteSql).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC",
        ["%John%", "%John%"],
        expect.any(Function),
        expect.any(Function)
      );
    });

    it("should handle query errors", async () => {
      let callCount = 0;
      mockExecuteSql.mockImplementation((sql, params, success, error) => {
        callCount++;
        if (callCount <= 2) {
          // First two calls are for initialization - let them succeed
          if (success) success();
        } else {
          // Third call is the actual query - make it fail
          if (error) {
            error(null, new Error("Database query failed"));
          }
        }
      });

      await expect(databaseService.getCustomers()).rejects.toThrow(
        "Database query failed"
      );
    });
  });

  describe("updateCustomer", () => {
    const updateData: UpdateCustomerInput = {
      name: "John Updated",
      email: "john.updated@example.com",
    };

    it("should update customer successfully", async () => {
      setupMockExecuteSql();

      await databaseService.updateCustomer("cust_1", updateData);

      // Verify that executeSql was called (including initialization calls)
      expect(mockExecuteSql).toHaveBeenCalled();
    });

    it("should handle update errors", async () => {
      let callCount = 0;
      mockExecuteSql.mockImplementation((sql, params, success, error) => {
        callCount++;
        if (callCount <= 2) {
          // First two calls are for initialization - let them succeed
          if (success) success();
        } else {
          // Third call is the actual update - make it fail
          if (error) {
            error(null, new Error("Update failed"));
          }
        }
      });

      await expect(
        databaseService.updateCustomer("cust_1", updateData)
      ).rejects.toThrow("Update failed");
    });
  });

  describe("createTransaction", () => {
    const transactionInput: CreateTransactionInput = {
      customerId: "cust_1",
      amount: 25000,
      description: "Product purchase",
      date: "2024-01-15T10:30:00Z",
      type: "sale",
    };

    it("should create a transaction successfully", async () => {
      setupMockExecuteSql();

      const result = await databaseService.createTransaction(transactionInput);

      expect(result).toMatchObject(transactionInput);
      expect(result.id).toMatch(/^txn_\d+_[a-z0-9]+$/);
    });

    it("should not update customer for non-sale transactions", async () => {
      const refundTransaction = {
        ...transactionInput,
        type: "refund" as const,
      };

      setupMockExecuteSql();

      await databaseService.createTransaction(refundTransaction);

      // Should succeed without errors
      expect(mockExecuteSql).toHaveBeenCalled();
    });
  });

  describe("getAnalytics", () => {
    it("should return analytics data correctly", async () => {
      const mockAnalyticsData = {
        totalCustomers: 10,
        totalTransactions: 50,
        totalRevenue: 500000,
        topCustomers: [
          { id: "cust_1", name: "Top Customer", totalSpent: 100000 },
        ],
      };

      // Mock the transaction method to handle the nested executeSql chain
      mockTransaction.mockImplementation((callback: any) => {
        const mockTx = {
          executeSql: (
            sql: string,
            params: any[],
            success?: any,
            error?: any
          ) => {
            if (sql.includes("SELECT COUNT(*) as count FROM customers")) {
              // Total customers query - call success which will trigger next query
              if (success) {
                success(null, {
                  rows: {
                    length: 1,
                    item: () => ({ count: mockAnalyticsData.totalCustomers }),
                  },
                });
              }
            } else if (
              sql.includes(
                'SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE type = "sale"'
              )
            ) {
              // Total revenue and transactions query - call success which will trigger next query
              if (success) {
                success(null, {
                  rows: {
                    length: 1,
                    item: () => ({
                      count: mockAnalyticsData.totalTransactions,
                      total: mockAnalyticsData.totalRevenue,
                    }),
                  },
                });
              }
            } else if (
              sql.includes(
                "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 5"
              )
            ) {
              // Top customers query - final query that resolves the promise
              if (success) {
                success(null, {
                  rows: {
                    length: mockAnalyticsData.topCustomers.length,
                    item: (index: number) =>
                      mockAnalyticsData.topCustomers[index],
                  },
                });
              }
            }
          },
        };

        // Execute the transaction callback
        callback(mockTx);
      });

      setupMockExecuteSql(); // For initialization

      const result = await databaseService.getAnalytics();

      expect(result).toEqual({
        totalCustomers: mockAnalyticsData.totalCustomers,
        totalRevenue: mockAnalyticsData.totalRevenue,
        totalTransactions: mockAnalyticsData.totalTransactions,
        topCustomers: mockAnalyticsData.topCustomers,
      });
    });
  });

  describe("clearAllData", () => {
    it("should clear all data from database", async () => {
      mockExecuteSql.mockImplementation((sql, params, success) => {
        if (success) success();
      });

      await databaseService.clearAllData();

      expect(mockExecuteSql).toHaveBeenCalledWith("DELETE FROM transactions");
      expect(mockExecuteSql).toHaveBeenCalledWith("DELETE FROM customers");
    });
  });
});
