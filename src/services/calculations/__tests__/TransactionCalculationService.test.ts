import { SimpleTransactionCalculator } from "../SimpleTransactionCalculator";

describe("SimpleTransactionCalculator", () => {
  describe("calculateStatus", () => {
    it("should return completed for payment transactions", () => {
      const result = SimpleTransactionCalculator.calculateStatus(
        "payment",
        1000,
        1000,
        0
      );
      expect(result.status).toBe("completed");
    });

    it("should return completed for refund transactions", () => {
      const result = SimpleTransactionCalculator.calculateStatus(
        "refund",
        500,
        500,
        0
      );
      expect(result.status).toBe("completed");
    });

    it("should return completed when fully paid", () => {
      const result = SimpleTransactionCalculator.calculateStatus(
        "sale",
        1000,
        1000,
        0
      );
      expect(result.status).toBe("completed");
    });

    it("should return partial when partially paid", () => {
      const result = SimpleTransactionCalculator.calculateStatus(
        "sale",
        1000,
        500,
        500
      );
      expect(result.status).toBe("partial");
    });

    it("should return pending when not paid", () => {
      const result = SimpleTransactionCalculator.calculateStatus(
        "sale",
        1000,
        0,
        1000
      );
      expect(result.status).toBe("pending");
    });
  });

  describe("calculateInitialAmounts", () => {
    it("should handle credit transactions", () => {
      const result = SimpleTransactionCalculator.calculateInitialAmounts(
        "credit",
        "credit",
        1000
      );
      expect(result.paidAmount).toBe(0);
      expect(result.remainingAmount).toBe(1000);
      expect(result.paymentMethod).toBe("credit");
    });

    it("should handle cash sales", () => {
      const result = SimpleTransactionCalculator.calculateInitialAmounts(
        "sale",
        "cash",
        1000
      );
      expect(result.paidAmount).toBe(1000);
      expect(result.remainingAmount).toBe(0);
      expect(result.paymentMethod).toBe("cash");
    });

    it("should handle credit sales", () => {
      const result = SimpleTransactionCalculator.calculateInitialAmounts(
        "sale",
        "credit",
        1000
      );
      expect(result.paidAmount).toBe(0);
      expect(result.remainingAmount).toBe(1000);
      expect(result.paymentMethod).toBe("credit");
    });

    it("should handle mixed payments", () => {
      const result = SimpleTransactionCalculator.calculateInitialAmounts(
        "sale",
        "mixed",
        1000,
        600
      );
      expect(result.paidAmount).toBe(600);
      expect(result.remainingAmount).toBe(400);
      expect(result.paymentMethod).toBe("mixed");
    });
  });

  describe("validateMixedPayment", () => {
    it("should validate correct mixed payment", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        600,
        400
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject negative amounts", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        -100,
        1100
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("negative");
    });

    it("should reject amounts that don't sum to total", () => {
      const result = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        600,
        300
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("equal total");
    });
  });

  describe("handleOverpayment", () => {
    it("should handle overpayment correctly", () => {
      const result = SimpleTransactionCalculator.handleOverpayment(1500, 1000);
      expect(result.debtCleared).toBe(1000);
      expect(result.creditCreated).toBe(500);
    });

    it("should handle exact payment", () => {
      const result = SimpleTransactionCalculator.handleOverpayment(1000, 1000);
      expect(result.debtCleared).toBe(1000);
      expect(result.creditCreated).toBe(0);
    });

    it("should handle underpayment", () => {
      const result = SimpleTransactionCalculator.handleOverpayment(500, 1000);
      expect(result.debtCleared).toBe(500);
      expect(result.creditCreated).toBe(0);
    });
  });
});
