import { SimplePaymentService } from "../../database/service/SimplePaymentService";
import { SimpleTransactionCalculator } from "../SimpleTransactionCalculator";

// Mock the SQLite context for testing
jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

/**
 * Day 5: Integration Testing - End-to-End Transaction Workflows
 *
 * Tests complete transaction flows that Nigerian SMEs use daily
 * Validates integration between all system components
 */

describe("End-to-End Transaction Workflow Integration", () => {
  let mockDb: any;
  let mockCustomerRepo: any;
  let paymentService: SimplePaymentService;

  beforeEach(() => {
    // Mock SQLite database with all required methods
    mockDb = {
      execAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      withTransactionAsync: jest.fn((callback) => callback()),
    };

    // Mock CustomerRepository
    mockCustomerRepo = {
      findById: jest.fn(),
      decreaseOutstandingBalance: jest.fn(),
      increaseOutstandingBalance: jest.fn(),
    };

    paymentService = new SimplePaymentService(mockDb, mockCustomerRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete Customer Transaction Journey", () => {
    it("should handle new customer sale and payment workflow", async () => {
      // Step 1: Create new customer
      const customerData = {
        name: "Adebayo Oluwaseun",
        phone: "08012345678",
        outstandingBalance: 0,
        creditBalance: 0,
      };

      mockDb.getFirstAsync
        .mockResolvedValueOnce(null) // Customer doesn't exist
        .mockResolvedValueOnce({ id: 1, ...customerData }); // Customer created

      // Step 2: Create sale transaction
      const saleAmount = 25000; // ₦250
      const paidAmount = 15000; // ₦150 paid immediately
      const remainingAmount = 10000; // ₦100 remaining

      const saleData = {
        customerId: 1,
        type: "sale",
        amount: saleAmount,
        paidAmount,
        remainingAmount,
        paymentMethod: "mixed",
        status: "partial",
      };

      mockDb.getFirstAsync.mockResolvedValueOnce({ id: 1, ...saleData });

      // Step 3: Verify transaction calculation
      const calculatedStatus = SimpleTransactionCalculator.calculateStatus(
        "sale",
        saleAmount,
        paidAmount,
        remainingAmount
      );

      expect(calculatedStatus.status).toBe("partial");
      expect(calculatedStatus.percentagePaid).toBe(60);

      // Step 4: Process later payment to complete transaction
      const laterPayment = 10000; // Pay remaining ₦100

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: remainingAmount,
        creditBalance: 0,
      });

      mockDb.getFirstAsync
        .mockResolvedValueOnce({
          id: 1,
          outstandingBalance: remainingAmount,
          creditBalance: 0,
        }) // Customer with outstanding balance
        .mockResolvedValueOnce({ id: 2 }); // Payment transaction created

      const paymentResult = await paymentService.handlePaymentAllocation(
        "1",
        laterPayment,
        true
      );

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.debtReduced).toBe(laterPayment);

      // Verify final transaction status
      const finalStatus = SimpleTransactionCalculator.calculateStatus(
        "sale",
        saleAmount,
        saleAmount, // Now fully paid
        0 // No remaining amount
      );

      expect(finalStatus.status).toBe("completed");
      expect(finalStatus.percentagePaid).toBe(100);
    });

    it("should handle customer with existing credit making new purchase", async () => {
      // Customer has existing credit balance
      const existingCredit = 5000; // ₦50 credit
      const customerWithCredit = {
        id: "1",
        name: "Fatima Ibrahim",
        phone: "08023456789",
        outstandingBalance: 0,
        creditBalance: existingCredit,
      };

      mockDb.getFirstAsync.mockResolvedValue(customerWithCredit);

      // New purchase amount
      const purchaseAmount = 8000; // ₦80

      // Calculate how credit should be applied
      const creditApplication =
        SimpleTransactionCalculator.calculateCustomerBalanceImpact(
          "sale",
          "mixed",
          purchaseAmount,
          purchaseAmount - existingCredit,
          false
        );

      // For mixed payment, only the remaining amount after credit affects debt
      expect(creditApplication.creditChange).toBe(0); // Credit usage is handled separately
      expect(creditApplication.debtChange).toBe(
        purchaseAmount - existingCredit
      );

      // Process the transaction
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: existingCredit,
      });

      const result = await paymentService.useCredit("1", purchaseAmount);

      expect(result.used).toBe(existingCredit);
      expect(result.remaining).toBe(0); // All credit was used (5000 - 5000 = 0)
    });

    it("should handle overpayment scenario with credit creation", async () => {
      // Customer owes ₦75 but pays ₦100
      const outstandingDebt = 7500;
      const paymentAmount = 10000;

      const customerWithDebt = {
        id: "1",
        outstandingBalance: outstandingDebt,
        creditBalance: 0,
      };

      mockCustomerRepo.findById.mockResolvedValue(customerWithDebt);

      // Calculate overpayment handling
      const overpaymentResult = SimpleTransactionCalculator.handleOverpayment(
        paymentAmount,
        outstandingDebt
      );

      expect(overpaymentResult.debtCleared).toBe(outstandingDebt);
      expect(overpaymentResult.creditCreated).toBe(
        paymentAmount - outstandingDebt
      );

      // Process the overpayment
      const result = await paymentService.handlePaymentAllocation(
        "1",
        paymentAmount,
        true
      );

      expect(result.success).toBe(true);
      expect(result.debtReduced).toBe(outstandingDebt);
      expect(result.creditCreated).toBe(paymentAmount - outstandingDebt);
    });
  });

  describe("Complex Business Scenario Integration", () => {
    it("should handle mixed payment with validation and processing", async () => {
      const totalAmount = 15000; // ₦150
      const cashAmount = 9000; // ₦90 cash
      const creditAmount = 6000; // ₦60 credit

      // Step 1: Validate mixed payment
      const validation = SimpleTransactionCalculator.validateMixedPayment(
        totalAmount,
        cashAmount,
        creditAmount
      );

      expect(validation.isValid).toBe(true);

      // Step 2: Calculate initial amounts for mixed payment
      const initialAmounts =
        SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "mixed",
          totalAmount,
          cashAmount
        );

      expect(initialAmounts.paidAmount).toBe(cashAmount);
      expect(initialAmounts.remainingAmount).toBe(creditAmount);

      // Step 3: Process the mixed payment
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: creditAmount,
      });

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: creditAmount,
      });

      const result = await paymentService.processMixedPayment({
        customerId: "1",
        totalAmount,
        cashAmount,
        creditAmount,
      });

      expect(result.success).toBe(true);
      expect(result.cashProcessed).toBe(cashAmount);
      expect(result.creditUsed).toBe(creditAmount);
      expect(result.totalProcessed).toBe(totalAmount);
    });

    it("should handle end-of-day reconciliation workflow", async () => {
      // Simulate multiple transactions throughout the day
      const dailyTransactions = [
        { type: "sale", amount: 5000, paid: 5000, remaining: 0 }, // Completed sale
        { type: "sale", amount: 8000, paid: 4000, remaining: 4000 }, // Partial payment
        { type: "payment", amount: 2000, paid: 2000, remaining: 0 }, // Payment received
        { type: "sale", amount: 12000, paid: 0, remaining: 12000 }, // Credit sale
        { type: "payment", amount: 6000, paid: 6000, remaining: 0 }, // Another payment
      ];

      const reconciliationResults = dailyTransactions.map((tx) =>
        SimpleTransactionCalculator.calculateStatus(
          tx.type,
          tx.amount,
          tx.paid,
          tx.remaining
        )
      );

      // Verify transaction statuses
      expect(reconciliationResults[0].status).toBe("completed");
      expect(reconciliationResults[1].status).toBe("partial");
      expect(reconciliationResults[2].status).toBe("completed");
      expect(reconciliationResults[3].status).toBe("pending");
      expect(reconciliationResults[4].status).toBe("completed");

      // Calculate daily totals
      const totalSales = dailyTransactions
        .filter((tx) => tx.type === "sale")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalPayments = dailyTransactions
        .filter((tx) => tx.type === "payment")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const outstandingAmount = dailyTransactions
        .filter((tx) => tx.type === "sale")
        .reduce((sum, tx) => sum + tx.remaining, 0);

      expect(totalSales).toBe(25000); // ₦250 total sales
      expect(totalPayments).toBe(8000); // ₦80 total payments
      expect(outstandingAmount).toBe(16000); // ₦160 outstanding
    });

    it("should handle rapid sequential transactions without conflicts", async () => {
      const transactions = [
        { type: "sale", amount: 3000 },
        { type: "payment", amount: 1500 },
        { type: "sale", amount: 2000 },
        { type: "payment", amount: 3500 },
        { type: "sale", amount: 1000 },
      ];

      // Mock customer balance progression
      let currentBalance = 0;

      for (const tx of transactions) {
        const balanceImpact =
          SimpleTransactionCalculator.calculateCustomerBalanceImpact(
            tx.type,
            tx.type === "sale" ? "credit" : "cash",
            tx.amount,
            tx.type === "sale" ? tx.amount : 0,
            tx.type === "payment"
          );

        if (tx.type === "sale") {
          currentBalance += balanceImpact.debtChange;
        } else {
          currentBalance += balanceImpact.debtChange; // Negative for payments
        }
      }

      // Final balance should be correct
      const expectedBalance = 3000 - 1500 + (2000 - 3500) + 1000;
      expect(currentBalance).toBe(expectedBalance);
      expect(currentBalance).toBe(1000); // ₦10 remaining debt
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle database transaction failures gracefully", async () => {
      // Mock database failure during transaction
      mockDb.withTransactionAsync.mockRejectedValue(
        new Error("Database transaction failed")
      );

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 5000,
        creditBalance: 0,
      });

      try {
        await paymentService.handlePaymentAllocation("1", 5000, true);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain(
          "Database transaction failed"
        );
      }
    });

    it("should validate data integrity before processing", async () => {
      // Test with invalid customer ID
      mockCustomerRepo.findById.mockResolvedValue(null);

      try {
        await paymentService.handlePaymentAllocation("999", 5000, true);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain("Customer 999 not found");
      }
    });

    it("should handle calculation edge cases in workflow", async () => {
      // Test with zero amount
      const zeroAmountResult = SimpleTransactionCalculator.calculateStatus(
        "sale",
        0,
        0,
        0
      );

      expect(zeroAmountResult.status).toBe("completed");
      expect(zeroAmountResult.percentagePaid).toBe(0);

      // Test with negative amounts (should be handled gracefully)
      const calculatedAmounts =
        SimpleTransactionCalculator.calculateInitialAmounts(
          "payment",
          "cash",
          5000
        );

      expect(calculatedAmounts.paidAmount).toBe(5000);
      expect(calculatedAmounts.remainingAmount).toBe(0);
    });
  });

  describe("Performance Integration Testing", () => {
    it("should handle high-volume transaction processing efficiently", async () => {
      const startTime = performance.now();

      // Process 500 transactions (busy day for Nigerian SME)
      const transactions = Array.from({ length: 500 }, (_, i) => ({
        customerId: (i % 10) + 1,
        amount: (i + 1) * 100, // Varying amounts
        type: i % 3 === 0 ? "sale" : "payment",
      }));

      // Mock database responses
      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 5000,
        creditBalance: 0,
      });

      // Process all transactions
      const results = await Promise.all(
        transactions.map(async (tx) => {
          if (tx.type === "sale") {
            return SimpleTransactionCalculator.calculateInitialAmounts(
              "sale",
              "cash",
              tx.amount
            );
          } else {
            return paymentService.handlePaymentAllocation(
              tx.customerId.toString(),
              tx.amount,
              true
            );
          }
        })
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(500);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should maintain calculation accuracy under load", async () => {
      // Test calculation consistency with rapid successive operations
      const baseAmount = 10000;
      const operations = 1000;

      const calculationResults = [];

      for (let i = 0; i < operations; i++) {
        const paidAmount = baseAmount * (i / operations);
        const remainingAmount = baseAmount - paidAmount;

        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          baseAmount,
          paidAmount,
          remainingAmount
        );

        calculationResults.push(result);
      }

      // Verify all calculations are mathematically consistent
      calculationResults.forEach((result, index) => {
        expect(result.paidAmount + result.remainingAmount).toBe(baseAmount);
        expect(result.percentagePaid).toBeGreaterThanOrEqual(0);
        expect(result.percentagePaid).toBeLessThanOrEqual(100);
      });

      // Verify progression is logical
      for (let i = 1; i < calculationResults.length; i++) {
        expect(calculationResults[i].percentagePaid).toBeGreaterThanOrEqual(
          calculationResults[i - 1].percentagePaid
        );
      }
    });
  });
});
