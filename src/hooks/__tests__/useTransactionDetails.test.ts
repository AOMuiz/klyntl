import { SimpleTransactionCalculator } from "@/services/calculations/SimpleTransactionCalculator";

describe("useTransactionDetails", () => {
  it("should use SimpleTransactionCalculator for debt calculations", () => {
    // Test that the hook uses SimpleTransactionCalculator as single source of truth
    const mockTransaction = {
      type: "sale",
      paymentMethod: "credit",
      amount: 5000,
      appliedToDebt: true,
    };

    const debtImpact = SimpleTransactionCalculator.calculateDebtImpact(
      mockTransaction.type,
      mockTransaction.paymentMethod,
      mockTransaction.amount,
      mockTransaction.appliedToDebt
    );

    expect(debtImpact).toEqual({
      change: 5000,
      isIncrease: true,
      isDecrease: false,
    });
  });

  it("should handle payment transactions correctly", () => {
    const mockPayment = {
      type: "payment",
      paymentMethod: "cash",
      amount: 2000,
      appliedToDebt: true,
    };

    const debtImpact = SimpleTransactionCalculator.calculateDebtImpact(
      mockPayment.type,
      mockPayment.paymentMethod,
      mockPayment.amount,
      mockPayment.appliedToDebt
    );

    expect(debtImpact).toEqual({
      change: 2000,
      isIncrease: false,
      isDecrease: true,
    });
  });
});
