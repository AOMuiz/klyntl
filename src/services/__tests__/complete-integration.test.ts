import { SimpleTransactionCalculator } from "../calculations/SimpleTransactionCalculator";

describe("Complete Integration Test", () => {
  describe("Simplified Transaction System", () => {
    it("should have essential calculation methods", () => {
      // Test that all essential methods exist
      expect(typeof SimpleTransactionCalculator.calculateStatus).toBe(
        "function"
      );
      expect(typeof SimpleTransactionCalculator.calculateInitialAmounts).toBe(
        "function"
      );
      expect(typeof SimpleTransactionCalculator.validateMixedPayment).toBe(
        "function"
      );
      expect(typeof SimpleTransactionCalculator.handleOverpayment).toBe(
        "function"
      );
    });

    it("should handle the 6 essential edge cases", () => {
      // 1. Overpayment
      const overpayment = SimpleTransactionCalculator.handleOverpayment(
        1500,
        1000
      );
      expect(overpayment.creditCreated).toBe(500);

      // 2. First payment (handled by overpayment when debt = 0)
      const firstPayment = SimpleTransactionCalculator.handleOverpayment(
        1000,
        0
      );
      expect(firstPayment.creditCreated).toBe(1000);

      // 3. Mixed payment validation
      const validation = SimpleTransactionCalculator.validateMixedPayment(
        1000,
        600,
        400
      );
      expect(validation.isValid).toBe(true);

      // 4. Credit transaction calculation
      const creditCalc = SimpleTransactionCalculator.calculateInitialAmounts(
        "credit",
        "credit",
        1000
      );
      expect(creditCalc.remainingAmount).toBe(1000);

      // 5. Precision handling (kobo conversion)
      const kobo = SimpleTransactionCalculator.toKobo(10.5);
      expect(kobo).toBe(1050);

      // 6. Status calculation
      const status = SimpleTransactionCalculator.calculateStatus(
        "sale",
        1000,
        500,
        500
      );
      expect(status.status).toBe("partial");
    });
  });
});
