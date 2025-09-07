import * as SQLite from "expo-sqlite";
import {
  CreateTransactionInput,
  PaymentMethod,
  TransactionStatus,
} from "../../types/transaction";
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

describe("TransactionRepository - Debt Management", () => {
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
      outstandingBalance: 0,
      lastPurchase: undefined,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    mockCustomerRepo.updateTotalSpent.mockResolvedValue(undefined);
    mockCustomerRepo.updateTotals.mockResolvedValue(undefined);
    mockCustomerRepo.increaseOutstandingBalance.mockResolvedValue(undefined);
    mockCustomerRepo.decreaseOutstandingBalance.mockResolvedValue(undefined);
    mockAudit.logEntry.mockResolvedValue(undefined);
    mockGenerateId.mockReturnValue("txn_debt_test_123");

    // Mock SQLite.openDatabaseAsync to return our mock database
    mockSQLite.openDatabaseAsync.mockResolvedValue(mockDb);

    transactionRepository = new TransactionRepository(
      mockDb,
      mockAudit,
      mockCustomerRepo
    );
  });

  describe("create - Debt Management", () => {
    it("should create a credit transaction with debt", async () => {
      const creditTransactionData: CreateTransactionInput = {
        customerId: "cust_1",
        amount: 50000, // ₦500
        description: "Credit purchase",
        date: "2024-01-15T10:30:00Z",
        type: "sale" as const,
        paymentMethod: "credit",
        paidAmount: 20000, // ₦200 paid immediately
        remainingAmount: 30000, // ₦300 as debt
        dueDate: "2024-02-15T00:00:00Z",
      };

      const result = await transactionRepository.create(creditTransactionData);

      expect(result).toEqual({
        id: "txn_debt_test_123",
        customerId: "cust_1",
        productId: undefined,
        amount: 50000,
        description: "Credit purchase",
        date: "2024-01-15T10:30:00Z",
        type: "sale",
        paymentMethod: "credit",
        paidAmount: 20000,
        remainingAmount: 30000,
        status: "pending",
        linkedTransactionId: undefined,
        dueDate: "2024-02-15T00:00:00Z",
        currency: "NGN",
        exchangeRate: 1,
        metadata: undefined,
        isDeleted: false,
      });

      // Verify SQL queries for debt management within transaction
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET totalSpent = totalSpent + ?"
        ),
        expect.arrayContaining([50000, expect.any(String), "cust_1"])
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET outstandingBalance = outstandingBalance + ?"
        ),
        expect.arrayContaining([30000, expect.any(String), "cust_1"])
      );
    });

    it("should create a payment transaction that reduces debt", async () => {
      const paymentTransactionData: CreateTransactionInput = {
        customerId: "cust_1",
        amount: 15000, // ₦150 payment
        description: "Partial payment",
        date: "2024-01-16T14:20:00Z",
        type: "payment" as const,
        paymentMethod: "cash",
        linkedTransactionId: "txn_original_123",
        appliedToDebt: true,
      };

      const result = await transactionRepository.create(paymentTransactionData);

      expect(result).toEqual({
        id: "txn_debt_test_123",
        customerId: "cust_1",
        productId: undefined,
        amount: 15000,
        description: "Partial payment",
        date: "2024-01-16T14:20:00Z",
        type: "payment",
        paymentMethod: "cash",
        paidAmount: 15000,
        remainingAmount: 0,
        status: "completed",
        linkedTransactionId: "txn_original_123",
        appliedToDebt: true,
        dueDate: undefined,
        currency: "NGN",
        exchangeRate: 1,
        metadata: undefined,
        isDeleted: false,
      });

      // Verify SQL query for payment reducing debt
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?)"
        ),
        expect.arrayContaining([15000, expect.any(String), "cust_1"])
      );
    });

    it("should handle mixed payment method", async () => {
      const mixedTransactionData: CreateTransactionInput = {
        customerId: "cust_1",
        amount: 75000, // ₦750
        description: "Mixed payment sale",
        date: "2024-01-17T10:00:00Z",
        type: "sale" as const,
        paymentMethod: "mixed",
        paidAmount: 50000, // ₦500 cash
        remainingAmount: 25000, // ₦250 credit
        dueDate: "2024-02-17T00:00:00Z",
      };

      const result = await transactionRepository.create(mixedTransactionData);

      expect(result.paymentMethod).toBe("mixed");
      expect(result.paidAmount).toBe(50000);
      expect(result.remainingAmount).toBe(25000);
      expect(result.status).toBe("partial");

      // Verify SQL queries for mixed payment
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET totalSpent = totalSpent + ?"
        ),
        expect.arrayContaining([75000, expect.any(String), "cust_1"])
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET outstandingBalance = outstandingBalance + ?"
        ),
        expect.arrayContaining([25000, expect.any(String), "cust_1"])
      );
    });

    it("should create full cash payment transaction", async () => {
      const cashTransactionData: CreateTransactionInput = {
        customerId: "cust_1",
        amount: 25000,
        description: "Cash sale",
        date: "2024-01-18T12:00:00Z",
        type: "sale" as const,
        paymentMethod: "cash",
        paidAmount: 25000,
        remainingAmount: 0,
      };

      const result = await transactionRepository.create(cashTransactionData);

      expect(result.paymentMethod).toBe("cash");
      expect(result.paidAmount).toBe(25000);
      expect(result.remainingAmount).toBe(0);
      expect(result.status).toBe("completed");

      // Verify SQL query for total spent update only (no debt for cash payment)
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET totalSpent = totalSpent + ?"
        ),
        expect.arrayContaining([25000, expect.any(String), "cust_1"])
      );

      // Should not update outstanding balance for cash payment
      const outstandingBalanceCalls = mockDb.runAsync.mock.calls.filter(
        (call: any[]) => call[0]?.includes("outstandingBalance")
      );
      expect(outstandingBalanceCalls.length).toBe(0);
    });

    it("should validate debt management fields", async () => {
      const invalidTransactionData: CreateTransactionInput = {
        customerId: "cust_1",
        amount: 50000,
        description: "Invalid credit",
        date: "2024-01-15T10:30:00Z",
        type: "sale" as const,
        paymentMethod: "credit",
        paidAmount: 60000, // More than total amount - invalid
        remainingAmount: -10000,
      };

      mockValidationService.validateTransactionInput.mockImplementation(() => {
        throw new Error("Paid amount cannot exceed total amount");
      });

      await expect(
        transactionRepository.create(invalidTransactionData)
      ).rejects.toThrow("Paid amount cannot exceed total amount");

      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it("should handle refund that reduces outstanding balance", async () => {
      const refundTransactionData: CreateTransactionInput = {
        customerId: "cust_1",
        amount: 10000,
        description: "Product refund",
        date: "2024-01-19T16:00:00Z",
        type: "refund" as const,
        paymentMethod: "cash",
        linkedTransactionId: "txn_original_456",
      };

      const result = await transactionRepository.create(refundTransactionData);

      expect(result.type).toBe("refund");
      expect(result.amount).toBe(10000);
      expect(result.status).toBe("completed");

      // Verify SQL query for refund reducing outstanding balance
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?)"
        ),
        expect.arrayContaining([10000, expect.any(String), "cust_1"])
      );
    });
  });

  describe("update - Debt Management", () => {
    it("should update transaction debt fields", async () => {
      const existingTransaction = {
        id: "txn_1",
        customerId: "cust_1",
        amount: 50000,
        description: "Original sale",
        date: "2024-01-15T10:30:00Z",
        type: "sale",
        paymentMethod: "cash",
        paidAmount: 50000,
        remainingAmount: 0,
        status: "completed",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingTransaction);

      const updateData = {
        paymentMethod: "credit" as PaymentMethod,
        paidAmount: 20000,
        remainingAmount: 30000,
        dueDate: "2024-02-15T00:00:00Z",
        status: "pending" as TransactionStatus,
      };

      await transactionRepository.update("txn_1", updateData);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE transactions SET"),
        expect.arrayContaining([
          "credit",
          20000,
          30000,
          "2024-02-15T00:00:00Z",
          "pending",
          "txn_1",
        ])
      );

      // Should adjust outstanding balance: +30000 (new debt) - 0 (old debt) = +30000
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET outstandingBalance = outstandingBalance + ?"
        ),
        expect.arrayContaining([30000, expect.any(String), "cust_1"])
      );
    });

    it("should handle payment status changes", async () => {
      const existingTransaction = {
        id: "txn_1",
        customerId: "cust_1",
        amount: 50000,
        type: "sale",
        paymentMethod: "credit",
        paidAmount: 20000,
        remainingAmount: 30000,
        status: "pending",
      };

      mockDb.getFirstAsync.mockResolvedValue(existingTransaction);

      const updateData = {
        status: "completed" as TransactionStatus,
        paidAmount: 50000,
        remainingAmount: 0,
      };

      await transactionRepository.update("txn_1", updateData);

      // Should reduce outstanding balance by 30000 (remaining amount)
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE customers SET outstandingBalance = MAX(0, outstandingBalance - ?)"
        ),
        expect.arrayContaining([30000, expect.any(String), "cust_1"])
      );
    });
  });

  describe("findByCustomer - Debt Information", () => {
    it("should return transactions with debt information", async () => {
      const mockTransactions = [
        {
          id: "txn_1",
          customerId: "cust_1",
          amount: 50000,
          description: "Credit sale",
          date: "2024-01-15T10:30:00Z",
          type: "sale",
          paymentMethod: "credit",
          paidAmount: 20000,
          remainingAmount: 30000,
          status: "pending",
          dueDate: "2024-02-15T00:00:00Z",
        },
        {
          id: "txn_2",
          customerId: "cust_1",
          amount: 15000,
          description: "Partial payment",
          date: "2024-01-16T14:20:00Z",
          type: "payment",
          paymentMethod: "cash",
          paidAmount: 15000,
          remainingAmount: 0,
          status: "completed",
          linkedTransactionId: "txn_1",
          appliedToDebt: true,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockTransactions);

      const result = await transactionRepository.findByCustomer("cust_1");

      expect(result).toEqual(mockTransactions);
      expect(result[0].remainingAmount).toBe(30000);
      expect(result[1].appliedToDebt).toBe(true);
    });
  });
});
