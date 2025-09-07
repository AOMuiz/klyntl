import { SimpleTransactionCalculator } from "../calculations/SimpleTransactionCalculator";

/**
 * Nigerian SME Transaction Workflows (End-to-End)
 *
 * Tests comprehensive business scenarios for Nigerian small businesses
 * using the SimpleTransactionCalculator for core calculations
 */

describe("Nigerian SME Transaction Workflows (End-to-End)", () => {
  describe("Nigerian SME Workflow 1: Complete Credit Sale to Payment Journey", () => {
    it("should calculate correct amounts for credit sale followed by payments", () => {
      // Step 1: Customer makes purchase on credit (₦50.00)
      const creditSaleAmounts =
        SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "credit",
          5000 // ₦50.00
        );

      expect(creditSaleAmounts).toEqual({
        paidAmount: 0,
        remainingAmount: 5000,
        paymentMethod: "credit",
      });

      // Calculate debt impact
      const saleDebtImpact = SimpleTransactionCalculator.calculateDebtImpact(
        "sale",
        "credit",
        5000
      );

      expect(saleDebtImpact).toEqual({
        change: 5000,
        isIncrease: true,
        isDecrease: false,
      });

      // Step 2: Customer makes partial payment (₦30.00)
      const partialPayment = SimpleTransactionCalculator.calculateDebtImpact(
        "payment",
        "cash",
        3000, // ₦30.00
        true // Applied to debt
      );

      expect(partialPayment).toEqual({
        change: 3000,
        isIncrease: false,
        isDecrease: true,
      });

      // Step 3: Customer completes payment with overpayment (₦25.00 vs ₦20.00 remaining)
      const overpaymentResult = SimpleTransactionCalculator.handleOverpayment(
        2500, // ₦25.00 payment
        2000 // ₦20.00 remaining debt
      );

      expect(overpaymentResult).toEqual({
        debtCleared: 2000, // ₦20.00 debt cleared
        creditCreated: 500, // ₦5.00 credit created
      });
    });
  });

  describe("Nigerian SME Workflow 2: Mixed Payment Sale Scenarios", () => {
    it("should handle mixed payment validation and calculations", () => {
      // Validate mixed payment structure
      const mixedPaymentValidation =
        SimpleTransactionCalculator.validateMixedPayment(
          8000, // ₦80.00 total
          5000, // ₦50.00 cash
          3000 // ₦30.00 credit
        );

      expect(mixedPaymentValidation).toEqual({
        isValid: true,
      });

      // Calculate initial amounts for mixed payment
      const mixedSaleAmounts =
        SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "mixed",
          8000, // ₦80.00 total
          5000 // ₦50.00 cash portion
        );

      expect(mixedSaleAmounts).toEqual({
        paidAmount: 5000,
        remainingAmount: 3000, // ₦30.00 on credit
        paymentMethod: "mixed",
      });

      // Calculate customer balance impact
      const balanceImpact =
        SimpleTransactionCalculator.calculateCustomerBalanceImpact(
          "sale",
          "mixed",
          8000,
          3000 // Remaining amount on credit
        );

      expect(balanceImpact).toEqual({
        debtChange: 3000, // ₦30.00 added to debt
        creditChange: 0,
      });
    });

    it("should reject invalid mixed payments", () => {
      // Test cash amount exceeding total
      const invalidMixed1 = SimpleTransactionCalculator.validateMixedPayment(
        1000, // ₦10.00 total
        1200, // ₦12.00 cash (invalid)
        0
      );

      expect(invalidMixed1).toEqual({
        isValid: false,
        error: "Payment amounts must equal total amount", // This error comes first
      });

      // Test negative amounts
      const invalidMixed2 = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        800,
        -200 // Negative credit (invalid)
      );

      expect(invalidMixed2).toEqual({
        isValid: false,
        error: "Payment amounts cannot be negative",
      });

      // Test amounts not adding up
      const invalidMixed3 = SimpleTransactionCalculator.validateMixedPayment(
        2000, // ₦20.00 total
        800, // ₦8.00 cash
        1000 // ₦10.00 credit = ₦18.00 total (invalid)
      );

      expect(invalidMixed3).toEqual({
        isValid: false,
        error: "Payment amounts must equal total amount",
      });
    });
  });

  describe("Nigerian SME Workflow 3: Transaction Status Management", () => {
    it("should correctly calculate transaction statuses for all payment types", () => {
      // Completed payment
      const completedPayment = SimpleTransactionCalculator.calculateStatus(
        "payment",
        1000,
        1000,
        0
      );

      expect(completedPayment).toEqual({
        status: "completed",
        paidAmount: 1000,
        remainingAmount: 0,
        percentagePaid: 100,
      });

      // Partial sale payment
      const partialSale = SimpleTransactionCalculator.calculateStatus(
        "sale",
        2000, // ₦20.00 total
        800, // ₦8.00 paid
        1200 // ₦12.00 remaining
      );

      expect(partialSale).toEqual({
        status: "partial",
        paidAmount: 800,
        remainingAmount: 1200,
        percentagePaid: 40,
      });

      // Pending sale (no payment)
      const pendingSale = SimpleTransactionCalculator.calculateStatus(
        "sale",
        1500,
        0,
        1500
      );

      expect(pendingSale).toEqual({
        status: "pending",
        paidAmount: 0,
        remainingAmount: 1500,
        percentagePaid: 0,
      });

      // Completed sale (full payment)
      const completedSale = SimpleTransactionCalculator.calculateStatus(
        "sale",
        3000,
        3000,
        0
      );

      expect(completedSale).toEqual({
        status: "completed",
        paidAmount: 3000,
        remainingAmount: 0,
        percentagePaid: 100,
      });
    });
  });

  describe("Nigerian SME Workflow 4: Credit and Refund Management", () => {
    it("should handle credit transaction calculations", () => {
      // Credit transaction (adds to customer debt)
      const creditTransactionAmounts =
        SimpleTransactionCalculator.calculateInitialAmounts(
          "credit",
          "credit",
          1500
        );

      expect(creditTransactionAmounts).toEqual({
        paidAmount: 0,
        remainingAmount: 1500,
        paymentMethod: "credit",
      });

      const creditDebtImpact = SimpleTransactionCalculator.calculateDebtImpact(
        "credit",
        "credit",
        1500
      );

      expect(creditDebtImpact).toEqual({
        change: 1500,
        isIncrease: true,
        isDecrease: false,
      });
    });

    it("should handle refund transaction calculations", () => {
      // Refund reduces customer debt
      const refundDebtImpact = SimpleTransactionCalculator.calculateDebtImpact(
        "refund",
        "cash",
        800
      );

      expect(refundDebtImpact).toEqual({
        change: 800,
        isIncrease: false,
        isDecrease: true,
      });

      // Refund customer balance impact
      const refundBalanceImpact =
        SimpleTransactionCalculator.calculateCustomerBalanceImpact(
          "refund",
          "cash",
          800,
          0 // No remaining amount for refunds
        );

      expect(refundBalanceImpact).toEqual({
        debtChange: -800, // Reduces debt
        creditChange: 0,
      });
    });
  });

  describe("Nigerian SME Workflow 5: Payment Application Scenarios", () => {
    it("should correctly calculate payment applications to debt vs credit creation", () => {
      // Payment applied to existing debt
      const debtPayment =
        SimpleTransactionCalculator.calculateCustomerBalanceImpact(
          "payment",
          "cash",
          1500,
          0,
          true // Applied to debt
        );

      expect(debtPayment).toEqual({
        debtChange: -1500, // Reduces debt
        creditChange: 0,
      });

      // Payment not applied to debt (creates credit)
      const creditPayment =
        SimpleTransactionCalculator.calculateCustomerBalanceImpact(
          "payment",
          "cash",
          1000,
          0,
          false // Not applied to debt
        );

      expect(creditPayment).toEqual({
        debtChange: 0,
        creditChange: 1000, // Creates credit
      });

      // Complex overpayment scenario
      const complexOverpayment = SimpleTransactionCalculator.handleOverpayment(
        3500, // ₦35.00 payment
        2000 // ₦20.00 debt
      );

      expect(complexOverpayment).toEqual({
        debtCleared: 2000, // ₦20.00 debt cleared
        creditCreated: 1500, // ₦15.00 credit created
      });
    });
  });

  describe("Nigerian SME Workflow 6: Currency Precision and Edge Cases", () => {
    it("should handle kobo-level precision correctly", () => {
      // Test currency conversion
      expect(SimpleTransactionCalculator.toKobo(15.99)).toBe(1599);
      expect(SimpleTransactionCalculator.toNaira(1599)).toBe(15.99);

      // Test rounding in calculations
      const koboLevelSale = SimpleTransactionCalculator.calculateStatus(
        "sale",
        1599, // ₦15.99
        999, // ₦9.99 paid
        600 // ₦6.00 remaining
      );

      expect(koboLevelSale).toEqual({
        status: "partial",
        paidAmount: 999,
        remainingAmount: 600,
        percentagePaid: 62.48, // Correct calculation: Math.round((999/1599)*100*100)/100
      });
    });

    it("should handle edge cases gracefully", () => {
      // Zero amounts
      const zeroAmountStatus = SimpleTransactionCalculator.calculateStatus(
        "sale",
        0,
        0,
        0
      );

      expect(zeroAmountStatus).toEqual({
        status: "completed", // Zero remaining amount = completed
        paidAmount: 0,
        remainingAmount: 0,
        percentagePaid: 0,
      });

      // Payment when no debt exists
      const noDebtPayment = SimpleTransactionCalculator.handleOverpayment(
        1000, // ₦10.00 payment
        0 // No existing debt
      );

      expect(noDebtPayment).toEqual({
        debtCleared: 0,
        creditCreated: 1000, // All becomes credit
      });

      // Exact payment (no overpayment)
      const exactPayment = SimpleTransactionCalculator.handleOverpayment(
        1500, // ₦15.00 payment
        1500 // ₦15.00 debt
      );

      expect(exactPayment).toEqual({
        debtCleared: 1500,
        creditCreated: 0,
      });
    });
  });

  describe("Nigerian SME Workflow 7: Business Logic Validation", () => {
    it("should enforce Nigerian SME business rules", () => {
      // Cash sales should be fully paid
      const cashSale = SimpleTransactionCalculator.calculateInitialAmounts(
        "sale",
        "cash",
        2000
      );

      expect(cashSale).toEqual({
        paidAmount: 2000,
        remainingAmount: 0,
        paymentMethod: "cash",
      });

      // Bank transfer sales should be fully paid
      const bankTransferSale =
        SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "bank_transfer",
          3500
        );

      expect(bankTransferSale).toEqual({
        paidAmount: 3500,
        remainingAmount: 0,
        paymentMethod: "bank_transfer",
      });

      // POS card sales should be fully paid
      const posSale = SimpleTransactionCalculator.calculateInitialAmounts(
        "sale",
        "pos_card",
        2800
      );

      expect(posSale).toEqual({
        paidAmount: 2800,
        remainingAmount: 0,
        paymentMethod: "pos_card",
      });

      // Credit sales should be unpaid
      const creditSale = SimpleTransactionCalculator.calculateInitialAmounts(
        "sale",
        "credit",
        4000
      );

      expect(creditSale).toEqual({
        paidAmount: 0,
        remainingAmount: 4000,
        paymentMethod: "credit",
      });
    });

    it("should handle payment method defaults correctly", () => {
      // Empty payment method defaults to cash
      const defaultPaymentMethod =
        SimpleTransactionCalculator.calculateInitialAmounts("sale", "", 1000);

      expect(defaultPaymentMethod).toEqual({
        paidAmount: 1000,
        remainingAmount: 0,
        paymentMethod: "cash",
      });

      // Mixed payment without provided paid amount defaults to cash behavior
      const mixedWithoutAmount =
        SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "mixed",
          1500
          // No providedPaidAmount
        );

      expect(mixedWithoutAmount).toEqual({
        paidAmount: 1500,
        remainingAmount: 0,
        paymentMethod: "mixed", // Keeps mixed payment method
      });
    });
  });
});
