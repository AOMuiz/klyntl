import { CreateCustomerInput, UpdateCustomerInput } from "../../types/customer";
import { CreateTransactionInput } from "../../types/transaction";
import { DatabaseService } from "../database";

// Mock expo-sqlite for testing
jest.mock("expo-sqlite");

describe("DatabaseService", () => {
  let databaseService: DatabaseService;
  let mockTransaction: jest.Mock;
  let mockExecuteSql: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock functions
    mockExecuteSql = jest.fn();
    mockTransaction = jest.fn((callback, errorCallback, successCallback) => {
      const tx = { executeSql: mockExecuteSql };
      callback(tx);
      if (successCallback) successCallback();
    });

    // Mock the database instance
    const mockDb = { transaction: mockTransaction };

    // Mock SQLite.openDatabase
    const { openDatabase } = require("expo-sqlite");
    (openDatabase as jest.Mock).mockReturnValue(mockDb);

    databaseService = new DatabaseService("test.db");
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
      mockExecuteSql.mockImplementationOnce((sql, params, success) => {
        success();
      });

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
      mockExecuteSql.mockImplementationOnce((sql, params, success, error) => {
        if (error) {
          error(null, new Error("Duplicate phone number"));
        }
        return false;
      });

      await expect(
        databaseService.createCustomer(customerInput)
      ).rejects.toThrow("Duplicate phone number");
    });

    it("should generate unique customer IDs", async () => {
      mockExecuteSql.mockImplementation((sql, params, success) => {
        success();
      });

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
      mockExecuteSql.mockImplementationOnce((sql, params, success) => {
        const rows = {
          length: mockCustomers.length,
          item: (index: number) => mockCustomers[index],
        };
        success(null, { rows });
      });

      const result = await databaseService.getCustomers();

      expect(result).toEqual(mockCustomers);
      expect(mockExecuteSql).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY name ASC",
        [],
        expect.any(Function),
        expect.any(Function)
      );
    });

    it("should filter customers by search query", async () => {
      const filteredCustomers = [mockCustomers[0]];
      mockExecuteSql.mockImplementationOnce((sql, params, success) => {
        const rows = {
          length: filteredCustomers.length,
          item: (index: number) => filteredCustomers[index],
        };
        success(null, { rows });
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
      mockExecuteSql.mockImplementationOnce((sql, params, success, error) => {
        if (error) {
          error(null, new Error("Database query failed"));
        }
        return false;
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
      mockExecuteSql.mockImplementationOnce((sql, params, success) => {
        success();
      });

      await databaseService.updateCustomer("cust_1", updateData);

      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE customers SET"),
        expect.arrayContaining(["John Updated", "john.updated@example.com"]),
        expect.any(Function),
        expect.any(Function)
      );
    });

    it("should handle update errors", async () => {
      mockExecuteSql.mockImplementationOnce((sql, params, success, error) => {
        if (error) {
          error(null, new Error("Update failed"));
        }
        return false;
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
      mockExecuteSql
        .mockImplementationOnce((sql, params, success) => {
          // Mock transaction insert
          success();
        })
        .mockImplementationOnce((sql, params, success) => {
          // Mock customer update
          success();
        });

      const result = await databaseService.createTransaction(transactionInput);

      expect(result).toMatchObject(transactionInput);
      expect(result.id).toMatch(/^txn_\d+_[a-z0-9]+$/);
      expect(mockExecuteSql).toHaveBeenCalledTimes(2); // Insert transaction + update customer
    });

    it("should not update customer for non-sale transactions", async () => {
      const refundTransaction = {
        ...transactionInput,
        type: "refund" as const,
      };

      mockExecuteSql.mockImplementationOnce((sql, params, success) => {
        success();
      });

      await databaseService.createTransaction(refundTransaction);

      expect(mockExecuteSql).toHaveBeenCalledTimes(1); // Only insert transaction
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

      mockExecuteSql
        .mockImplementationOnce((sql, params, success) => {
          // Total customers query
          success(null, {
            rows: { item: () => ({ count: mockAnalyticsData.totalCustomers }) },
          });
        })
        .mockImplementationOnce((sql, params, success) => {
          // Total revenue and transactions query
          success(null, {
            rows: {
              item: () => ({
                count: mockAnalyticsData.totalTransactions,
                total: mockAnalyticsData.totalRevenue,
              }),
            },
          });
        })
        .mockImplementationOnce((sql, params, success) => {
          // Top customers query
          success(null, {
            rows: {
              length: 1,
              item: () => mockAnalyticsData.topCustomers[0],
            },
          });
        });

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
