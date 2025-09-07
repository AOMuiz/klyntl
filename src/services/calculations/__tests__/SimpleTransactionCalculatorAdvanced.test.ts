import { SimpleTransactionCalculator } from "../SimpleTransactionCalculator";

/**
 * Advanced Edge Case Tests for Production Nigerian SME Scenarios
 *
 * Tests complex real-world scenarios that could occur in production
 */

describe("SimpleTransactionCalculator Advanced Edge Cases", () => {
  describe("Boundary Value Analysis", () => {
    describe("Currency Precision Boundaries", () => {
      it("should handle maximum safe integer values in kobo", () => {
        // Test near JavaScript's MAX_SAFE_INTEGER limit
        const maxSafeKobo = 900000000000000; // 9 trillion kobo = 90 billion naira

        const result = SimpleTransactionCalculator.toNaira(maxSafeKobo);
        expect(result).toBe(9000000000000); // 9 trillion naira

        // Round trip conversion
        const backToKobo = SimpleTransactionCalculator.toKobo(result);
        expect(backToKobo).toBe(maxSafeKobo);
      });

      it("should handle minimum positive currency values", () => {
        // Test smallest possible transaction (1 kobo)
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          1,
          1,
          0
        );

        expect(result).toEqual({
          status: "completed",
          paidAmount: 1,
          remainingAmount: 0,
          percentagePaid: 100,
        });
      });

      it("should handle floating point precision edge cases", () => {
        // Test values that commonly cause floating point issues
        const problematicValues = [
          0.1 + 0.2, // Should be 0.3 but could be 0.30000000000000004
          1.005 * 100, // Should be 100.5 but could have precision issues
          999.99,
          1000.01,
          10.005,
        ];

        problematicValues.forEach((value) => {
          const kobo = SimpleTransactionCalculator.toKobo(value);
          const backToNaira = SimpleTransactionCalculator.toNaira(kobo);

          // Should maintain reasonable precision (within 1 kobo)
          expect(Math.abs(backToNaira - value)).toBeLessThan(0.01);
        });
      });
    });

    describe("Percentage Calculation Boundaries", () => {
      it("should handle edge cases in percentage calculations", () => {
        // Test very small percentages
        const result1 = SimpleTransactionCalculator.calculateStatus(
          "sale",
          1000000,
          1,
          999999
        );
        expect(result1.percentagePaid).toBe(0); // Should round to 0

        // Test very large amounts
        const result2 = SimpleTransactionCalculator.calculateStatus(
          "sale",
          999999999,
          999999998,
          1
        );
        expect(result2.percentagePaid).toBeCloseTo(100, 2);

        // Test exact boundary (99.99% vs 100%)
        const result3 = SimpleTransactionCalculator.calculateStatus(
          "sale",
          10000,
          9999,
          1
        );
        expect(result3.percentagePaid).toBe(99.99);
      });
    });
  });

  describe("Complex Nigerian SME Business Scenarios", () => {
    describe("Multi-Payment Journey Edge Cases", () => {
      it("should handle customer making tiny overpayments repeatedly", () => {
        // Scenario: Customer pays in small increments with tiny overpayments
        let remainingDebt = 10000; // ₦100.00

        // Multiple small payments with 1 kobo overpayments
        for (let i = 0; i < 5; i++) {
          const payment = Math.min(2001, remainingDebt + 1); // 1 kobo overpayment each time
          const overpaymentResult =
            SimpleTransactionCalculator.handleOverpayment(
              payment,
              remainingDebt
            );

          expect(overpaymentResult.debtCleared).toBe(
            Math.min(payment, remainingDebt)
          );
          expect(overpaymentResult.creditCreated).toBe(
            Math.max(0, payment - remainingDebt)
          );

          remainingDebt = Math.max(0, remainingDebt - payment);
        }

        expect(remainingDebt).toBe(0);
      });

      it("should handle mixed payment with fractional kobo amounts", () => {
        // Scenario: POS machine rounds to nearest kobo, creating small discrepancies
        const total = 12567; // ₦125.67
        const cashAmount = 7533; // ₦75.33
        const creditAmount = 5034; // ₦50.34 (1 kobo extra due to rounding)

        const validation = SimpleTransactionCalculator.validateMixedPayment(
          total,
          cashAmount,
          creditAmount
        );

        // Check if amounts match total (allowing for rounding)
        const actualTotal = cashAmount + creditAmount;
        const difference = Math.abs(actualTotal - total);

        if (difference === 1) {
          // 1 kobo difference should be considered valid for rounding
          expect(validation.isValid).toBe(true);
        } else {
          // Should handle 1 kobo rounding differences
          expect(validation.isValid).toBe(false); // Actually invalid due to total mismatch
          expect(validation.error).toBe(
            "Payment amounts must equal total amount"
          );
        }
      });

      it("should handle customer with extremely high transaction volume", () => {
        // Scenario: Large wholesale customer with many transactions
        const transactions = Array.from({ length: 100 }, (_, i) => ({
          amount: (i + 1) * 50000, // ₦500, ₦1000, ₦1500, etc.
          type: i % 3 === 0 ? "sale" : "payment",
        }));

        let totalDebt = 0;
        let totalCredit = 0;

        transactions.forEach((tx) => {
          if (tx.type === "sale") {
            const impact =
              SimpleTransactionCalculator.calculateCustomerBalanceImpact(
                "sale",
                "credit",
                tx.amount,
                tx.amount
              );
            totalDebt += impact.debtChange;
          } else {
            // Payment reduces debt or creates credit
            const overpaymentResult =
              SimpleTransactionCalculator.handleOverpayment(
                tx.amount,
                totalDebt
              );
            totalDebt = Math.max(0, totalDebt - overpaymentResult.debtCleared);
            totalCredit += overpaymentResult.creditCreated;
          }
        });

        // Validate final state is reasonable
        expect(totalDebt).toBeGreaterThanOrEqual(0);
        expect(totalCredit).toBeGreaterThanOrEqual(0);
        expect(totalDebt + totalCredit).toBeGreaterThan(0); // Some balance should exist
      });
    });

    describe("Cross-Currency Calculation Edge Cases", () => {
      it("should handle calculations spanning different magnitude orders", () => {
        // Scenario: Small shop with both tiny and large transactions
        const transactions = [
          { amount: 1, description: "1 kobo transaction" },
          { amount: 50, description: "50 kobo transaction" },
          { amount: 100000000, description: "1 million naira transaction" },
          { amount: 999999999, description: "Near max transaction" },
        ];

        transactions.forEach((tx) => {
          const result = SimpleTransactionCalculator.calculateStatus(
            "sale",
            tx.amount,
            tx.amount,
            0
          );
          expect(result.status).toBe("completed");
          expect(result.percentagePaid).toBe(100);
        });
      });

      it("should handle rapid currency conversions without drift", () => {
        let amount = 12345.67; // Start with ₦123.45.67

        // Convert back and forth many times
        for (let i = 0; i < 1000; i++) {
          const kobo = SimpleTransactionCalculator.toKobo(amount);
          amount = SimpleTransactionCalculator.toNaira(kobo);
        }

        // Should maintain original precision
        expect(amount).toBe(12345.67);
      });
    });

    describe("Payment Method Validation Edge Cases", () => {
      it("should handle mixed payment validation with rounding edge cases", () => {
        // Scenario: Payment amounts that require careful rounding
        const testCases = [
          { total: 10001, cash: 6000, credit: 4001 }, // 1 kobo extra
          { total: 9999, cash: 5000, credit: 4999 }, // Perfect split
          { total: 10000, cash: 3333, credit: 6667 }, // Rounding required
          { total: 15555, cash: 9999, credit: 5556 }, // 1 kobo extra
        ];

        testCases.forEach((test) => {
          const validation = SimpleTransactionCalculator.validateMixedPayment(
            test.total,
            test.cash,
            test.credit
          );

          const actualTotal = test.cash + test.credit;
          const difference = Math.abs(actualTotal - test.total);

          if (difference <= 1) {
            // Allow 1 kobo difference for rounding
            expect(validation.isValid).toBe(true);
          } else {
            expect(validation.isValid).toBe(false);
          }
        });
      });

      it("should handle payment method edge cases", () => {
        const edgeCases = [
          { method: "", expected: "cash" }, // Empty string
          { method: "  cash  ", expected: "cash" }, // Should handle if trimmed
          { method: "CASH", expected: "CASH" }, // Should preserve case
          { method: "unknown_method", expected: "unknown_method" }, // Unknown methods preserved
        ];

        edgeCases.forEach((testCase) => {
          const result = SimpleTransactionCalculator.calculateInitialAmounts(
            "payment",
            testCase.method,
            1000
          );

          if (testCase.method === "") {
            expect(result.paymentMethod).toBe("cash"); // Defaults to cash
          } else {
            expect(result.paymentMethod).toBe(testCase.method); // Preserves input
          }
        });
      });
    });

    describe("Transaction Status Edge Cases", () => {
      it("should handle transaction status with floating point arithmetic", () => {
        // Scenario: Amounts that could cause floating point issues
        const problematicCalculations = [
          { total: 333, paid: 111, remaining: 222 }, // Perfect thirds
          { total: 1000, paid: 333, remaining: 667 }, // 1/3 vs 2/3
          { total: 999, paid: 333, remaining: 666 }, // Close to thirds
          { total: 10001, paid: 3334, remaining: 6667 }, // Large amounts
        ];

        problematicCalculations.forEach((calc) => {
          const result = SimpleTransactionCalculator.calculateStatus(
            "sale",
            calc.total,
            calc.paid,
            calc.remaining
          );

          // Validate that percentage is reasonable
          expect(result.percentagePaid).toBeGreaterThanOrEqual(0);
          expect(result.percentagePaid).toBeLessThanOrEqual(100);

          // Validate status logic
          if (result.remainingAmount <= 0) {
            expect(result.status).toBe("completed");
          } else if (result.paidAmount > 0) {
            expect(result.status).toBe("partial");
          } else {
            expect(result.status).toBe("pending");
          }
        });
      });

      it("should handle null/undefined/NaN values gracefully", () => {
        const invalidInputs = [
          { total: NaN, paid: 1000, remaining: 0 },
          { total: Infinity, paid: 1000, remaining: 0 },
          { total: -Infinity, paid: 1000, remaining: 0 },
          { total: 1000, paid: NaN, remaining: 0 },
          { total: 1000, paid: Infinity, remaining: 0 },
        ];

        invalidInputs.forEach((input) => {
          const result = SimpleTransactionCalculator.calculateStatus(
            "sale",
            input.total,
            input.paid,
            input.remaining
          );

          // Should handle gracefully without throwing
          expect(result).toBeDefined();
          expect(["pending", "partial", "completed"]).toContain(result.status);
          expect(result.percentagePaid).toBeGreaterThanOrEqual(0);
        });
      });
    });

    describe("Nigerian SME Business Rules Edge Cases", () => {
      it("should handle weekend/holiday transaction processing", () => {
        // Scenario: Different payment methods might have different processing times
        const paymentMethods = [
          "cash",
          "bank_transfer",
          "pos_card",
          "credit",
          "mixed",
        ];

        paymentMethods.forEach((method) => {
          const result = SimpleTransactionCalculator.calculateInitialAmounts(
            "sale",
            method,
            50000, // ₦500
            method === "mixed" ? 30000 : undefined // ₦300 cash if mixed
          );

          // All payment methods should be processed consistently
          expect(result).toBeDefined();
          expect(result.paymentMethod).toBe(method);

          if (method === "credit") {
            expect(result.paidAmount).toBe(0);
            expect(result.remainingAmount).toBe(50000);
          } else if (method === "mixed") {
            expect(result.paidAmount).toBe(30000);
            expect(result.remainingAmount).toBe(20000);
          } else {
            expect(result.paidAmount).toBe(50000);
            expect(result.remainingAmount).toBe(0);
          }
        });
      });

      it("should handle VAT/tax calculation edge cases", () => {
        // Scenario: Amounts that include tax calculations
        const taxInclusiveAmounts = [
          { total: 11800, tax: 1800, netAmount: 10000 }, // 18% VAT
          { total: 10750, tax: 750, netAmount: 10000 }, // 7.5% VAT
          { total: 10500, tax: 500, netAmount: 10000 }, // 5% VAT
        ];

        taxInclusiveAmounts.forEach((amount) => {
          // Test that calculations work with tax-inclusive amounts
          const result = SimpleTransactionCalculator.calculateStatus(
            "sale",
            amount.total,
            amount.netAmount,
            amount.tax
          );

          expect(result.status).toBe("partial");
          expect(result.percentagePaid).toBeCloseTo(
            (amount.netAmount / amount.total) * 100,
            2
          );
        });
      });

      it("should handle bulk discount scenarios", () => {
        // Scenario: Bulk discounts affecting final amounts
        const bulkScenarios = [
          { originalAmount: 100000, discount: 5000, finalAmount: 95000 }, // 5% discount
          { originalAmount: 50000, discount: 2500, finalAmount: 47500 }, // 5% discount
          { originalAmount: 200000, discount: 20000, finalAmount: 180000 }, // 10% discount
        ];

        bulkScenarios.forEach((scenario) => {
          // Test that discounted amounts work correctly
          const result =
            SimpleTransactionCalculator.calculateCustomerBalanceImpact(
              "sale",
              "credit",
              scenario.finalAmount,
              scenario.finalAmount
            );

          expect(result.debtChange).toBe(scenario.finalAmount);
          expect(result.creditChange).toBe(0);
        });
      });
    });
  });

  describe("Stress Testing Edge Cases", () => {
    it("should handle rapid sequential calculations", () => {
      const iterations = 10000;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const result = SimpleTransactionCalculator.calculateStatus(
          "sale",
          i + 1000,
          (i + 1000) / 2,
          (i + 1000) / 2
        );
        results.push(result);
      }

      // All results should be valid
      results.forEach((result, index) => {
        expect(result.status).toBe("partial");
        expect(result.percentagePaid).toBeCloseTo(50, 1);
        expect(result.paidAmount).toBe(Math.floor((index + 1000) / 2));
      });
    });

    it("should handle memory pressure scenarios", () => {
      const largeDataSets = Array.from({ length: 1000 }, (_, i) => ({
        transactions: Array.from({ length: 100 }, (_, j) => ({
          id: `tx-${i}-${j}`,
          amount: (i + 1) * (j + 1) * 100,
          type: j % 2 === 0 ? "sale" : "payment",
        })),
      }));

      largeDataSets.forEach((dataSet) => {
        const results = dataSet.transactions.map((tx) =>
          SimpleTransactionCalculator.calculateInitialAmounts(
            tx.type as any,
            "cash",
            tx.amount
          )
        );

        expect(results).toHaveLength(100);
        results.forEach((result) => {
          expect(result.paidAmount).toBeGreaterThanOrEqual(0);
          expect(result.remainingAmount).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});
