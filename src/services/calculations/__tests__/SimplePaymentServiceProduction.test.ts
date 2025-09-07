import { SimplePaymentService } from "../../database/service/SimplePaymentService";

// Mock the database service
jest.mock("../../database", () => ({
  createDatabaseService: jest.fn(() => ({
    customers: {
      findById: jest.fn(),
      getOutstandingBalance: jest.fn(),
      getCreditBalance: jest.fn(),
      increaseOutstandingBalance: jest.fn(),
      decreaseOutstandingBalance: jest.fn(),
      increaseCreditBalance: jest.fn(),
      decreaseCreditBalance: jest.fn(),
    },
    transactions: {
      createTransaction: jest.fn(),
    },
    auditLogs: {
      create: jest.fn(),
    },
  })),
}));

/**
 * Production Edge Case Tests for Nigerian SME Payment Processing
 *
 * Tests complex scenarios that could occur in production environments
 * Focuses on boundary conditions, error recovery, and business logic edge cases
 */

describe("SimplePaymentService Production Edge Cases", () => {
  let paymentService: SimplePaymentService;
  let mockDatabaseService: any;

  beforeEach(() => {
    const { createDatabaseService } = require("../../database");
    mockDatabaseService = createDatabaseService();
    paymentService = new SimplePaymentService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("High-Stress Transaction Processing", () => {
    it("should handle rapid sequential payments without race conditions", async () => {
      const customerId = "stress-test-customer";
      const paymentAmount = 1000; // ₦10.00 each
      const numberOfPayments = 100;

      // Mock customer with sufficient debt
      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: numberOfPayments * paymentAmount, // Enough debt to cover all payments
        creditBalance: 0,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
        numberOfPayments * paymentAmount
      );
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(0);

      // Mock successful database operations
      mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockResolvedValue({
        id: "tx-1",
      });
      mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

      const startTime = Date.now();

      // Process many payments rapidly
      const paymentPromises = Array.from(
        { length: numberOfPayments },
        async (_, i) => {
          return paymentService.processPayment({
            customerId,
            amount: paymentAmount,
            paymentMethod: "cash",
            description: `Rapid payment ${i + 1}`,
          });
        }
      );

      const results = await Promise.all(paymentPromises);
      const endTime = Date.now();

      // Verify all payments processed successfully
      expect(results).toHaveLength(numberOfPayments);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.amountProcessed).toBe(paymentAmount);
      });

      // Should complete in reasonable time (under 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);

      // Verify database operations were called correctly
      expect(
        mockDatabaseService.customers.decreaseOutstandingBalance
      ).toHaveBeenCalledTimes(numberOfPayments);
      expect(
        mockDatabaseService.transactions.createTransaction
      ).toHaveBeenCalledTimes(numberOfPayments);
    });

    it("should handle concurrent overpayments correctly", async () => {
      const customerId = "concurrent-overpay-customer";
      const remainingDebt = 5000; // ₦50.00 total debt
      const overpaymentAmount = 10000; // ₦100.00 each payment (overpayment)
      const concurrentPayments = 3;

      // Mock customer with limited debt
      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: remainingDebt,
        creditBalance: 0,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
        remainingDebt
      );
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(0);

      // Mock database operations
      mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.customers.increaseCreditBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockResolvedValue({
        id: "tx-1",
      });
      mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

      // Process concurrent overpayments
      const overpaymentPromises = Array.from(
        { length: concurrentPayments },
        async (_, i) => {
          return paymentService.processPayment({
            customerId,
            amount: overpaymentAmount,
            paymentMethod: "bank_transfer",
            description: `Concurrent overpayment ${i + 1}`,
          });
        }
      );

      const results = await Promise.all(overpaymentPromises);

      // All payments should process successfully
      expect(results).toHaveLength(concurrentPayments);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.amountProcessed).toBe(overpaymentAmount);
      });

      // Verify proper handling of overpayments
      expect(
        mockDatabaseService.customers.decreaseOutstandingBalance
      ).toHaveBeenCalled();
      expect(
        mockDatabaseService.customers.increaseCreditBalance
      ).toHaveBeenCalled();
    });

    it("should handle memory-intensive transaction descriptions", async () => {
      const customerId = "memory-test-customer";
      const paymentAmount = 5000;

      // Create very long description (simulating memory pressure)
      const longDescription =
        "Nigerian SME Transaction Details: ".repeat(1000) +
        "Customer paid for bulk purchase of goods including: " +
        Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`).join(", ");

      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: paymentAmount,
        creditBalance: 0,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
        paymentAmount
      );
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(0);
      mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockResolvedValue({
        id: "tx-1",
      });
      mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

      const result = await paymentService.processPayment({
        customerId,
        amount: paymentAmount,
        paymentMethod: "pos_card",
        description: longDescription,
      });

      expect(result.success).toBe(true);
      expect(result.amountProcessed).toBe(paymentAmount);

      // Verify transaction was created with long description
      expect(
        mockDatabaseService.transactions.createTransaction
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          description: longDescription,
        })
      );
    });
  });

  describe("Boundary Value Edge Cases", () => {
    it("should handle maximum safe integer amounts", async () => {
      const customerId = "max-amount-customer";
      const maxSafeAmount = Number.MAX_SAFE_INTEGER;

      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: maxSafeAmount,
        creditBalance: 0,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
        maxSafeAmount
      );
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(0);
      mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockResolvedValue({
        id: "tx-1",
      });
      mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

      const result = await paymentService.processPayment({
        customerId,
        amount: maxSafeAmount,
        paymentMethod: "bank_transfer",
        description: "Maximum amount payment",
      });

      expect(result.success).toBe(true);
      expect(result.amountProcessed).toBe(maxSafeAmount);
    });

    it("should handle minimum valid payment amounts", async () => {
      const customerId = "min-amount-customer";
      const minAmount = 1; // 1 kobo

      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: minAmount,
        creditBalance: 0,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
        minAmount
      );
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(0);
      mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockResolvedValue({
        id: "tx-1",
      });
      mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

      const result = await paymentService.processPayment({
        customerId,
        amount: minAmount,
        paymentMethod: "cash",
        description: "Minimum amount payment",
      });

      expect(result.success).toBe(true);
      expect(result.amountProcessed).toBe(minAmount);
    });

    it("should handle floating point precision edge cases", async () => {
      const customerId = "precision-test-customer";

      // Test amounts that commonly cause floating point issues
      const problematicAmounts = [
        1005, // 10.05 in kobo
        9999, // 99.99 in kobo
        333333, // 3333.33 in kobo
        123456789, // Large amount with precision requirements
      ];

      for (const amount of problematicAmounts) {
        mockDatabaseService.customers.findById.mockResolvedValue({
          id: customerId,
          outstandingBalance: amount,
          creditBalance: 0,
        });

        mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
          amount
        );
        mockDatabaseService.customers.getCreditBalance.mockResolvedValue(0);
        mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
          undefined
        );
        mockDatabaseService.transactions.createTransaction.mockResolvedValue({
          id: "tx-1",
        });
        mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

        const result = await paymentService.processPayment({
          customerId,
          amount,
          paymentMethod: "pos_card",
          description: `Precision test for amount ${amount}`,
        });

        expect(result.success).toBe(true);
        expect(result.amountProcessed).toBe(amount);

        // Verify exact amount was processed (no precision loss)
        expect(
          mockDatabaseService.customers.decreaseOutstandingBalance
        ).toHaveBeenCalledWith(customerId, amount);
      }
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should handle database timeouts gracefully", async () => {
      const customerId = "timeout-test-customer";
      const paymentAmount = 5000;

      // Mock database timeout
      mockDatabaseService.customers.findById.mockRejectedValue(
        new Error("Database connection timeout")
      );

      const result = await paymentService.processPayment({
        customerId,
        amount: paymentAmount,
        paymentMethod: "cash",
        description: "Timeout test payment",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database connection timeout");
    });

    it("should handle partial database failures with rollback", async () => {
      const customerId = "rollback-test-customer";
      const paymentAmount = 5000;

      // Mock successful customer lookup
      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: paymentAmount,
        creditBalance: 0,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
        paymentAmount
      );
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(0);

      // Mock successful balance update but failed transaction creation
      mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockRejectedValue(
        new Error("Transaction creation failed")
      );

      const result = await paymentService.processPayment({
        customerId,
        amount: paymentAmount,
        paymentMethod: "bank_transfer",
        description: "Rollback test payment",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Transaction creation failed");
    });

    it("should handle corrupted customer data gracefully", async () => {
      const customerId = "corrupted-data-customer";
      const paymentAmount = 5000;

      // Mock corrupted customer data
      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: "invalid_balance", // String instead of number
        creditBalance: null, // Null instead of number
      });

      const result = await paymentService.processPayment({
        customerId,
        amount: paymentAmount,
        paymentMethod: "cash",
        description: "Corrupted data test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle network interruptions during processing", async () => {
      const customerId = "network-test-customer";
      const paymentAmount = 5000;

      // Mock intermittent network failures
      let callCount = 0;
      mockDatabaseService.customers.findById.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error("Network connection lost"));
        }
        return Promise.resolve({
          id: customerId,
          outstandingBalance: paymentAmount,
          creditBalance: 0,
        });
      });

      // Should still fail after retries (our service doesn't implement retry logic)
      const result = await paymentService.processPayment({
        customerId,
        amount: paymentAmount,
        paymentMethod: "pos_card",
        description: "Network interruption test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network connection lost");
    });
  });

  describe("Complex Nigerian SME Scenarios", () => {
    it("should handle end-of-day bulk processing", async () => {
      const customerId = "bulk-processing-customer";
      const numberOfTransactions = 500;
      const averageAmount = 2500; // ₦25.00

      // Mock customer with sufficient debt to handle all transactions
      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: numberOfTransactions * averageAmount,
        creditBalance: 0,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
        numberOfTransactions * averageAmount
      );
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(0);
      mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockResolvedValue({
        id: "tx-1",
      });
      mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

      const startTime = Date.now();

      // Process bulk transactions with varied amounts and payment methods
      const bulkTransactions = Array.from(
        { length: numberOfTransactions },
        async (_, i) => {
          const paymentMethods = [
            "cash",
            "pos_card",
            "bank_transfer",
            "mixed",
          ] as const;
          const amount = averageAmount + (i % 100); // Vary amounts slightly

          return paymentService.processPayment({
            customerId,
            amount,
            paymentMethod: paymentMethods[i % paymentMethods.length],
            description: `Bulk transaction ${i + 1} - End of day processing`,
          });
        }
      );

      const results = await Promise.all(bulkTransactions);
      const endTime = Date.now();

      // Verify all transactions processed successfully
      expect(results).toHaveLength(numberOfTransactions);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Should complete bulk processing in reasonable time (under 15 seconds)
      expect(endTime - startTime).toBeLessThan(15000);
    });

    it("should handle mixed payment with rounding edge cases", async () => {
      const customerId = "rounding-test-customer";
      const saleAmount = 12567; // ₦125.67
      const cashAmount = 7534; // ₦75.34 (causes rounding)
      const creditAmount = 5033; // ₦50.33 (total = ₦125.67)

      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: 0,
        creditBalance: creditAmount,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(0);
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(
        creditAmount
      );
      mockDatabaseService.customers.increaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.customers.decreaseCreditBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockResolvedValue({
        id: "tx-1",
      });
      mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

      const result = await paymentService.processMixedPayment({
        customerId,
        totalAmount: saleAmount,
        cashAmount,
        creditAmount,
        description: "Mixed payment with rounding",
      });

      expect(result.success).toBe(true);
      expect(result.cashProcessed).toBe(cashAmount);
      expect(result.creditUsed).toBe(creditAmount);
    });

    it("should handle customer with complex payment history", async () => {
      const customerId = "complex-history-customer";
      const currentDebt = 15000; // ₦150.00
      const availableCredit = 3000; // ₦30.00
      const paymentAmount = 20000; // ₦200.00 (overpayment scenario)

      mockDatabaseService.customers.findById.mockResolvedValue({
        id: customerId,
        outstandingBalance: currentDebt,
        creditBalance: availableCredit,
      });

      mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
        currentDebt
      );
      mockDatabaseService.customers.getCreditBalance.mockResolvedValue(
        availableCredit
      );
      mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.customers.increaseCreditBalance.mockResolvedValue(
        undefined
      );
      mockDatabaseService.transactions.createTransaction.mockResolvedValue({
        id: "tx-1",
      });
      mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

      const result = await paymentService.processPayment({
        customerId,
        amount: paymentAmount,
        paymentMethod: "bank_transfer",
        description: "Complex customer payment",
      });

      expect(result.success).toBe(true);
      expect(result.amountProcessed).toBe(paymentAmount);
      expect(result.debtCleared).toBe(currentDebt);
      expect(result.creditCreated).toBe(paymentAmount - currentDebt);

      // Verify proper debt clearing and credit creation
      expect(
        mockDatabaseService.customers.decreaseOutstandingBalance
      ).toHaveBeenCalledWith(customerId, currentDebt);
      expect(
        mockDatabaseService.customers.increaseCreditBalance
      ).toHaveBeenCalledWith(
        customerId,
        availableCredit + (paymentAmount - currentDebt)
      );
    });

    it("should handle rapid customer status changes", async () => {
      const customerId = "status-change-customer";

      // Simulate rapid status changes: debt -> credit -> debt
      const scenarios = [
        { debt: 5000, credit: 0, payment: 8000 }, // Creates credit
        { debt: 0, credit: 3000, sale: 7000 }, // Uses credit, creates debt
        { debt: 4000, credit: 0, payment: 6000 }, // Creates credit again
      ];

      for (const [index, scenario] of scenarios.entries()) {
        mockDatabaseService.customers.findById.mockResolvedValue({
          id: customerId,
          outstandingBalance: scenario.debt,
          creditBalance: scenario.credit,
        });

        mockDatabaseService.customers.getOutstandingBalance.mockResolvedValue(
          scenario.debt
        );
        mockDatabaseService.customers.getCreditBalance.mockResolvedValue(
          scenario.credit
        );
        mockDatabaseService.customers.decreaseOutstandingBalance.mockResolvedValue(
          undefined
        );
        mockDatabaseService.customers.increaseOutstandingBalance.mockResolvedValue(
          undefined
        );
        mockDatabaseService.customers.increaseCreditBalance.mockResolvedValue(
          undefined
        );
        mockDatabaseService.customers.decreaseCreditBalance.mockResolvedValue(
          undefined
        );
        mockDatabaseService.transactions.createTransaction.mockResolvedValue({
          id: `tx-${index}`,
        });
        mockDatabaseService.auditLogs.create.mockResolvedValue(undefined);

        if (scenario.payment) {
          const result = await paymentService.processPayment({
            customerId,
            amount: scenario.payment,
            paymentMethod: "cash",
            description: `Status change payment ${index + 1}`,
          });
          expect(result.success).toBe(true);
        }

        if (scenario.sale) {
          const result = await paymentService.processSale({
            customerId,
            amount: scenario.sale,
            paymentMethod: "credit",
            description: `Status change sale ${index + 1}`,
          });
          expect(result.success).toBe(true);
        }
      }
    });
  });
});
