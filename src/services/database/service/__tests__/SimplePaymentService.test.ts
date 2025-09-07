import { SQLiteDatabase } from "expo-sqlite";
import { CustomerRepository } from "../../repositories/CustomerRepository";
import { SimplePaymentService } from "../SimplePaymentService";

// Mock dependencies
jest.mock("@/utils/helpers", () => ({
  generateId: jest.fn(() => "test-audit-id"),
}));

describe("SimplePaymentService", () => {
  let mockDb: jest.Mocked<SQLiteDatabase>;
  let mockCustomerRepo: jest.Mocked<CustomerRepository>;
  let paymentService: SimplePaymentService;

  const mockCustomer = {
    id: "customer-1",
    name: "Test Customer",
    phone: "+2348012345678",
    outstandingBalance: 1000,
    creditBalance: 0,
    totalSpent: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    // Mock SQLiteDatabase
    mockDb = {
      withTransactionAsync: jest.fn().mockImplementation(async (callback) => {
        return await callback();
      }),
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    } as any;

    // Mock CustomerRepository
    mockCustomerRepo = {
      findById: jest.fn(),
      decreaseOutstandingBalance: jest.fn(),
      increaseOutstandingBalance: jest.fn(),
    } as any;

    paymentService = new SimplePaymentService(mockDb, mockCustomerRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handlePaymentAllocation", () => {
    describe("Nigerian SME Edge Case 1: Payment for future service (no debt)", () => {
      it("should create credit balance when payment is for future service", async () => {
        mockCustomerRepo.findById.mockResolvedValue({
          ...mockCustomer,
          outstandingBalance: 0,
        });

        const result = await paymentService.handlePaymentAllocation(
          "customer-1",
          500,
          false // Payment for future service
        );

        expect(result).toEqual({
          debtReduced: 0,
          creditCreated: 500,
          success: true,
        });

        expect(mockDb.runAsync).toHaveBeenCalledWith(
          "UPDATE customers SET credit_balance = COALESCE(credit_balance, 0) + ? WHERE id = ?",
          [500, "customer-1"]
        );
      });
    });

    describe("Nigerian SME Edge Case 2: No existing debt scenario", () => {
      it("should convert payment to credit when customer has no debt", async () => {
        mockCustomerRepo.findById.mockResolvedValue({
          ...mockCustomer,
          outstandingBalance: 0,
        });

        const result = await paymentService.handlePaymentAllocation(
          "customer-1",
          300,
          true
        );

        expect(result).toEqual({
          debtReduced: 0,
          creditCreated: 300,
          success: true,
        });

        // Should create credit balance
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          "UPDATE customers SET credit_balance = COALESCE(credit_balance, 0) + ? WHERE id = ?",
          [300, "customer-1"]
        );

        // Should log audit
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO simple_payment_audit"),
          expect.arrayContaining([
            "test-audit-id",
            "customer-1",
            "payment",
            300,
            expect.any(String),
            "Payment converted to credit (no existing debt)",
          ])
        );
      });
    });

    describe("Nigerian SME Edge Case 3: Overpayment scenario", () => {
      it("should handle overpayment correctly (clear debt + create credit)", async () => {
        mockCustomerRepo.findById.mockResolvedValue({
          ...mockCustomer,
          outstandingBalance: 800,
        });

        const result = await paymentService.handlePaymentAllocation(
          "customer-1",
          1200, // Pay more than debt
          true
        );

        expect(result).toEqual({
          debtReduced: 800,
          creditCreated: 400,
          success: true,
        });

        // Should clear debt
        expect(
          mockCustomerRepo.decreaseOutstandingBalance
        ).toHaveBeenCalledWith("customer-1", 800);

        // Should create credit for excess
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          "UPDATE customers SET credit_balance = COALESCE(credit_balance, 0) + ? WHERE id = ?",
          [400, "customer-1"]
        );
      });

      it("should handle exact payment (no overpayment)", async () => {
        mockCustomerRepo.findById.mockResolvedValue({
          ...mockCustomer,
          outstandingBalance: 1000,
        });

        const result = await paymentService.handlePaymentAllocation(
          "customer-1",
          1000, // Exact debt amount
          true
        );

        expect(result).toEqual({
          debtReduced: 1000,
          creditCreated: 0,
          success: true,
        });

        // Should clear debt
        expect(
          mockCustomerRepo.decreaseOutstandingBalance
        ).toHaveBeenCalledWith("customer-1", 1000);

        // Should NOT create credit balance (no overpayment)
        expect(mockDb.runAsync).not.toHaveBeenCalledWith(
          expect.stringContaining("credit_balance"),
          expect.arrayContaining([1000, "customer-1"])
        );
      });
    });

    describe("Nigerian SME Edge Case 4: Partial payment scenario", () => {
      it("should handle partial payment correctly", async () => {
        mockCustomerRepo.findById.mockResolvedValue({
          ...mockCustomer,
          outstandingBalance: 1500,
        });

        const result = await paymentService.handlePaymentAllocation(
          "customer-1",
          600, // Less than debt
          true
        );

        expect(result).toEqual({
          debtReduced: 600,
          creditCreated: 0,
          success: true,
        });

        // Should reduce debt
        expect(
          mockCustomerRepo.decreaseOutstandingBalance
        ).toHaveBeenCalledWith("customer-1", 600);

        // Should log partial payment
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO simple_payment_audit"),
          expect.arrayContaining([
            "test-audit-id",
            "customer-1",
            "payment",
            600,
            expect.any(String),
            "Partial debt payment",
          ])
        );
      });
    });

    describe("Validation and error handling", () => {
      it("should throw error for invalid payment amount", async () => {
        await expect(
          paymentService.handlePaymentAllocation("customer-1", 0, true)
        ).rejects.toThrow("Payment amount must be greater than 0");

        await expect(
          paymentService.handlePaymentAllocation("customer-1", -100, true)
        ).rejects.toThrow("Payment amount must be greater than 0");
      });

      it("should throw error for non-existent customer", async () => {
        mockCustomerRepo.findById.mockResolvedValue(null);

        await expect(
          paymentService.handlePaymentAllocation("invalid-customer", 500, true)
        ).rejects.toThrow("Customer invalid-customer not found");
      });
    });
  });

  describe("Credit Management", () => {
    describe("getCreditBalance", () => {
      it("should return customer credit balance", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 250 });

        const balance = await paymentService.getCreditBalance("customer-1");

        expect(balance).toBe(250);
        expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
          "SELECT COALESCE(credit_balance, 0) as credit_balance FROM customers WHERE id = ?",
          ["customer-1"]
        );
      });

      it("should return 0 when customer has no credit balance", async () => {
        mockDb.getFirstAsync.mockResolvedValue(null);

        const balance = await paymentService.getCreditBalance("customer-1");

        expect(balance).toBe(0);
      });
    });

    describe("useCredit", () => {
      it("should use customer credit for purchase", async () => {
        // Mock getting credit balance
        mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 500 });

        const result = await paymentService.useCredit("customer-1", 200);

        expect(result).toEqual({
          used: 200,
          remaining: 300,
        });

        // Should reduce credit balance
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          "UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?",
          [200, "customer-1"]
        );

        // Should log credit usage
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO simple_payment_audit"),
          expect.arrayContaining([
            "test-audit-id",
            "customer-1",
            "credit_used",
            200,
            expect.any(String),
            "Credit used for purchase",
          ])
        );
      });

      it("should only use available credit amount", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 150 });

        const result = await paymentService.useCredit("customer-1", 300);

        expect(result).toEqual({
          used: 150, // Only use what's available
          remaining: 0,
        });

        expect(mockDb.runAsync).toHaveBeenCalledWith(
          "UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?",
          [150, "customer-1"]
        );
      });

      it("should not modify anything when no credit available", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 0 });

        const result = await paymentService.useCredit("customer-1", 100);

        expect(result).toEqual({
          used: 0,
          remaining: 0,
        });

        // Should not update database when no credit to use
        expect(mockDb.withTransactionAsync).not.toHaveBeenCalled();
      });
    });

    describe("applyCreditToSale", () => {
      it("should apply credit to sale transaction", async () => {
        // Mock credit balance
        mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 400 });

        const result = await paymentService.applyCreditToSale(
          "customer-1",
          600,
          "sale-tx-1"
        );

        expect(result).toEqual({
          creditUsed: 400,
          remainingAmount: 200,
        });

        // Should update transaction
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE transactions SET"),
          [400, 200, "partial", "sale-tx-1"]
        );

        // Should increase outstanding balance for remaining debt
        expect(
          mockCustomerRepo.increaseOutstandingBalance
        ).toHaveBeenCalledWith("customer-1", 200);
      });

      it("should fully pay sale with sufficient credit", async () => {
        mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 800 });

        const result = await paymentService.applyCreditToSale(
          "customer-1",
          600,
          "sale-tx-1"
        );

        expect(result).toEqual({
          creditUsed: 600,
          remainingAmount: 0,
        });

        // Should mark transaction as completed
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining("UPDATE transactions SET"),
          [600, 0, "completed", "sale-tx-1"]
        );

        // Should NOT increase outstanding balance (fully paid)
        expect(
          mockCustomerRepo.increaseOutstandingBalance
        ).not.toHaveBeenCalled();
      });
    });
  });

  describe("Transaction Status Calculation", () => {
    it("should calculate correct status for different transaction types", () => {
      // Payment and refund are always completed
      expect(
        paymentService.calculateTransactionStatus(
          "payment",
          "cash",
          100,
          100,
          0
        )
      ).toBe("completed");

      expect(
        paymentService.calculateTransactionStatus("refund", "cash", 50, 50, 0)
      ).toBe("completed");

      // Sales with no remaining amount are completed
      expect(
        paymentService.calculateTransactionStatus("sale", "cash", 100, 100, 0)
      ).toBe("completed");

      // Sales with remaining amount but some payment are partial
      expect(
        paymentService.calculateTransactionStatus("sale", "credit", 100, 30, 70)
      ).toBe("partial");

      // Sales with no payment are pending
      expect(
        paymentService.calculateTransactionStatus("sale", "credit", 100, 0, 100)
      ).toBe("pending");
    });
  });

  describe("Payment History and Reporting", () => {
    describe("getPaymentHistory", () => {
      it("should return formatted payment history", async () => {
        const mockHistory = [
          {
            id: "audit-1",
            customer_id: "customer-1",
            type: "payment",
            amount: "500",
            created_at: "2024-01-01T10:00:00.000Z",
            description: "Debt payment",
          },
          {
            id: "audit-2",
            customer_id: "customer-1",
            type: "overpayment",
            amount: "100",
            created_at: "2024-01-02T10:00:00.000Z",
            description: "Excess payment converted to credit",
          },
        ];

        mockDb.getAllAsync.mockResolvedValue(mockHistory);

        const result = await paymentService.getPaymentHistory("customer-1");

        expect(result).toEqual([
          {
            id: "audit-1",
            customer_id: "customer-1",
            type: "payment",
            amount: 500, // Converted to number
            created_at: "2024-01-01T10:00:00.000Z",
            description: "Debt payment",
          },
          {
            id: "audit-2",
            customer_id: "customer-1",
            type: "overpayment",
            amount: 100, // Converted to number
            created_at: "2024-01-02T10:00:00.000Z",
            description: "Excess payment converted to credit",
          },
        ]);
      });
    });

    describe("getCreditSummary", () => {
      it("should calculate credit summary correctly", async () => {
        // Mock current balance
        mockDb.getFirstAsync.mockResolvedValue({ credit_balance: 150 });

        // Mock payment history
        const mockHistory = [
          {
            id: "audit-1",
            customer_id: "customer-1",
            type: "overpayment",
            amount: 200,
            created_at: "2024-01-01T10:00:00.000Z",
            description: "Overpayment",
          },
          {
            id: "audit-2",
            customer_id: "customer-1",
            type: "credit_used",
            amount: 50,
            created_at: "2024-01-02T10:00:00.000Z",
            description: "Credit used",
          },
          {
            id: "audit-3",
            customer_id: "customer-1",
            type: "overpayment",
            amount: 100,
            created_at: "2024-01-03T10:00:00.000Z",
            description: "Another overpayment",
          },
        ];

        mockDb.getAllAsync.mockResolvedValue(mockHistory);

        const result = await paymentService.getCreditSummary("customer-1");

        expect(result).toEqual({
          currentBalance: 150,
          totalEarned: 300, // 200 + 100 overpayments
          totalUsed: 50, // 50 credit used
        });
      });
    });
  });
});
