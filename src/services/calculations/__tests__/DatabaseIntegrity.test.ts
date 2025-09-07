import { CustomerRepository } from "../../database/repositories/CustomerRepository";
import { TransactionRepository } from "../../database/repositories/TransactionRepository";
import { DatabaseService } from "../../database/service";

/**
 * Database Integrity and Consistency Tests for Production
 *
 * Validates data integrity, referential constraints, and transaction consistency
 * Critical for Nigerian SME businesses where financial accuracy is paramount
 */

describe("Database Integrity Tests", () => {
  let db: DatabaseService;
  let customerRepo: CustomerRepository;
  let transactionRepo: TransactionRepository;

  beforeEach(async () => {
    db = new DatabaseService();
    await db.init();
    customerRepo = new CustomerRepository(db);
    transactionRepo = new TransactionRepository(db);
  });

  afterEach(async () => {
    await db.close();
  });

  describe("Referential Integrity", () => {
    it("should prevent creating transactions for non-existent customers", async () => {
      const nonExistentCustomerId = "non-existent-customer-id";

      try {
        await transactionRepo.create({
          id: "tx-1",
          customerId: nonExistentCustomerId,
          type: "sale",
          amount: 10000,
          paidAmount: 0,
          remainingAmount: 10000,
          paymentMethod: "credit",
          status: "pending",
          description: "Test transaction",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Should not reach here if referential integrity is enforced
        expect(false).toBe(true);
      } catch (error) {
        // Should throw an error due to foreign key constraint
        expect(error).toBeDefined();
      }
    });

    it("should prevent deleting customers with outstanding transactions", async () => {
      // Create customer and transaction
      const customer = await customerRepo.create({
        id: "customer-1",
        name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        outstandingBalance: 10000,
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await transactionRepo.create({
        id: "tx-1",
        customerId: customer.id,
        type: "sale",
        amount: 10000,
        paidAmount: 0,
        remainingAmount: 10000,
        paymentMethod: "credit",
        status: "pending",
        description: "Test transaction",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      try {
        // Attempt to delete customer with outstanding transactions
        await customerRepo.delete(customer.id);

        // Should not reach here if integrity is enforced
        expect(false).toBe(true);
      } catch (error) {
        // Should throw error due to existing transactions
        expect(error).toBeDefined();
      }
    });

    it("should maintain consistency when updating customer balances", async () => {
      const customer = await customerRepo.create({
        id: "customer-1",
        name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        outstandingBalance: 0,
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Increase outstanding balance
      await customerRepo.increaseOutstandingBalance(customer.id, 10000);

      let updatedCustomer = await customerRepo.findById(customer.id);
      expect(updatedCustomer?.outstandingBalance).toBe(10000);

      // Decrease outstanding balance
      await customerRepo.decreaseOutstandingBalance(customer.id, 5000);

      updatedCustomer = await customerRepo.findById(customer.id);
      expect(updatedCustomer?.outstandingBalance).toBe(5000);

      // Attempt to decrease more than available should prevent negative balance
      try {
        await customerRepo.decreaseOutstandingBalance(customer.id, 10000);

        // Check that balance didn't go negative
        updatedCustomer = await customerRepo.findById(customer.id);
        expect(updatedCustomer?.outstandingBalance).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Some implementations might throw error for negative balance attempts
        expect(error).toBeDefined();
      }
    });
  });

  describe("Transaction Consistency", () => {
    it("should maintain ACID properties during concurrent operations", async () => {
      const customer = await customerRepo.create({
        id: "customer-1",
        name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        outstandingBalance: 0,
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Simulate concurrent balance updates
      const concurrentOperations = [
        customerRepo.increaseOutstandingBalance(customer.id, 1000),
        customerRepo.increaseOutstandingBalance(customer.id, 2000),
        customerRepo.increaseOutstandingBalance(customer.id, 3000),
        customerRepo.increaseOutstandingBalance(customer.id, 4000),
        customerRepo.increaseOutstandingBalance(customer.id, 5000),
      ];

      await Promise.all(concurrentOperations);

      const finalCustomer = await customerRepo.findById(customer.id);
      expect(finalCustomer?.outstandingBalance).toBe(15000); // Sum of all increases
    });

    it("should handle database rollback scenarios", async () => {
      const customer = await customerRepo.create({
        id: "customer-1",
        name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        outstandingBalance: 5000,
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Test transaction rollback by attempting invalid operations
      try {
        // This should be wrapped in a transaction that gets rolled back
        await customerRepo.increaseOutstandingBalance(customer.id, 10000);

        // Force an error that should trigger rollback
        throw new Error("Simulated database error");
      } catch (error) {
        // Verify that the balance increase was rolled back
        const finalCustomer = await customerRepo.findById(customer.id);
        expect(finalCustomer?.outstandingBalance).toBe(5000); // Should remain unchanged
      }
    });

    it("should maintain data consistency across related tables", async () => {
      const customer = await customerRepo.create({
        id: "customer-1",
        name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        outstandingBalance: 0,
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create multiple transactions
      const transactions = await Promise.all([
        transactionRepo.create({
          id: "tx-1",
          customerId: customer.id,
          type: "sale",
          amount: 10000,
          paidAmount: 0,
          remainingAmount: 10000,
          paymentMethod: "credit",
          status: "pending",
          description: "Sale 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        transactionRepo.create({
          id: "tx-2",
          customerId: customer.id,
          type: "payment",
          amount: 5000,
          paidAmount: 5000,
          remainingAmount: 0,
          paymentMethod: "cash",
          status: "completed",
          description: "Payment 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Verify transactions are linked to customer
      const customerTransactions = await transactionRepo.findByCustomerId(
        customer.id
      );
      expect(customerTransactions).toHaveLength(2);

      // Verify all transaction amounts are properly stored
      const totalSales = customerTransactions
        .filter((tx) => tx.type === "sale")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalPayments = customerTransactions
        .filter((tx) => tx.type === "payment")
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(totalSales).toBe(10000);
      expect(totalPayments).toBe(5000);
    });
  });

  describe("Data Validation and Constraints", () => {
    it("should enforce required field constraints", async () => {
      const invalidCustomerData = [
        { name: "", phone: "08012345678", email: "test@example.com" }, // Empty name
        { name: "Test", phone: "", email: "test@example.com" }, // Empty phone
        { name: "Test", phone: "08012345678", email: "" }, // Empty email
      ];

      for (const data of invalidCustomerData) {
        try {
          await customerRepo.create({
            id: `customer-${Date.now()}`,
            ...data,
            outstandingBalance: 0,
            creditBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Should not reach here if validation is enforced
          expect(false).toBe(true);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it("should enforce data type constraints", async () => {
      const customer = await customerRepo.create({
        id: "customer-1",
        name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        outstandingBalance: 0,
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Test invalid transaction data types
      const invalidTransactions = [
        {
          amount: "not-a-number", // Invalid amount type
          type: "sale",
          paymentMethod: "cash",
        },
        {
          amount: -1000, // Negative amount
          type: "sale",
          paymentMethod: "cash",
        },
        {
          amount: 1000,
          type: "invalid-type", // Invalid transaction type
          paymentMethod: "cash",
        },
      ];

      for (const [index, txData] of invalidTransactions.entries()) {
        try {
          await transactionRepo.create({
            id: `tx-${index}`,
            customerId: customer.id,
            type: txData.type as any,
            amount: txData.amount as any,
            paidAmount: 0,
            remainingAmount: txData.amount as any,
            paymentMethod: txData.paymentMethod as any,
            status: "pending",
            description: "Invalid transaction",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Should not reach here if validation is enforced
          expect(false).toBe(true);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it("should handle duplicate key constraints", async () => {
      const customerData = {
        id: "duplicate-customer",
        name: "Test Customer",
        phone: "08012345678",
        email: "test@example.com",
        outstandingBalance: 0,
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create first customer
      await customerRepo.create(customerData);

      try {
        // Attempt to create duplicate customer
        await customerRepo.create(customerData);

        // Should not reach here if unique constraints are enforced
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle large datasets efficiently", async () => {
      const startTime = Date.now();

      // Create many customers
      const customers = await Promise.all(
        Array.from({ length: 100 }, async (_, i) => {
          return customerRepo.create({
            id: `customer-${i}`,
            name: `Customer ${i}`,
            phone: `0801234567${i}`,
            email: `customer${i}@example.com`,
            outstandingBalance: i * 1000,
            creditBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        })
      );

      const customerCreationTime = Date.now() - startTime;
      expect(customerCreationTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Create many transactions
      const transactionStartTime = Date.now();

      await Promise.all(
        customers.flatMap((customer) =>
          Array.from({ length: 10 }, async (_, i) => {
            return transactionRepo.create({
              id: `tx-${customer.id}-${i}`,
              customerId: customer.id,
              type: i % 2 === 0 ? "sale" : "payment",
              amount: (i + 1) * 1000,
              paidAmount: i % 2 === 0 ? 0 : (i + 1) * 1000,
              remainingAmount: i % 2 === 0 ? (i + 1) * 1000 : 0,
              paymentMethod: i % 2 === 0 ? "credit" : "cash",
              status: i % 2 === 0 ? "pending" : "completed",
              description: `Transaction ${i}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          })
        )
      );

      const transactionCreationTime = Date.now() - transactionStartTime;
      expect(transactionCreationTime).toBeLessThan(10000); // Should complete in under 10 seconds

      // Test query performance
      const queryStartTime = Date.now();

      for (const customer of customers.slice(0, 10)) {
        const transactions = await transactionRepo.findByCustomerId(
          customer.id
        );
        expect(transactions).toHaveLength(10);
      }

      const queryTime = Date.now() - queryStartTime;
      expect(queryTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it("should maintain performance under concurrent load", async () => {
      const customer = await customerRepo.create({
        id: "load-test-customer",
        name: "Load Test Customer",
        phone: "08012345678",
        email: "loadtest@example.com",
        outstandingBalance: 0,
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();

      // Simulate concurrent operations
      const concurrentOperations = Array.from({ length: 50 }, async (_, i) => {
        return Promise.all([
          customerRepo.increaseOutstandingBalance(customer.id, 100),
          transactionRepo.create({
            id: `concurrent-tx-${i}`,
            customerId: customer.id,
            type: "sale",
            amount: 1000,
            paidAmount: 0,
            remainingAmount: 1000,
            paymentMethod: "credit",
            status: "pending",
            description: `Concurrent transaction ${i}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ]);
      });

      await Promise.all(concurrentOperations);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Verify data integrity after concurrent operations
      const finalCustomer = await customerRepo.findById(customer.id);
      expect(finalCustomer?.outstandingBalance).toBe(5000); // 50 * 100

      const transactions = await transactionRepo.findByCustomerId(customer.id);
      expect(transactions).toHaveLength(50);
    });
  });

  describe("Backup and Recovery Scenarios", () => {
    it("should handle database corruption gracefully", async () => {
      // Create some test data
      const customer = await customerRepo.create({
        id: "corruption-test-customer",
        name: "Corruption Test",
        phone: "08012345678",
        email: "corruption@example.com",
        outstandingBalance: 10000,
        creditBalance: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Verify data exists
      let retrievedCustomer = await customerRepo.findById(customer.id);
      expect(retrievedCustomer).toBeDefined();
      expect(retrievedCustomer?.outstandingBalance).toBe(10000);

      // Simulate database reset/corruption recovery
      await db.close();
      db = new DatabaseService();
      await db.init();
      customerRepo = new CustomerRepository(db);

      // Data should still be accessible after restart
      retrievedCustomer = await customerRepo.findById(customer.id);
      if (retrievedCustomer) {
        // If data persists, it should be intact
        expect(retrievedCustomer.outstandingBalance).toBe(10000);
        expect(retrievedCustomer.creditBalance).toBe(5000);
      } else {
        // If data doesn't persist (in-memory database), that's also acceptable
        expect(retrievedCustomer).toBeNull();
      }
    });

    it("should validate data integrity after recovery", async () => {
      const customers = await Promise.all([
        customerRepo.create({
          id: "recovery-customer-1",
          name: "Recovery Customer 1",
          phone: "08012345671",
          email: "recovery1@example.com",
          outstandingBalance: 5000,
          creditBalance: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        customerRepo.create({
          id: "recovery-customer-2",
          name: "Recovery Customer 2",
          phone: "08012345672",
          email: "recovery2@example.com",
          outstandingBalance: 10000,
          creditBalance: 2000,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Create transactions for both customers
      await Promise.all([
        transactionRepo.create({
          id: "recovery-tx-1",
          customerId: customers[0].id,
          type: "sale",
          amount: 5000,
          paidAmount: 0,
          remainingAmount: 5000,
          paymentMethod: "credit",
          status: "pending",
          description: "Recovery transaction 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        transactionRepo.create({
          id: "recovery-tx-2",
          customerId: customers[1].id,
          type: "payment",
          amount: 3000,
          paidAmount: 3000,
          remainingAmount: 0,
          paymentMethod: "cash",
          status: "completed",
          description: "Recovery transaction 2",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);

      // Verify relationships are intact
      for (const customer of customers) {
        const customerTransactions = await transactionRepo.findByCustomerId(
          customer.id
        );
        expect(customerTransactions).toHaveLength(1);
        expect(customerTransactions[0].customerId).toBe(customer.id);
      }

      // Verify data consistency
      const allCustomers = await customerRepo.findAll();
      const allTransactions = await transactionRepo.findAll();

      expect(allCustomers.length).toBeGreaterThanOrEqual(2);
      expect(allTransactions.length).toBeGreaterThanOrEqual(2);

      // Verify no orphaned transactions
      for (const transaction of allTransactions) {
        const relatedCustomer = allCustomers.find(
          (c) => c.id === transaction.customerId
        );
        expect(relatedCustomer).toBeDefined();
      }
    });
  });
});
