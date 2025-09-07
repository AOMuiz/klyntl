import { SimpleTransactionCalculator } from "../SimpleTransactionCalculator";

describe("SimpleTransactionCalculator", () => {
  describe("calculateStatus", () => {
    describe("Nigerian SME Edge Case 1: Payment and Refund Transactions", () => {
      it("should mark payment transactions as completed regardless of amounts", () => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "payment",
          1000,
          1000,
          0
        );

        expect(result).toEqual({
          status: "completed",
          paidAmount: 1000,
          remainingAmount: 0,
          percentagePaid: 100,
        });
      });

      it("should mark refund transactions as completed", () => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "refund",
          500,
          500,
          0
        );

        expect(result).toEqual({
          status: "completed",
          paidAmount: 500,
          remainingAmount: 0,
          percentagePaid: 100,
        });
      });
    });

    describe("Nigerian SME Edge Case 2: Sale Transaction Status Logic", () => {
      it("should mark fully paid sales as completed", () => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          2000,
          2000,
          0
        );

        expect(result).toEqual({
          status: "completed",
          paidAmount: 2000,
          remainingAmount: 0,
          percentagePaid: 100,
        });
      });

      it("should mark partially paid sales as partial", () => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          2000,
          800,
          1200
        );

        expect(result).toEqual({
          status: "partial",
          paidAmount: 800,
          remainingAmount: 1200,
          percentagePaid: 40,
        });
      });

      it("should mark unpaid sales as pending", () => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          1500,
          0,
          1500
        );

        expect(result).toEqual({
          status: "pending",
          paidAmount: 0,
          remainingAmount: 1500,
          percentagePaid: 0,
        });
      });
    });

    describe("Edge cases and data normalization", () => {
      it("should handle decimal amounts with kobo precision", () => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          1000.99,
          500.5,
          500.49
        );

        expect(result).toEqual({
          status: "partial",
          paidAmount: 501, // Rounded from 500.50
          remainingAmount: 500, // Rounded from 500.49
          percentagePaid: 50.05, // Calculated from rounded values
        });
      });

      it("should handle zero amounts gracefully", () => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          0,
          0,
          0
        );

        expect(result).toEqual({
          status: "completed", // Zero remaining = completed
          paidAmount: 0,
          remainingAmount: 0,
          percentagePaid: 0,
        });
      });

      it("should handle null/undefined values", () => {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          1000,
          undefined as any,
          null as any
        );

        expect(result).toEqual({
          status: "completed", // Remaining is 0 (null becomes 0) = completed
          paidAmount: 0,
          remainingAmount: 0,
          percentagePaid: 0,
        });
      });
    });
  });

  describe("calculateInitialAmounts", () => {
    describe("Nigerian SME Edge Case 3: Credit Transaction Handling", () => {
      it("should set credit transactions as unpaid", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "credit",
          "credit",
          1500
        );

        expect(result).toEqual({
          paidAmount: 0,
          remainingAmount: 1500,
          paymentMethod: "credit",
        });
      });
    });

    describe("Nigerian SME Edge Case 4: Payment Transaction Handling", () => {
      it("should set payment transactions as fully paid", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "payment",
          "cash",
          1000
        );

        expect(result).toEqual({
          paidAmount: 1000,
          remainingAmount: 0,
          paymentMethod: "cash",
        });
      });

      it("should default to cash for payment method if not provided", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "payment",
          "",
          500
        );

        expect(result).toEqual({
          paidAmount: 500,
          remainingAmount: 0,
          paymentMethod: "cash",
        });
      });
    });

    describe("Nigerian SME Edge Case 5: Sale Payment Methods", () => {
      it("should handle sale on credit (unpaid)", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "credit",
          2000
        );

        expect(result).toEqual({
          paidAmount: 0,
          remainingAmount: 2000,
          paymentMethod: "credit",
        });
      });

      it("should handle cash sale (fully paid)", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "cash",
          1500
        );

        expect(result).toEqual({
          paidAmount: 1500,
          remainingAmount: 0,
          paymentMethod: "cash",
        });
      });

      it("should handle bank transfer sale (fully paid)", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "bank_transfer",
          3000
        );

        expect(result).toEqual({
          paidAmount: 3000,
          remainingAmount: 0,
          paymentMethod: "bank_transfer",
        });
      });

      it("should handle POS sale (fully paid)", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "pos_card",
          2500
        );

        expect(result).toEqual({
          paidAmount: 2500,
          remainingAmount: 0,
          paymentMethod: "pos_card",
        });
      });
    });

    describe("Nigerian SME Edge Case 6: Mixed Payment Handling", () => {
      it("should handle mixed payment with partial cash", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "mixed",
          2000,
          800 // Cash portion
        );

        expect(result).toEqual({
          paidAmount: 800,
          remainingAmount: 1200, // Credit portion
          paymentMethod: "mixed",
        });
      });

      it("should handle mixed payment with exact total (edge case)", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "mixed",
          1000,
          1000 // Full amount as cash
        );

        expect(result).toEqual({
          paidAmount: 1000,
          remainingAmount: 0,
          paymentMethod: "mixed",
        });
      });

      it("should handle mixed payment with zero cash", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "mixed",
          1500,
          0 // No cash, all credit
        );

        expect(result).toEqual({
          paidAmount: 0,
          remainingAmount: 1500,
          paymentMethod: "mixed",
        });
      });

      it("should handle mixed payment without provided paid amount", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "mixed",
          1000
          // No providedPaidAmount
        );

        // Stays as mixed payment method, defaults to full payment behavior
        expect(result).toEqual({
          paidAmount: 1000,
          remainingAmount: 0,
          paymentMethod: "mixed", // Keeps mixed method
        });
      });
    });

    describe("Fallback scenarios", () => {
      it("should handle unknown transaction types", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "unknown",
          "cash",
          1000
        );

        expect(result).toEqual({
          paidAmount: 1000,
          remainingAmount: 0,
          paymentMethod: "cash",
        });
      });

      it("should default payment method to cash when not provided", () => {
        const result = SimpleTransactionCalculator.calculateInitialAmounts(
          "sale",
          "",
          500
        );

        expect(result).toEqual({
          paidAmount: 500,
          remainingAmount: 0,
          paymentMethod: "cash",
        });
      });
    });
  });

  describe("calculateDebtImpact", () => {
    it("should calculate debt increase for credit sales", () => {
      const result = SimpleTransactionCalculator.calculateDebtImpact(
        "sale",
        "credit",
        1500
      );

      expect(result).toEqual({
        change: 1500,
        isIncrease: true,
        isDecrease: false,
      });
    });

    it("should calculate no debt change for mixed payments (handled by caller)", () => {
      const result = SimpleTransactionCalculator.calculateDebtImpact(
        "sale",
        "mixed",
        2000
      );

      expect(result).toEqual({
        change: 0,
        isIncrease: false,
        isDecrease: false,
      });
    });

    it("should calculate debt increase for credit transactions", () => {
      const result = SimpleTransactionCalculator.calculateDebtImpact(
        "credit",
        "credit",
        1000
      );

      expect(result).toEqual({
        change: 1000,
        isIncrease: true,
        isDecrease: false,
      });
    });

    it("should calculate debt decrease for payments applied to debt", () => {
      const result = SimpleTransactionCalculator.calculateDebtImpact(
        "payment",
        "cash",
        800,
        true // Applied to debt
      );

      expect(result).toEqual({
        change: 800,
        isIncrease: false,
        isDecrease: true,
      });
    });

    it("should calculate no debt change for payments not applied to debt", () => {
      const result = SimpleTransactionCalculator.calculateDebtImpact(
        "payment",
        "cash",
        500,
        false // Not applied to debt
      );

      expect(result).toEqual({
        change: 0,
        isIncrease: false,
        isDecrease: false,
      });
    });

    it("should calculate debt decrease for refunds", () => {
      const result = SimpleTransactionCalculator.calculateDebtImpact(
        "refund",
        "cash",
        300
      );

      expect(result).toEqual({
        change: 300,
        isIncrease: false,
        isDecrease: true,
      });
    });

    it("should handle zero amounts", () => {
      const result = SimpleTransactionCalculator.calculateDebtImpact(
        "sale",
        "credit",
        0
      );

      expect(result).toEqual({
        change: 0,
        isIncrease: false,
        isDecrease: false,
      });
    });
  });

  describe("calculateCustomerBalanceImpact", () => {
    it("should calculate debt change for credit sales", () => {
      const result = SimpleTransactionCalculator.calculateCustomerBalanceImpact(
        "sale",
        "credit",
        2000,
        2000
      );

      expect(result).toEqual({
        debtChange: 2000,
        creditChange: 0,
      });
    });

    it("should calculate debt change for mixed payment sales", () => {
      const result = SimpleTransactionCalculator.calculateCustomerBalanceImpact(
        "sale",
        "mixed",
        2000,
        1200 // Remaining amount on credit
      );

      expect(result).toEqual({
        debtChange: 1200,
        creditChange: 0,
      });
    });

    it("should calculate debt change for credit transactions", () => {
      const result = SimpleTransactionCalculator.calculateCustomerBalanceImpact(
        "credit",
        "credit",
        1500,
        1500
      );

      expect(result).toEqual({
        debtChange: 1500,
        creditChange: 0,
      });
    });

    it("should calculate debt reduction for payments applied to debt", () => {
      const result = SimpleTransactionCalculator.calculateCustomerBalanceImpact(
        "payment",
        "cash",
        1000,
        0,
        true // Applied to debt
      );

      expect(result).toEqual({
        debtChange: -1000,
        creditChange: 0,
      });
    });

    it("should calculate credit creation for payments not applied to debt", () => {
      const result = SimpleTransactionCalculator.calculateCustomerBalanceImpact(
        "payment",
        "cash",
        500,
        0,
        false // Not applied to debt
      );

      expect(result).toEqual({
        debtChange: 0,
        creditChange: 500,
      });
    });

    it("should calculate debt reduction for refunds", () => {
      const result = SimpleTransactionCalculator.calculateCustomerBalanceImpact(
        "refund",
        "cash",
        300,
        0
      );

      expect(result).toEqual({
        debtChange: -300,
        creditChange: 0,
      });
    });

    it("should handle cash sales (no balance impact)", () => {
      const result = SimpleTransactionCalculator.calculateCustomerBalanceImpact(
        "sale",
        "cash",
        1000,
        0
      );

      expect(result).toEqual({
        debtChange: 0,
        creditChange: 0,
      });
    });
  });

  describe("handleOverpayment", () => {
    it("should handle exact payment (no overpayment)", () => {
      const result = SimpleTransactionCalculator.handleOverpayment(1000, 1000);

      expect(result).toEqual({
        debtCleared: 1000,
        creditCreated: 0,
      });
    });

    it("should handle overpayment scenario", () => {
      const result = SimpleTransactionCalculator.handleOverpayment(1500, 1000);

      expect(result).toEqual({
        debtCleared: 1000,
        creditCreated: 500,
      });
    });

    it("should handle partial payment (underpayment)", () => {
      const result = SimpleTransactionCalculator.handleOverpayment(600, 1000);

      expect(result).toEqual({
        debtCleared: 600,
        creditCreated: 0,
      });
    });

    it("should handle payment when no debt exists", () => {
      const result = SimpleTransactionCalculator.handleOverpayment(500, 0);

      expect(result).toEqual({
        debtCleared: 0,
        creditCreated: 500,
      });
    });

    it("should handle zero payment", () => {
      const result = SimpleTransactionCalculator.handleOverpayment(0, 1000);

      expect(result).toEqual({
        debtCleared: 0,
        creditCreated: 0,
      });
    });
  });

  describe("validateMixedPayment", () => {
    it("should validate correct mixed payment", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        2000,
        800,
        1200
      );

      expect(result).toEqual({
        isValid: true,
      });
    });

    it("should validate mixed payment without explicit credit amount", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        600
      );

      // When no credit amount provided, it defaults to 0, so cash + credit != total
      expect(result).toEqual({
        isValid: false,
        error: "Payment amounts must equal total amount",
      });
    });

    it("should reject negative cash amount", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        -100,
        1100
      );

      expect(result).toEqual({
        isValid: false,
        error: "Payment amounts cannot be negative",
      });
    });

    it("should reject negative credit amount", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        500,
        -500
      );

      expect(result).toEqual({
        isValid: false,
        error: "Payment amounts cannot be negative",
      });
    });

    it("should reject when amounts don't equal total", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        2000,
        800,
        1000 // Total: 1800, should be 2000
      );

      expect(result).toEqual({
        isValid: false,
        error: "Payment amounts must equal total amount",
      });
    });

    it("should reject when cash amount equals or exceeds total", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        1000,
        0
      );

      expect(result).toEqual({
        isValid: false,
        error: "For mixed payments, cash amount must be less than total",
      });
    });

    it("should handle small rounding differences", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        1000.01,
        600.0,
        400.01 // Difference of 0.01 should be acceptable
      );

      expect(result).toEqual({
        isValid: true,
      });
    });
  });

  describe("Currency conversion utilities", () => {
    describe("toKobo", () => {
      it("should convert Naira to Kobo correctly", () => {
        expect(SimpleTransactionCalculator.toKobo(10.5)).toBe(1050);
        expect(SimpleTransactionCalculator.toKobo(0.01)).toBe(1);
        expect(SimpleTransactionCalculator.toKobo(100)).toBe(10000);
        expect(SimpleTransactionCalculator.toKobo(0)).toBe(0);
      });

      it("should handle decimal precision correctly", () => {
        expect(SimpleTransactionCalculator.toKobo(10.999)).toBe(1100); // Rounded
        expect(SimpleTransactionCalculator.toKobo(10.001)).toBe(1000); // Rounded
      });
    });

    describe("toNaira", () => {
      it("should convert Kobo to Naira correctly", () => {
        expect(SimpleTransactionCalculator.toNaira(1050)).toBe(10.5);
        expect(SimpleTransactionCalculator.toNaira(1)).toBe(0.01);
        expect(SimpleTransactionCalculator.toNaira(10000)).toBe(100);
        expect(SimpleTransactionCalculator.toNaira(0)).toBe(0);
      });

      it("should handle rounding correctly", () => {
        expect(SimpleTransactionCalculator.toNaira(1051)).toBe(10.51);
        expect(SimpleTransactionCalculator.toNaira(1099)).toBe(10.99);
      });
    });

    describe("Round-trip conversion", () => {
      it("should maintain precision through round-trip conversion", () => {
        const originalNaira = 125.75;
        const kobo = SimpleTransactionCalculator.toKobo(originalNaira);
        const backToNaira = SimpleTransactionCalculator.toNaira(kobo);

        expect(backToNaira).toBe(originalNaira);
      });
    });
  });
});
