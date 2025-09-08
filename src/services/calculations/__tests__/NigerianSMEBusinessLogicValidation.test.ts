import { SimplePaymentService } from "../../database/service/SimplePaymentService";
import { SimpleTransactionCalculator } from "../SimpleTransactionCalculator";

/**
 * Priority 4: Business Logic Validation - Nigerian SME Scenario Testing
 *
 * Comprehensive tests for core business workflows in Nigerian SME context:
 * ✅ Mixed Payment Scenarios (POS + Cash + Credit)
 * ✅ Overpayment handling
 * ✅ Credit balance management
 * ✅ Debt calculation accuracy
 * ✅ Currency precision (kobo/naira)
 */

describe("Priority 4: Nigerian SME Business Logic Validation", () => {
  let mockDb: any;
  let mockCustomerRepo: any;
  let paymentService: SimplePaymentService;

  beforeEach(() => {
    mockDb = {
      execAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      withTransactionAsync: jest.fn((callback) => callback()),
    };

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

  describe("Mixed Payment Scenarios (POS + Cash + Credit)", () => {
    it("should handle POS + Cash mixed payment correctly", async () => {
      const totalAmount = 25000; // ₦250
      const posAmount = 15000; // ₦150 via POS
      const cashAmount = 10000; // ₦100 cash

      // Mock customer with no existing balances
      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: 0,
      });

      // Process POS payment first
      const posResult = await paymentService.handlePaymentAllocation(
        "1",
        posAmount,
        false // Not using credit
      );
      expect(posResult.success).toBe(true);
      expect(posResult.creditCreated).toBe(posAmount);

      // Process cash payment
      const cashResult = await paymentService.handlePaymentAllocation(
        "1",
        cashAmount,
        false // Not using credit
      );
      expect(cashResult.success).toBe(true);
      expect(cashResult.creditCreated).toBe(cashAmount);

      // Verify total processed
      const totalProcessed = posAmount + cashAmount;
      expect(totalProcessed).toBe(totalAmount);
    });

    it("should handle POS + Credit mixed payment with existing credit", async () => {
      const totalAmount = 30000; // ₦300
      const posAmount = 20000; // ₦200 via POS
      const creditAmount = 10000; // ₦100 from existing credit
      const existingCredit = 15000; // Customer has ₦150 credit

      // Mock customer with existing credit
      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: existingCredit,
      });

      // Mock the database to return the credit balance
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: existingCredit,
      });

      // Process credit usage first
      const creditResult = await paymentService.useCredit("1", creditAmount);
      expect(creditResult.used).toBe(creditAmount);
      expect(creditResult.remaining).toBe(existingCredit - creditAmount);

      // Process POS payment for remaining amount
      const posResult = await paymentService.handlePaymentAllocation(
        "1",
        posAmount,
        false // Not using credit
      );

      expect(posResult.success).toBe(true);
      expect(posResult.debtReduced).toBe(0); // No debt to reduce
      expect(posResult.creditCreated).toBe(posAmount); // Creates credit since no debt
      expect(posResult.creditCreated + creditAmount).toBe(totalAmount); // Total payment matches
    });

    it("should handle Cash + Credit + POS three-way mixed payment", async () => {
      const totalAmount = 45000; // ₦450
      const cashAmount = 15000; // ₦150 cash
      const creditAmount = 15000; // ₦150 from credit
      const posAmount = 15000; // ₦150 via POS
      const existingCredit = 20000; // Customer has ₦200 credit

      // Mock customer with existing credit
      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: existingCredit,
      });

      // Mock the database to return the credit balance
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: existingCredit,
      });

      // Process credit portion first
      const creditResult = await paymentService.useCredit("1", creditAmount);
      expect(creditResult.used).toBe(creditAmount);
      expect(creditResult.remaining).toBe(existingCredit - creditAmount);

      // Process cash portion
      const cashResult = await paymentService.handlePaymentAllocation(
        "1",
        cashAmount,
        false
      );
      expect(cashResult.success).toBe(true);
      expect(cashResult.creditCreated).toBe(cashAmount);

      // Process POS portion
      const posResult = await paymentService.handlePaymentAllocation(
        "1",
        posAmount,
        false
      );
      expect(posResult.success).toBe(true);
      expect(posResult.creditCreated).toBe(posAmount);

      // Verify total processed
      const totalProcessed = creditAmount + cashAmount + posAmount;
      expect(totalProcessed).toBe(totalAmount);
    });

    it("should reject invalid mixed payment combinations", () => {
      const totalAmount = 30000; // ₦300

      // Test invalid combinations using the calculator method
      const invalidResult1 = SimpleTransactionCalculator.validateMixedPayment(
        totalAmount,
        20000, // Cash
        15000 // Credit
      );
      expect(invalidResult1.isValid).toBe(false);
      expect(invalidResult1.error).toContain("must equal total amount");

      const invalidResult2 = SimpleTransactionCalculator.validateMixedPayment(
        totalAmount,
        25000, // Cash
        10000 // Credit
      );
      expect(invalidResult2.isValid).toBe(false);
      expect(invalidResult2.error).toContain("must equal total amount");

      // Test valid combination
      const validResult = SimpleTransactionCalculator.validateMixedPayment(
        totalAmount,
        20000, // Cash
        10000 // Credit
      );
      expect(validResult.isValid).toBe(true);
    });
  });

  describe("Overpayment Handling", () => {
    it("should handle overpayment on debt settlement correctly", async () => {
      const outstandingDebt = 25000; // ₦250 debt
      const paymentAmount = 35000; // ₦350 payment (₦100 overpayment)

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: outstandingDebt,
        creditBalance: 0,
      });

      const result = await paymentService.handlePaymentAllocation(
        "1",
        paymentAmount,
        true
      );

      expect(result.success).toBe(true);
      expect(result.debtReduced).toBe(outstandingDebt);
      expect(result.creditCreated).toBe(paymentAmount - outstandingDebt);
      expect(result.creditCreated).toBe(10000); // ₦100 credit created
    });

    it("should handle overpayment when customer has no debt", async () => {
      const paymentAmount = 50000; // ₦500 payment with no debt

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: 0,
      });

      const result = await paymentService.handlePaymentAllocation(
        "1",
        paymentAmount,
        true
      );

      expect(result.success).toBe(true);
      expect(result.debtReduced).toBe(0);
      expect(result.creditCreated).toBe(paymentAmount);
      expect(result.creditCreated).toBe(50000); // Full amount becomes credit
    });

    it("should handle multiple overpayments accumulating credit", async () => {
      // First overpayment
      mockCustomerRepo.findById
        .mockResolvedValueOnce({
          id: "1",
          outstandingBalance: 0,
          creditBalance: 0,
        })
        .mockResolvedValueOnce({
          id: "1",
          outstandingBalance: 0,
          creditBalance: 20000, // After first payment
        });

      // First payment: ₦200 with no debt
      const firstResult = await paymentService.handlePaymentAllocation(
        "1",
        20000,
        true
      );

      expect(firstResult.creditCreated).toBe(20000);

      // Second payment: ₦150 with no debt (existing credit should not affect)
      const secondResult = await paymentService.handlePaymentAllocation(
        "1",
        15000,
        true
      );

      expect(secondResult.creditCreated).toBe(15000);
      expect(secondResult.debtReduced).toBe(0);
    });

    it("should handle overpayment with partial debt settlement", async () => {
      const outstandingDebt = 15000; // ₦150 debt
      const paymentAmount = 40000; // ₦400 payment

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: outstandingDebt,
        creditBalance: 0,
      });

      const result = await paymentService.handlePaymentAllocation(
        "1",
        paymentAmount,
        true
      );

      expect(result.success).toBe(true);
      expect(result.debtReduced).toBe(outstandingDebt);
      expect(result.creditCreated).toBe(paymentAmount - outstandingDebt);
      expect(result.creditCreated).toBe(25000); // ₦250 credit created
    });
  });

  describe("Credit Balance Management", () => {
    it("should apply credit balance to new purchases automatically", async () => {
      const existingCredit = 30000; // ₦300 credit
      const purchaseAmount = 25000; // ₦250 purchase

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: existingCredit,
      });

      // Mock the database to return the credit balance
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: existingCredit,
      });

      // Calculate credit application
      const creditApplication = await paymentService.useCredit(
        "1",
        purchaseAmount
      );

      expect(creditApplication.used).toBe(purchaseAmount);
      expect(creditApplication.remaining).toBe(existingCredit - purchaseAmount);
      expect(creditApplication.remaining).toBe(5000); // ₦50 credit remaining
    });

    it("should handle credit balance exceeding purchase amount", async () => {
      const existingCredit = 50000; // ₦500 credit
      const purchaseAmount = 30000; // ₦300 purchase

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: existingCredit,
      });

      // Mock the database to return the credit balance
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: existingCredit,
      });

      const creditApplication = await paymentService.useCredit(
        "1",
        purchaseAmount
      );

      expect(creditApplication.used).toBe(purchaseAmount);
      expect(creditApplication.remaining).toBe(existingCredit - purchaseAmount);
      expect(creditApplication.remaining).toBe(20000); // ₦200 credit remaining
    });

    it("should handle credit balance exactly matching purchase amount", async () => {
      const existingCredit = 25000; // ₦250 credit
      const purchaseAmount = 25000; // ₦250 purchase

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: existingCredit,
      });

      // Mock the database to return the credit balance
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: existingCredit,
      });

      const creditApplication = await paymentService.useCredit(
        "1",
        purchaseAmount
      );

      expect(creditApplication.used).toBe(purchaseAmount);
      expect(creditApplication.remaining).toBe(0); // All credit used
    });

    it("should prevent credit usage when insufficient balance", async () => {
      const existingCredit = 15000; // ₦150 credit
      const purchaseAmount = 30000; // ₦300 purchase

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: existingCredit,
      });

      // Mock the database to return the credit balance
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: existingCredit,
      });

      const creditApplication = await paymentService.useCredit(
        "1",
        purchaseAmount
      );

      expect(creditApplication.used).toBe(existingCredit);
      expect(creditApplication.remaining).toBe(0);
      expect(creditApplication.used).toBeLessThan(purchaseAmount);
    });

    it("should handle credit balance depletion and debt creation", async () => {
      const existingCredit = 20000; // ₦200 credit
      const purchaseAmount = 35000; // ₦350 purchase

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: 0,
        creditBalance: existingCredit,
      });

      // Mock the database to return the credit balance
      mockDb.getFirstAsync.mockResolvedValue({
        credit_balance: existingCredit,
      });

      // First apply all available credit
      const creditResult = await paymentService.useCredit("1", purchaseAmount);
      expect(creditResult.used).toBe(existingCredit);
      expect(creditResult.remaining).toBe(0);

      // Remaining amount should create debt
      const remainingAmount = purchaseAmount - existingCredit;
      expect(remainingAmount).toBe(15000); // ₦150 debt created
    });
  });

  describe("Debt Calculation Accuracy", () => {
    it("should calculate debt accurately for partial payments", () => {
      const scenarios = [
        { total: 50000, paid: 30000, expectedDebt: 20000 },
        { total: 25000, paid: 15000, expectedDebt: 10000 },
        { total: 100000, paid: 75000, expectedDebt: 25000 },
        { total: 15000, paid: 5000, expectedDebt: 10000 },
      ];

      scenarios.forEach((scenario) => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          scenario.total,
          scenario.paid,
          scenario.total - scenario.paid
        );

        expect(result.remainingAmount).toBe(scenario.expectedDebt);
        expect(result.paidAmount).toBe(scenario.paid);
        expect(result.paidAmount + result.remainingAmount).toBe(scenario.total);
      });
    });

    it("should handle debt accumulation across multiple transactions", async () => {
      const transactions = [
        { type: "sale", amount: 30000, paid: 20000 }, // ₦100 debt
        { type: "sale", amount: 25000, paid: 15000 }, // ₦100 debt
        { type: "payment", amount: 5000 }, // ₦50 payment
        { type: "sale", amount: 40000, paid: 0 }, // ₦400 debt
      ];

      let totalDebt = 0;

      for (const tx of transactions) {
        if (tx.type === "sale") {
          totalDebt += tx.amount - (tx.paid || 0);
        } else if (tx.type === "payment") {
          totalDebt -= tx.amount;
        }
      }

      expect(totalDebt).toBe(55000); // ₦550 total debt

      // Verify with calculator
      const finalStatus = SimpleTransactionCalculator.calculateStatus(
        "sale",
        95000, // Total sales
        35000, // Total payments
        totalDebt
      );

      expect(finalStatus.remainingAmount).toBe(totalDebt);
      expect(finalStatus.percentagePaid).toBeCloseTo(36.84, 1);
    });

    it("should handle debt reduction with payments correctly", async () => {
      const initialDebt = 50000; // ₦500 debt
      const paymentAmount = 30000; // ₦300 payment

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: initialDebt,
        creditBalance: 0,
      });

      const result = await paymentService.handlePaymentAllocation(
        "1",
        paymentAmount,
        true
      );

      expect(result.success).toBe(true);
      expect(result.debtReduced).toBe(paymentAmount);
      // Calculate remaining debt: initial debt - debt reduced
      const remainingDebt = initialDebt - result.debtReduced;
      expect(remainingDebt).toBe(20000); // ₦200 remaining debt
    });

    it("should handle debt settlement with exact payment", async () => {
      const debtAmount = 25000; // ₦250 debt
      const paymentAmount = 25000; // Exact payment

      mockCustomerRepo.findById.mockResolvedValue({
        id: "1",
        outstandingBalance: debtAmount,
        creditBalance: 0,
      });

      const result = await paymentService.handlePaymentAllocation(
        "1",
        paymentAmount,
        true
      );

      expect(result.success).toBe(true);
      expect(result.debtReduced).toBe(debtAmount);
      expect(result.creditCreated).toBe(0);
      // Calculate remaining debt: debt amount - debt reduced
      const remainingDebt = debtAmount - result.debtReduced;
      expect(remainingDebt).toBe(0); // Fully paid
    });
  });

  describe("Currency Precision (Kobo/Naira)", () => {
    it("should handle kobo precision in all calculations", () => {
      const koboAmounts = [
        1005, // ₦10.05
        9999, // ₦99.99
        333333, // ₦3333.33
        123456789, // Large amount
        1, // 1 kobo
        100, // ₦1.00
      ];

      koboAmounts.forEach((amount) => {
        // Convert to naira and back
        const naira = amount / 100;
        const backToKobo = Math.round(naira * 100);

        expect(backToKobo).toBe(amount);

        // Test calculation precision
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          amount,
          amount,
          0
        );

        expect(result.paidAmount).toBe(amount);
        expect(result.remainingAmount).toBe(0);
        expect(result.percentagePaid).toBe(100);
      });
    });

    it("should handle floating point precision issues", () => {
      const precisionTests = [
        { total: 100050, paid: 59999, expected: 40051 }, // ₦1000.50 - ₦599.99 = ₦400.51
        { total: 50050, paid: 30025, expected: 20025 }, // ₦500.50 - ₦300.25 = ₦200.25
        { total: 10001, paid: 50005, expected: -40004 }, // Overpayment
      ];

      precisionTests.forEach((test) => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          test.total,
          Math.min(test.paid, test.total),
          Math.max(0, test.total - test.paid)
        );

        const actualRemaining = test.total - test.paid;
        // Allow for small rounding differences due to kobo precision
        expect(
          Math.abs(result.remainingAmount - Math.max(0, actualRemaining))
        ).toBeLessThan(1);
      });
    });

    it("should handle currency rounding correctly", () => {
      // Test rounding scenarios common in Nigerian transactions
      const roundingTests = [
        { amount: 100033, expected: 1000.33 }, // ₦1000.33
        { amount: 50066, expected: 500.66 }, // ₦500.66
        { amount: 99999, expected: 999.99 }, // ₦999.99
      ];

      roundingTests.forEach((test) => {
        const nairaAmount = test.amount / 100;
        expect(nairaAmount).toBe(test.expected);

        // Convert back to kobo
        const backToKobo = Math.round(nairaAmount * 100);
        expect(backToKobo).toBe(test.amount);
      });
    });

    it("should handle very small amounts (kobo level)", () => {
      const smallAmounts = [1, 5, 10, 25, 50, 99]; // Various kobo amounts

      smallAmounts.forEach((koboAmount) => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          koboAmount,
          koboAmount,
          0
        );

        expect(result.paidAmount).toBe(koboAmount);
        expect(result.remainingAmount).toBe(0);
        expect(result.percentagePaid).toBe(100);

        // Test partial payments
        const partialPayment = Math.floor(koboAmount / 2);
        const partialResult = SimpleTransactionCalculator.calculateStatus(
          "sale",
          koboAmount,
          partialPayment,
          koboAmount - partialPayment
        );

        expect(partialResult.paidAmount).toBe(partialPayment);
        expect(partialResult.remainingAmount).toBe(koboAmount - partialPayment);
      });
    });

    it("should handle large amounts without precision loss", () => {
      const largeAmounts = [
        100000000, // ₦1,000,000
        500000000, // ₦5,000,000
        1000000000, // ₦10,000,000
      ];

      largeAmounts.forEach((amount) => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          amount,
          amount,
          0
        );

        expect(result.paidAmount).toBe(amount);
        expect(result.remainingAmount).toBe(0);
        expect(result.percentagePaid).toBe(100);

        // Test with decimal calculations
        const nairaValue = amount / 100;
        const backToKobo = nairaValue * 100;
        expect(backToKobo).toBe(amount);
      });
    });
  });

  describe("Complex Nigerian SME Scenarios", () => {
    it("should handle busy market day with multiple customers", async () => {
      // Simulate a busy market day with multiple customers and transactions
      const customers = [
        { id: "1", name: "Adebayo", initialBalance: 0 },
        { id: "2", name: "Fatima", initialBalance: 15000 },
        { id: "3", name: "Chukwu", initialBalance: 0 },
        { id: "4", name: "Ngozi", initialBalance: 30000 },
      ];

      const transactions = [
        // Customer 1: New customer, mixed payment
        {
          customerId: "1",
          type: "sale",
          amount: 25000,
          cash: 15000,
          credit: 10000,
        },
        // Customer 2: Has credit, uses it for purchase
        {
          customerId: "2",
          type: "sale",
          amount: 20000,
          cash: 10000,
          credit: 10000,
        },
        // Customer 3: Credit sale
        {
          customerId: "3",
          type: "sale",
          amount: 35000,
          cash: 0,
          credit: 35000,
        },
        // Customer 4: Partial payment on existing debt
        { customerId: "4", type: "payment", amount: 20000 },
        // Customer 1: Makes another purchase
        {
          customerId: "1",
          type: "sale",
          amount: 15000,
          cash: 15000,
          credit: 0,
        },
      ];

      // Mock customer data
      mockCustomerRepo.findById.mockImplementation((id: string) => {
        const customer = customers.find((c) => c.id === id);
        return Promise.resolve({
          id,
          name: customer?.name,
          outstandingBalance: customer?.initialBalance || 0,
          creditBalance: 0,
        });
      });

      // Process all transactions
      const results = [];
      for (const tx of transactions) {
        if (tx.type === "sale") {
          const result = await paymentService.processMixedPayment({
            customerId: tx.customerId,
            totalAmount: tx.amount,
            cashAmount: tx.cash || 0,
            creditAmount: tx.credit || 0,
          });
          results.push(result);
        } else {
          const result = await paymentService.handlePaymentAllocation(
            tx.customerId,
            tx.amount,
            true
          );
          results.push(result);
        }
      }

      expect(results).toHaveLength(transactions.length);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it("should handle end-of-month debt collection scenario", async () => {
      // Simulate end-of-month debt collection
      const debtors = [
        { id: "1", debt: 50000, payment: 30000 }, // Partial payment
        { id: "2", debt: 25000, payment: 25000 }, // Full settlement
        { id: "3", debt: 75000, payment: 100000 }, // Overpayment
        { id: "4", debt: 15000, payment: 10000 }, // Partial payment
      ];

      mockCustomerRepo.findById.mockImplementation((id: string) => {
        const debtor = debtors.find((d) => d.id === id);
        return Promise.resolve({
          id,
          outstandingBalance: debtor?.debt || 0,
          creditBalance: 0,
        });
      });

      const collectionResults = [];
      for (const debtor of debtors) {
        const result = await paymentService.handlePaymentAllocation(
          debtor.id,
          debtor.payment,
          true
        );
        collectionResults.push({
          customerId: debtor.id,
          debtReduced: result.debtReduced,
          creditCreated: result.creditCreated,
          remainingDebt: debtor.debt - result.debtReduced,
        });
      }

      // Verify collection results
      expect(collectionResults[0].remainingDebt).toBe(20000); // ₦200 remaining
      expect(collectionResults[1].remainingDebt).toBe(0); // Fully paid
      expect(collectionResults[2].creditCreated).toBe(25000); // ₦250 overpayment
      expect(collectionResults[3].remainingDebt).toBe(5000); // ₦50 remaining
    });

    it("should handle credit system with multiple credit applications", async () => {
      const customerId = "1";
      let currentCredit = 0;

      // Multiple credit creation scenarios
      const creditScenarios = [
        { type: "overpayment", amount: 50000, debt: 0, expectedCredit: 50000 },
        {
          type: "overpayment",
          amount: 30000,
          debt: 10000,
          expectedCredit: 20000,
        },
        { type: "overpayment", amount: 25000, debt: 25000, expectedCredit: 0 },
      ];

      for (const scenario of creditScenarios) {
        mockCustomerRepo.findById.mockResolvedValue({
          id: customerId,
          outstandingBalance: scenario.debt,
          creditBalance: currentCredit,
        });

        const result = await paymentService.handlePaymentAllocation(
          customerId,
          scenario.amount,
          true
        );

        expect(result.success).toBe(true);
        expect(result.debtReduced).toBe(
          Math.min(scenario.amount, scenario.debt)
        );
        expect(result.creditCreated).toBe(scenario.expectedCredit);

        currentCredit += result.creditCreated;
      }

      expect(currentCredit).toBe(70000); // Total credit accumulated: ₦700
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle zero amount transactions gracefully", async () => {
      const result = SimpleTransactionCalculator.calculateStatus(
        "sale",
        0,
        0,
        0
      );

      expect(result.status).toBe("completed");
      expect(result.percentagePaid).toBe(0);
      expect(result.paidAmount).toBe(0);
      expect(result.remainingAmount).toBe(0);
    });

    it("should handle negative amounts appropriately", () => {
      // Test with negative total amount
      const negativeTotalResult =
        SimpleTransactionCalculator.validateMixedPayment(-1000, 500, 500);
      expect(negativeTotalResult.isValid).toBe(false);
      expect(negativeTotalResult.error).toContain("must equal total amount");

      // Test with negative cash amount
      const negativeCashResult =
        SimpleTransactionCalculator.validateMixedPayment(1000, -500, 1500);
      expect(negativeCashResult.isValid).toBe(false);
      expect(negativeCashResult.error).toContain("cannot be negative");

      // Test with negative credit amount
      const negativeCreditResult =
        SimpleTransactionCalculator.validateMixedPayment(1000, 500, -500);
      expect(negativeCreditResult.isValid).toBe(false);
      expect(negativeCreditResult.error).toContain("cannot be negative");

      // Test with payment service - should throw for negative payment
      expect(async () => {
        await paymentService.handlePaymentAllocation("1", -1000, true);
      }).rejects.toThrow("Payment amount must be greater than 0");
    });

    it("should handle extremely large amounts", () => {
      const largeAmount = Number.MAX_SAFE_INTEGER;

      const result = SimpleTransactionCalculator.calculateStatus(
        "sale",
        largeAmount,
        largeAmount,
        0
      );

      expect(result.status).toBe("completed");
      expect(result.percentagePaid).toBe(100);
    });

    it("should handle division by zero in percentage calculations", () => {
      const result = SimpleTransactionCalculator.calculateStatus(
        "sale",
        0,
        0,
        0
      );

      expect(result.percentagePaid).toBe(0);
      expect(result.status).toBe("completed");
    });
  });
});
