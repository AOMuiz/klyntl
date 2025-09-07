import { SimpleTransactionCalculator } from "../SimpleTransactionCalculator";

/**
 * Performance Tests for SimpleTransactionCalculator
 *
 * Tests performance under high-volume Nigerian SME scenarios
 */

describe("SimpleTransactionCalculator Performance Tests", () => {
  // Performance thresholds for Nigerian SME operations (adjusted for test environment)
  const PERFORMANCE_THRESHOLDS = {
    singleCalculation: 5, // Max 5ms for single calculation
    batchOperations: 200, // Max 200ms for 1000 operations
    largeVolumeOperations: 1000, // Max 1 second for 10,000 operations
    memoryLimit: 100, // Max 100MB memory usage
  };
  describe("Single Operation Performance", () => {
    it("should calculate transaction status within performance threshold", () => {
      const start = performance.now();

      SimpleTransactionCalculator.calculateStatus("sale", 50000, 25000, 25000);

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.singleCalculation);
    });

    it("should calculate initial amounts within performance threshold", () => {
      const start = performance.now();

      SimpleTransactionCalculator.calculateInitialAmounts(
        "sale",
        "mixed",
        100000,
        60000
      );

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.singleCalculation);
    });

    it("should validate mixed payment within performance threshold", () => {
      const start = performance.now();

      SimpleTransactionCalculator.validateMixedPayment(75000, 45000, 30000);

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.singleCalculation);
    });
  });

  describe("Batch Operation Performance", () => {
    it("should handle 1000 transaction status calculations efficiently", () => {
      const transactions = Array.from({ length: 1000 }, (_, i) => ({
        type: i % 2 === 0 ? "sale" : "payment",
        total: (i + 1) * 1000,
        paid: (i + 1) * 500,
        remaining: (i + 1) * 500,
      }));

      const start = performance.now();

      transactions.forEach((tx) => {
        SimpleTransactionCalculator.calculateStatus(
          tx.type as any,
          tx.total,
          tx.paid,
          tx.remaining
        );
      });

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.batchOperations);
    });

    it("should handle 1000 mixed payment validations efficiently", () => {
      const payments = Array.from({ length: 1000 }, (_, i) => ({
        total: (i + 1) * 2000,
        cash: (i + 1) * 1200,
        credit: (i + 1) * 800,
      }));

      const start = performance.now();

      payments.forEach((payment) => {
        SimpleTransactionCalculator.validateMixedPayment(
          payment.total,
          payment.cash,
          payment.credit
        );
      });

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.batchOperations);
    });
  });

  describe("High Volume Performance", () => {
    it("should handle 10,000 calculations within threshold", () => {
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        SimpleTransactionCalculator.calculateStatus(
          "sale",
          i * 100 + 1000,
          i * 50 + 500,
          i * 50 + 500
        );
      }

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(
        PERFORMANCE_THRESHOLDS.largeVolumeOperations
      );
    });

    it("should maintain consistent performance under load", () => {
      const iterations = 5000;
      const measurements: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        SimpleTransactionCalculator.calculateDebtImpact(
          "sale",
          "mixed",
          i * 200 + 1000,
          i % 2 === 0
        );

        const end = performance.now();
        measurements.push(end - start);
      }

      // Calculate performance statistics
      const avgTime =
        measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxTime = Math.max(...measurements);

      // Performance should be consistent (max shouldn't be more than 50x average in test environment)
      expect(maxTime).toBeLessThan(avgTime * 50);
      expect(avgTime).toBeLessThan(1); // Average under 1ms
    });
  });

  describe("Memory Efficiency Tests", () => {
    it("should not leak memory during repeated calculations", () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many calculations
      for (let i = 0; i < 50000; i++) {
        SimpleTransactionCalculator.calculateStatus("sale", 1000, 500, 500);
        SimpleTransactionCalculator.calculateInitialAmounts(
          "payment",
          "cash",
          1000
        );
        SimpleTransactionCalculator.validateMixedPayment(1000, 600, 400);
        SimpleTransactionCalculator.handleOverpayment(1200, 1000);

        // Force garbage collection every 10000 iterations
        if (i % 10000 === 0 && global.gc) {
          global.gc();
        }
      }

      // Force final garbage collection
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (under 50MB)
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryLimit);
    });

    it("should efficiently handle currency conversions", () => {
      const start = performance.now();

      // Test large number of currency conversions
      for (let i = 0; i < 10000; i++) {
        const naira = i * 0.01 + 100.99;
        const kobo = SimpleTransactionCalculator.toKobo(naira);
        const backToNaira = SimpleTransactionCalculator.toNaira(kobo);

        // Verify precision maintained
        expect(Math.abs(backToNaira - naira)).toBeLessThan(0.01);
      }

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe("Edge Case Performance", () => {
    it("should handle extreme values efficiently", () => {
      const extremeValues = [
        0,
        1,
        999999999, // Near max safe integer for kobo
        0.01, // Minimum currency unit
        999999.99, // Large naira amount
      ];

      const start = performance.now();

      extremeValues.forEach((value) => {
        SimpleTransactionCalculator.calculateStatus(
          "sale",
          value,
          value * 0.5,
          value * 0.5
        );
        SimpleTransactionCalculator.toKobo(value);
        SimpleTransactionCalculator.toNaira(value * 100);
      });

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(10); // Should handle extreme values quickly
    });

    it("should handle complex Nigerian SME scenarios efficiently", () => {
      const scenarios = [
        // Large wholesale transaction
        { type: "sale", method: "mixed", amount: 5000000, cash: 3000000 }, // ₦50,000
        // Small retail transaction
        { type: "sale", method: "cash", amount: 50, cash: 50 }, // ₦0.50
        // Credit transaction
        { type: "credit", method: "credit", amount: 750000, cash: 0 }, // ₦7,500
        // Payment with overpayment
        {
          type: "payment",
          method: "bank_transfer",
          amount: 1250000,
          cash: 1250000,
        }, // ₦12,500
      ];

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        scenarios.forEach((scenario) => {
          SimpleTransactionCalculator.calculateInitialAmounts(
            scenario.type as any,
            scenario.method,
            scenario.amount,
            scenario.cash
          );

          if (scenario.method === "mixed") {
            SimpleTransactionCalculator.validateMixedPayment(
              scenario.amount,
              scenario.cash,
              scenario.amount - scenario.cash
            );
          }

          SimpleTransactionCalculator.calculateCustomerBalanceImpact(
            scenario.type as any,
            scenario.method,
            scenario.amount,
            scenario.amount - scenario.cash
          );
        });
      }

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500); // Complex scenarios should complete efficiently
    });
  });

  describe("Concurrent Operation Simulation", () => {
    it("should handle concurrent-like calculations efficiently", async () => {
      const calculations = Array.from({ length: 1000 }, (_, i) => ({
        customerId: `customer-${i}`,
        amount: (i + 1) * 1000,
        type: i % 3 === 0 ? "sale" : i % 3 === 1 ? "payment" : "credit",
        method:
          i % 4 === 0
            ? "cash"
            : i % 4 === 1
            ? "credit"
            : i % 4 === 2
            ? "mixed"
            : "bank_transfer",
      }));

      const start = performance.now();

      // Simulate concurrent processing by batching
      const batchSize = 100;
      const batches = [];

      for (let i = 0; i < calculations.length; i += batchSize) {
        const batch = calculations.slice(i, i + batchSize);
        batches.push(
          Promise.resolve().then(() => {
            return batch.map((calc) => {
              const paidAmount = calc.method === "credit" ? 0 : calc.amount;
              const remainingAmount = calc.amount - paidAmount;

              return {
                status: SimpleTransactionCalculator.calculateStatus(
                  calc.type as any,
                  calc.amount,
                  paidAmount,
                  remainingAmount
                ),
                initialAmounts:
                  SimpleTransactionCalculator.calculateInitialAmounts(
                    calc.type as any,
                    calc.method,
                    calc.amount,
                    calc.method === "mixed"
                      ? Math.floor(calc.amount * 0.6)
                      : undefined
                  ),
                debtImpact: SimpleTransactionCalculator.calculateDebtImpact(
                  calc.type as any,
                  calc.method,
                  calc.amount
                ),
              };
            });
          })
        );
      }

      const results = await Promise.all(batches);

      const end = performance.now();
      const duration = end - start;

      expect(results).toHaveLength(10); // 10 batches of 100
      expect(results.flat()).toHaveLength(1000); // 1000 total calculations
      expect(duration).toBeLessThan(300); // Should complete efficiently
    });
  });
});
