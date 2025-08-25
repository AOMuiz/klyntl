import * as SQLite from "expo-sqlite";
import { CreateCustomerInput, UpdateCustomerInput } from "../../types/customer";
import { CreateTransactionInput } from "../../types/transaction";
import { DatabaseService } from "../database/index";

// Mock expo-sqlite for testing
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

const mockSQLite = SQLite as jest.Mocked<typeof SQLite>;

describe("DatabaseService", () => {
  let databaseService: DatabaseService;
  let mockDb: any;

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

    // Mock SQLite.openDatabaseAsync to return our mock database
    mockSQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    databaseService = new DatabaseService("test.db");
  });

  describe("initialize", () => {
    it("should initialize database tables correctly", async () => {
      await databaseService.initialize();

      expect(mockDb.withTransactionAsync).toHaveBeenCalled();
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS customers"),
        []
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS transactions"),
        []
      );
    });

    it("should only initialize once", async () => {
      await databaseService.initialize();
      await databaseService.initialize();

      expect(mockDb.withTransactionAsync).toHaveBeenCalledTimes(1);
    });

    it("should handle initialization errors", async () => {
      mockDb.withTransactionAsync.mockRejectedValueOnce(
        new Error("Database error")
      );

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

    beforeEach(() => {
      // Mock successful initialization
      mockDb.withTransactionAsync.mockResolvedValue(undefined);
    });

    it("should create a customer successfully", async () => {
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
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO customers"),
        expect.arrayContaining([
          result.id,
          customerInput.name,
          customerInput.phone,
        ])
      );
    });

    it("should handle creation errors", async () => {
      mockDb.runAsync.mockRejectedValueOnce(
        new Error("Duplicate phone number")
      );

      await expect(
        databaseService.createCustomer(customerInput)
      ).rejects.toThrow("Duplicate phone number");
    });

    it("should generate unique customer IDs", async () => {
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

    beforeEach(() => {
      // Mock successful initialization
      mockDb.withTransactionAsync.mockResolvedValue(undefined);
    });

    it("should return all customers when no search query", async () => {
      mockDb.getAllAsync.mockResolvedValue(mockCustomers);

      const result = await databaseService.getCustomers();

      expect(result).toEqual(mockCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers ORDER BY name ASC",
        []
      );
    });

    it("should filter customers by search query", async () => {
      const filteredCustomers = [mockCustomers[0]];
      mockDb.getAllAsync.mockResolvedValue(filteredCustomers);

      const result = await databaseService.getCustomers("John");

      expect(result).toEqual(filteredCustomers);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC",
        ["%John%", "%John%"]
      );
    });

    it("should handle query errors", async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(
        new Error("Database query failed")
      );

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

    beforeEach(() => {
      // Mock successful initialization
      mockDb.withTransactionAsync.mockResolvedValue(undefined);
    });

    it("should update customer successfully", async () => {
      await databaseService.updateCustomer("cust_1", updateData);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE customers SET"),
        expect.arrayContaining(["John Updated", "john.updated@example.com"])
      );
    });

    it("should handle update errors", async () => {
      // Mock successful initialization but failing update
      mockDb.runAsync
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockRejectedValueOnce(new Error("Update failed")); // for actual update

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

    beforeEach(() => {
      // Mock successful initialization
      mockDb.withTransactionAsync.mockResolvedValue(undefined);
      // Mock successful customer total update queries
      mockDb.getFirstAsync.mockResolvedValue({ total: 25000 });
    });

    it("should create a transaction successfully", async () => {
      const result = await databaseService.createTransaction(transactionInput);

      expect(result).toMatchObject(transactionInput);
      expect(result.id).toMatch(/^txn_\d+_[a-z0-9]+$/);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO transactions"),
        expect.arrayContaining([
          result.id,
          transactionInput.customerId,
          transactionInput.amount,
          transactionInput.description,
          transactionInput.date,
          transactionInput.type,
        ])
      );
    });

    it("should handle transaction creation errors", async () => {
      // Mock successful initialization but failing transaction creation
      mockDb.runAsync
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockResolvedValueOnce({ changes: 1, lastInsertRowId: 1 }) // for initialization
        .mockRejectedValueOnce(new Error("Transaction failed")); // for actual transaction

      await expect(
        databaseService.createTransaction(transactionInput)
      ).rejects.toThrow("Transaction failed");
    });
  });

  describe("getAnalytics", () => {
    beforeEach(() => {
      // Mock successful initialization
      mockDb.withTransactionAsync.mockResolvedValue(undefined);
    });

    it("should return analytics data correctly", async () => {
      const mockAnalyticsData = {
        totalCustomers: 10,
        totalTransactions: 50,
        totalRevenue: 500000,
        topCustomers: [
          { id: "cust_1", name: "Top Customer", totalSpent: 100000 },
        ],
      };

      // Mock the individual queries
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: mockAnalyticsData.totalCustomers }) // customers count
        .mockResolvedValueOnce({ total: mockAnalyticsData.totalRevenue }) // revenue
        .mockResolvedValueOnce({ count: mockAnalyticsData.totalTransactions }); // transactions count

      mockDb.getAllAsync.mockResolvedValue(mockAnalyticsData.topCustomers);

      const result = await databaseService.getAnalytics();

      expect(result).toEqual({
        totalCustomers: mockAnalyticsData.totalCustomers,
        totalRevenue: mockAnalyticsData.totalRevenue,
        totalTransactions: mockAnalyticsData.totalTransactions,
        topCustomers: mockAnalyticsData.topCustomers,
      });
    });

    it("should handle analytics query errors", async () => {
      mockDb.getFirstAsync.mockRejectedValueOnce(new Error("Analytics failed"));

      await expect(databaseService.getAnalytics()).rejects.toThrow(
        "Analytics failed"
      );
    });
  });

  describe("clearAllData", () => {
    beforeEach(() => {
      // Mock successful initialization
      mockDb.withTransactionAsync.mockResolvedValue(undefined);
    });

    it("should clear all data from database", async () => {
      await databaseService.clearAllData();

      expect(mockDb.withTransactionAsync).toHaveBeenCalled();
    });

    it("should handle clear data errors", async () => {
      mockDb.withTransactionAsync.mockRejectedValueOnce(
        new Error("Clear failed")
      );

      await expect(databaseService.clearAllData()).rejects.toThrow(
        "Clear failed"
      );
    });
  });
});
