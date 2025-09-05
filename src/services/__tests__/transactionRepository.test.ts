import * as SQLite from "expo-sqlite";
import { CreateTransactionInput } from "../../types/transaction";
import { generateId } from "../../utils/helpers";
import { TransactionRepository } from "../database/repositories/TransactionRepository";
import { ValidationService } from "../database/service/ValidationService";

// Mock dependencies
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock("../database/repositories/CustomerRepository");
jest.mock("../database/service/AuditLogService");
jest.mock("../database/service/ValidationService");
jest.mock("../../utils/helpers");

const mockSQLite = SQLite as jest.Mocked<typeof SQLite>;
const mockGenerateId = generateId as jest.MockedFunction<typeof generateId>;

describe("TransactionRepository", () => {
  let transactionRepository: TransactionRepository;
  let mockDb: any;
  let mockCustomerRepo: any;
  let mockAudit: any;
  let mockValidationService: any;

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

    // Create mock instances
    mockCustomerRepo = {
      findById: jest.fn(),
      updateTotalSpent: jest.fn(),
      updateTotals: jest.fn(),
      increaseOutstandingBalance: jest.fn(),
      decreaseOutstandingBalance: jest.fn(),
      getOutstandingBalance: jest.fn(),
    } as any;

    mockAudit = {
      logEntry: jest.fn(),
    } as any;

    mockValidationService = {
      validateTransactionInput: jest.fn(),
    };

    // Replace the mocked ValidationService
    (ValidationService as any).validateTransactionInput =
      mockValidationService.validateTransactionInput;

    // Setup mock implementations
    mockCustomerRepo.findById.mockResolvedValue({
      id: "cust_1",
      name: "Test Customer",
      phone: "+1234567890",
      totalSpent: 0,
      lastPurchase: undefined,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    mockCustomerRepo.updateTotalSpent.mockResolvedValue(undefined);
    mockCustomerRepo.updateTotals.mockResolvedValue(undefined);
    mockAudit.logEntry.mockResolvedValue(undefined);
    mockGenerateId.mockReturnValue("txn_test_123");

    // Mock SQLite.openDatabaseAsync to return our mock database
    mockSQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    transactionRepository = new TransactionRepository(
      mockDb,
      mockAudit,
      mockCustomerRepo
    );
  });

  describe("create", () => {
    const validTransactionData: CreateTransactionInput = {
      customerId: "cust_1",
      amount: 25000,
      description: "Product sale",
      date: "2024-01-15T10:30:00Z",
      type: "sale" as const,
    };

    it("should create a transaction successfully", async () => {
      const result = await transactionRepository.create(validTransactionData);

      expect(result).toEqual({
        id: "txn_test_123",
        customerId: "cust_1",
        productId: undefined,
        amount: 25000,
        description: "Product sale",
        date: "2024-01-15T10:30:00Z",
        type: "sale",
        paymentMethod: "cash",
        paidAmount: 25000,
        remainingAmount: 0,
        status: "completed",
        linkedTransactionId: undefined,
        dueDate: undefined,
        currency: "NGN",
        exchangeRate: 1,
        metadata: undefined,
        isDeleted: false,
      });

      expect(
        mockValidationService.validateTransactionInput
      ).toHaveBeenCalledWith(validTransactionData);
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith("cust_1");
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO transactions"),
        expect.any(Array)
      );
      expect(mockCustomerRepo.updateTotalSpent).not.toHaveBeenCalled();
      expect(mockAudit.logEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: "transactions",
          operation: "CREATE",
          recordId: "txn_test_123",
        })
      );
    });

    it("should handle optional productId", async () => {
      const dataWithProductId = {
        ...validTransactionData,
        productId: "prod_1",
      };

      await transactionRepository.create(dataWithProductId);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO transactions"),
        expect.arrayContaining(["prod_1"])
      );
    });

    it("should handle optional description", async () => {
      const dataWithoutDescription = {
        customerId: "cust_1",
        amount: 15000,
        date: "2024-01-15T10:30:00Z",
        type: "payment" as const,
      };

      await transactionRepository.create(dataWithoutDescription);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO transactions"),
        expect.arrayContaining([null]) // null for description
      );
    });

    it("should throw error for non-existent customer", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(
        transactionRepository.create(validTransactionData)
      ).rejects.toThrow("Customer with identifier 'cust_1' not found");

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      mockValidationService.validateTransactionInput.mockImplementation(() => {
        throw new Error("Validation failed");
      });

      await expect(
        transactionRepository.create(validTransactionData)
      ).rejects.toThrow("Validation failed");

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockDb.runAsync.mockRejectedValue(new Error("Database error"));

      await expect(
        transactionRepository.create(validTransactionData)
      ).rejects.toThrow("Database error");
    });
  });

  describe("findByCustomer", () => {
    it("should return transactions for a customer", async () => {
      const mockTransactions = [
        {
          id: "txn_1",
          customerId: "cust_1",
          amount: 25000,
          description: "Sale 1",
          date: "2024-01-15T10:30:00Z",
          type: "sale",
        },
        {
          id: "txn_2",
          customerId: "cust_1",
          amount: 15000,
          description: "Sale 2",
          date: "2024-01-16T14:20:00Z",
          type: "sale",
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockTransactions);

      const result = await transactionRepository.findByCustomer("cust_1");

      expect(result).toEqual(mockTransactions);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC",
        ["cust_1"]
      );
    });

    it("should return empty array for customer with no transactions", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await transactionRepository.findByCustomer("cust_empty");

      expect(result).toEqual([]);
    });

    it("should throw error for empty customer ID", async () => {
      await expect(transactionRepository.findByCustomer("")).rejects.toThrow(
        "Customer ID is required"
      );

      expect(mockDb.getAllAsync).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockDb.getAllAsync.mockRejectedValue(new Error("Query failed"));

      await expect(
        transactionRepository.findByCustomer("cust_1")
      ).rejects.toThrow("Query failed");
    });
  });

  describe("findById", () => {
    it("should return transaction by ID", async () => {
      const mockTransaction = {
        id: "txn_1",
        customerId: "cust_1",
        amount: 25000,
        description: "Test transaction",
        date: "2024-01-15T10:30:00Z",
        type: "sale",
      };

      mockDb.getFirstAsync.mockResolvedValue(mockTransaction);

      const result = await transactionRepository.findById("txn_1");

      expect(result).toEqual(mockTransaction);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT * FROM transactions WHERE id = ?",
        ["txn_1"]
      );
    });

    it("should return null for non-existent transaction", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await transactionRepository.findById("txn_nonexistent");

      expect(result).toBeNull();
    });

    it("should throw error for empty transaction ID", async () => {
      await expect(transactionRepository.findById("")).rejects.toThrow(
        "Transaction ID is required"
      );

      expect(mockDb.getFirstAsync).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateData = {
      amount: 30000,
      description: "Updated description",
    };

    it("should update transaction successfully", async () => {
      const existingTransaction = {
        id: "txn_1",
        customerId: "cust_1",
        amount: 25000,
        description: "Original description",
        date: "2024-01-15T10:30:00Z",
        type: "sale",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingTransaction);

      await transactionRepository.update("txn_1", updateData);

      expect(
        mockValidationService.validateTransactionInput
      ).toHaveBeenCalledWith(updateData);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE transactions SET"),
        expect.any(Array)
      );
      expect(mockCustomerRepo.updateTotalSpent).not.toHaveBeenCalled();
      expect(mockAudit.logEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: "transactions",
          operation: "UPDATE",
          recordId: "txn_1",
        })
      );
    });

    it("should handle date updates", async () => {
      const dateUpdate = {
        date: "2024-01-20T15:45:00Z",
      };

      const existingTransaction = {
        id: "txn_1",
        customerId: "cust_1",
        amount: 25000,
        date: "2024-01-15T10:30:00Z",
        type: "sale",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingTransaction);

      await transactionRepository.update("txn_1", dateUpdate);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE transactions SET"),
        expect.arrayContaining(["2024-01-20T15:45:00.000Z"])
      );
    });

    it("should throw error for non-existent transaction", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await expect(
        transactionRepository.update("txn_nonexistent", updateData)
      ).rejects.toThrow(
        "Transaction with identifier 'txn_nonexistent' not found"
      );

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const existingTransaction = {
        id: "txn_1",
        customerId: "cust_1",
        amount: 25000,
        date: "2024-01-15T10:30:00Z",
        type: "sale",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingTransaction);
      mockDb.runAsync.mockRejectedValue(new Error("Update failed"));

      await expect(
        transactionRepository.update("txn_1", updateData)
      ).rejects.toThrow("Update failed");
    });
  });

  describe("delete", () => {
    it("should delete transaction successfully", async () => {
      const existingTransaction = {
        id: "txn_1",
        customerId: "cust_1",
        amount: 25000,
        date: "2024-01-15T10:30:00Z",
        type: "sale",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingTransaction);

      await transactionRepository.delete("txn_1");

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "DELETE FROM transactions WHERE id = ?",
        ["txn_1"]
      );
      expect(mockCustomerRepo.updateTotals).toHaveBeenCalledWith(["cust_1"]);
      expect(mockAudit.logEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: "transactions",
          operation: "DELETE",
          recordId: "txn_1",
        })
      );
    });

    it("should throw error for non-existent transaction", async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      await expect(
        transactionRepository.delete("txn_nonexistent")
      ).rejects.toThrow(
        "Transaction with identifier 'txn_nonexistent' not found"
      );

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const existingTransaction = {
        id: "txn_1",
        customerId: "cust_1",
        amount: 25000,
        date: "2024-01-15T10:30:00Z",
        type: "sale",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingTransaction);
      mockDb.runAsync.mockRejectedValue(new Error("Delete failed"));

      await expect(transactionRepository.delete("txn_1")).rejects.toThrow(
        "Delete failed"
      );
    });
  });

  describe("getAllTransactions", () => {
    it("should return all transactions", async () => {
      const mockTransactions = [
        {
          id: "txn_1",
          customerId: "cust_1",
          amount: 25000,
          date: "2024-01-15T10:30:00Z",
          type: "sale",
        },
        {
          id: "txn_2",
          customerId: "cust_2",
          amount: 15000,
          date: "2024-01-16T14:20:00Z",
          type: "payment",
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockTransactions);

      const result = await transactionRepository.getAllTransactions();

      expect(result).toEqual(mockTransactions);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        "SELECT * FROM transactions ORDER BY date DESC"
      );
    });

    it("should return empty array when no transactions exist", async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await transactionRepository.getAllTransactions();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockDb.getAllAsync.mockRejectedValue(new Error("Query failed"));

      await expect(transactionRepository.getAllTransactions()).rejects.toThrow(
        "Query failed"
      );
    });
  });

  describe("IBaseRepository methods", () => {
    describe("findAll", () => {
      it("should return all transactions without search query", async () => {
        const mockTransactions = [
          { id: "txn_1", description: "Sale 1" },
          { id: "txn_2", description: "Payment 2" },
        ];

        mockDb.getAllAsync.mockResolvedValue(mockTransactions);

        const result = await transactionRepository.findAll();

        expect(result).toEqual(mockTransactions);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          "SELECT * FROM transactions ORDER BY date DESC"
        );
      });

      it("should filter transactions by search query", async () => {
        const mockTransactions = [{ id: "txn_1", description: "Product sale" }];

        mockDb.getAllAsync.mockResolvedValue(mockTransactions);

        const result = await transactionRepository.findAll("sale");

        expect(result).toEqual(mockTransactions);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          "SELECT * FROM transactions WHERE description LIKE ? ORDER BY date DESC",
          ["%sale%"]
        );
      });
    });

    describe("exists", () => {
      it("should return true for existing transaction", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ count: 1 });

        const result = await transactionRepository.exists("txn_1");

        expect(result).toBe(true);
        expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
          "SELECT COUNT(*) as count FROM transactions WHERE id = ?",
          ["txn_1"]
        );
      });

      it("should return false for non-existent transaction", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

        const result = await transactionRepository.exists("txn_nonexistent");

        expect(result).toBe(false);
      });
    });

    describe("count", () => {
      it("should return total transaction count", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ count: 150 });

        const result = await transactionRepository.count();

        expect(result).toBe(150);
        expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
          "SELECT COUNT(*) as count FROM transactions"
        );
      });

      it("should return filtered count", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ count: 25 });

        const result = await transactionRepository.count("sale");

        expect(result).toBe(25);
        expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
          "SELECT COUNT(*) as count FROM transactions WHERE description LIKE ?",
          ["%sale%"]
        );
      });
    });
  });

  describe("IPaginatedRepository methods", () => {
    describe("findWithPagination", () => {
      it("should return paginated results", async () => {
        const mockTransactions = [
          { id: "txn_1", description: "Transaction 1" },
          { id: "txn_2", description: "Transaction 2" },
        ];

        mockDb.getAllAsync.mockResolvedValue(mockTransactions);
        mockDb.getFirstAsync.mockResolvedValue({ count: 25 });

        const result = await transactionRepository.findWithPagination(
          undefined,
          2,
          10
        );

        expect(result.items).toEqual(mockTransactions);
        expect(result.totalCount).toBe(25);
        expect(result.currentPage).toBe(2);
        expect(result.totalPages).toBe(3);
        expect(result.hasNextPage).toBe(true);
        expect(result.hasPreviousPage).toBe(true);
      });

      it("should handle first page", async () => {
        mockDb.getAllAsync.mockResolvedValue([]);
        mockDb.getFirstAsync.mockResolvedValue({ count: 5 });

        const result = await transactionRepository.findWithPagination(
          undefined,
          1,
          10
        );

        expect(result.hasPreviousPage).toBe(false);
        expect(result.hasNextPage).toBe(false);
      });

      it("should apply search filter with pagination", async () => {
        mockDb.getAllAsync.mockResolvedValue([]);
        mockDb.getFirstAsync.mockResolvedValue({ count: 10 });

        await transactionRepository.findWithPagination("sale", 1, 5);

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining("WHERE description LIKE ?"),
          expect.arrayContaining(["%sale%"])
        );
      });
    });
  });

  describe("Transaction-specific query methods", () => {
    describe("findByCustomerId", () => {
      it("should delegate to findByCustomer", async () => {
        const mockTransactions = [{ id: "txn_1", customerId: "cust_1" }];
        mockDb.getAllAsync.mockResolvedValue(mockTransactions);

        const result = await transactionRepository.findByCustomerId("cust_1");

        expect(result).toEqual(mockTransactions);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC",
          ["cust_1"]
        );
      });
    });

    describe("findByType", () => {
      it("should return transactions by type", async () => {
        const mockTransactions = [
          { id: "txn_1", type: "sale" },
          { id: "txn_2", type: "sale" },
        ];

        mockDb.getAllAsync.mockResolvedValue(mockTransactions);

        const result = await transactionRepository.findByType("sale");

        expect(result).toEqual(mockTransactions);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          "SELECT * FROM transactions WHERE type = ? ORDER BY date DESC",
          ["sale"]
        );
      });

      it("should throw error for empty type", async () => {
        await expect(transactionRepository.findByType("")).rejects.toThrow(
          "Transaction type is required"
        );
      });
    });

    describe("findByDateRange", () => {
      it("should return transactions within date range", async () => {
        const mockTransactions = [{ id: "txn_1", date: "2024-01-15" }];

        mockDb.getAllAsync.mockResolvedValue(mockTransactions);

        const result = await transactionRepository.findByDateRange(
          "2024-01-01",
          "2024-01-31"
        );

        expect(result).toEqual(mockTransactions);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          "SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC",
          ["2024-01-01", "2024-01-31"]
        );
      });

      it("should throw error for missing dates", async () => {
        await expect(
          transactionRepository.findByDateRange("", "2024-01-31")
        ).rejects.toThrow("Start date and end date are required");
      });
    });

    describe("findByAmountRange", () => {
      it("should return transactions within amount range", async () => {
        const mockTransactions = [{ id: "txn_1", amount: 20000 }];

        mockDb.getAllAsync.mockResolvedValue(mockTransactions);

        const result = await transactionRepository.findByAmountRange(
          10000,
          30000
        );

        expect(result).toEqual(mockTransactions);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          "SELECT * FROM transactions WHERE amount >= ? AND amount <= ? ORDER BY date DESC",
          [10000, 30000]
        );
      });

      it("should throw error for invalid range", async () => {
        await expect(
          transactionRepository.findByAmountRange(30000, 10000)
        ).rejects.toThrow("Invalid amount range");
      });
    });
  });

  describe("Analytics methods", () => {
    describe("getTotalByCustomer", () => {
      it("should return total amount for customer", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ total: 75000 });

        const result = await transactionRepository.getTotalByCustomer("cust_1");

        expect(result).toBe(75000);
        expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
          "SELECT SUM(amount) as total FROM transactions WHERE customerId = ?",
          ["cust_1"]
        );
      });

      it("should return 0 for customer with no transactions", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ total: null });

        const result = await transactionRepository.getTotalByCustomer(
          "cust_empty"
        );

        expect(result).toBe(0);
      });
    });

    describe("getTransactionStats", () => {
      it("should return comprehensive transaction statistics", async () => {
        mockDb.getFirstAsync
          .mockResolvedValueOnce({ totalTransactions: 100 })
          .mockResolvedValueOnce({ totalRevenue: 250000 })
          .mockResolvedValueOnce({ averageAmount: 2500 })
          .mockResolvedValueOnce({ salesCount: 80 })
          .mockResolvedValueOnce({ refundCount: 10 })
          .mockResolvedValueOnce({ paymentCount: 10 });

        const result = await transactionRepository.getTransactionStats();

        expect(result.totalTransactions).toBe(100);
        expect(result.totalRevenue).toBe(250000);
        expect(result.averageAmount).toBe(2500);
        expect(result.salesCount).toBe(80);
        expect(result.refundCount).toBe(10);
        expect(result.paymentCount).toBe(10);
      });
    });
  });

  describe("Bulk operations", () => {
    describe("createBulk", () => {
      it("should create multiple transactions", async () => {
        const transactions: CreateTransactionInput[] = [
          {
            customerId: "cust_1",
            amount: 25000,
            date: "2024-01-15T10:30:00Z",
            type: "sale" as const,
          },
          {
            customerId: "cust_2",
            amount: 15000,
            date: "2024-01-16T14:20:00Z",
            type: "payment" as const,
          },
        ];

        const result = await transactionRepository.createBulk(transactions);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe("txn_test_123");
        expect(result[1].id).toBe("txn_test_123");
        expect(mockCustomerRepo.updateTotals).toHaveBeenCalledWith([
          "cust_1",
          "cust_2",
        ]);
      });

      it("should throw error for empty array", async () => {
        await expect(transactionRepository.createBulk([])).rejects.toThrow(
          "At least one transaction is required"
        );
      });
    });

    describe("updateBulk", () => {
      it("should update multiple transactions", async () => {
        const updates = [
          {
            id: "txn_1",
            data: { amount: 30000 },
          },
          {
            id: "txn_2",
            data: { description: "Updated" },
          },
        ];

        mockDb.getFirstAsync
          .mockResolvedValueOnce({
            id: "txn_1",
            customerId: "cust_1",
            amount: 25000,
            date: "2024-01-15T10:30:00Z",
            type: "sale",
          })
          .mockResolvedValueOnce({
            id: "txn_2",
            customerId: "cust_2",
            amount: 15000,
            date: "2024-01-16T14:20:00Z",
            type: "payment",
          })
          .mockResolvedValueOnce({
            id: "txn_1",
            customerId: "cust_1",
            amount: 25000,
            date: "2024-01-15T10:30:00Z",
            type: "sale",
          })
          .mockResolvedValueOnce({
            id: "txn_2",
            customerId: "cust_2",
            amount: 15000,
            date: "2024-01-16T14:20:00Z",
            type: "payment",
          });

        await transactionRepository.updateBulk(updates);

        expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
        expect(mockCustomerRepo.updateTotals).toHaveBeenCalledWith([
          "cust_1",
          "cust_2",
        ]);
      });
    });

    describe("deleteBulk", () => {
      it("should delete multiple transactions", async () => {
        const transactionIds = ["txn_1", "txn_2"];

        mockDb.getFirstAsync
          .mockResolvedValueOnce({
            id: "txn_1",
            customerId: "cust_1",
            amount: 25000,
            date: "2024-01-15T10:30:00Z",
            type: "sale",
          })
          .mockResolvedValueOnce({
            id: "txn_2",
            customerId: "cust_2",
            amount: 15000,
            date: "2024-01-16T14:20:00Z",
            type: "payment",
          });

        await transactionRepository.deleteBulk(transactionIds);

        expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
        expect(mockCustomerRepo.updateTotals).toHaveBeenCalledWith([
          "cust_1",
          "cust_2",
        ]);
      });
    });
  });
});
