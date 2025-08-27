/**
 * Integration test for customer creation, import, and filtering
 * This test verifies the complete flow of the customer system
 */

import { Customer } from "../../types/customer";
import { CustomerFilters } from "../../types/filters";
import { databaseService } from "../database/oldIndex";

describe("Customer System Integration", () => {
  beforeAll(async () => {
    await databaseService.initialize();
  });

  beforeEach(async () => {
    await databaseService.clearAllData();
  });

  afterAll(async () => {
    await databaseService.closeDatabase();
  });

  describe("Customer Creation and Filtering", () => {
    it("should create customers and filter them correctly", async () => {
      // Create test customers with different types
      const businessCustomer = await databaseService.createCustomer({
        name: "Tech Solutions Ltd",
        phone: "+2348012345678",
        company: "Tech Solutions",
        email: "contact@techsolutions.ng",
        contactSource: "manual",
      });

      const individualCustomer = await databaseService.createCustomer({
        name: "John Doe",
        phone: "+2348012345679",
        email: "john@example.com",
        contactSource: "manual",
      });

      const importedCustomer = await databaseService.createCustomer({
        name: "Alice Johnson",
        phone: "+2348012345680",
        contactSource: "imported",
      });

      // Verify all customers exist
      const allCustomers = await databaseService.getCustomersWithFilters();
      expect(allCustomers).toHaveLength(3);

      // Test business customer filter
      const businessFilters: CustomerFilters = {
        customerType: "business",
      };
      const businessResults = await databaseService.getCustomersWithFilters(
        undefined,
        businessFilters
      );
      expect(businessResults).toHaveLength(1);
      expect(businessResults[0].id).toBe(businessCustomer.id);
      expect(businessResults[0].customerType).toBe("business");

      // Test individual customer filter
      const individualFilters: CustomerFilters = {
        customerType: "individual",
      };
      const individualResults = await databaseService.getCustomersWithFilters(
        undefined,
        individualFilters
      );
      expect(individualResults).toHaveLength(2);
      expect(
        individualResults.every((c) => c.customerType === "individual")
      ).toBe(true);

      // Test contact source filter
      const importedFilters: CustomerFilters = {
        contactSource: "imported",
      };
      const importedResults = await databaseService.getCustomersWithFilters(
        undefined,
        importedFilters
      );
      expect(importedResults).toHaveLength(1);
      expect(importedResults[0].id).toBe(importedCustomer.id);
      expect(importedResults[0].contactSource).toBe("imported");

      // Test manual source filter
      const manualFilters: CustomerFilters = {
        contactSource: "manual",
      };
      const manualResults = await databaseService.getCustomersWithFilters(
        undefined,
        manualFilters
      );
      expect(manualResults).toHaveLength(2);
      expect(manualResults.every((c) => c.contactSource === "manual")).toBe(
        true
      );
    });

    it("should handle transactions and update spending filters correctly", async () => {
      // Create customers
      const highSpender = await databaseService.createCustomer({
        name: "High Spender Corp",
        phone: "+2348012345681",
        company: "High Spender Corp",
      });

      const lowSpender = await databaseService.createCustomer({
        name: "Budget Customer",
        phone: "+2348012345682",
      });

      const noSpender = await databaseService.createCustomer({
        name: "Browser Only",
        phone: "+2348012345683",
      });

      // Create transactions
      await databaseService.createTransaction({
        customerId: highSpender.id,
        amount: 150000,
        description: "Large order",
        date: new Date().toISOString(),
        type: "sale",
      });

      await databaseService.createTransaction({
        customerId: lowSpender.id,
        amount: 25000,
        description: "Small order",
        date: new Date().toISOString(),
        type: "sale",
      });

      // Test spending range filters
      const highSpendingFilters: CustomerFilters = {
        spendingRange: {
          min: 100000,
          max: Number.MAX_SAFE_INTEGER,
        },
      };
      const highSpendingResults = await databaseService.getCustomersWithFilters(
        undefined,
        highSpendingFilters
      );
      expect(highSpendingResults).toHaveLength(1);
      expect(highSpendingResults[0].id).toBe(highSpender.id);
      expect(highSpendingResults[0].totalSpent).toBeGreaterThanOrEqual(100000);

      // Test has transactions filter
      const hasTransactionsFilters: CustomerFilters = {
        hasTransactions: true,
      };
      const hasTransactionsResults =
        await databaseService.getCustomersWithFilters(
          undefined,
          hasTransactionsFilters
        );
      expect(hasTransactionsResults).toHaveLength(2);
      expect(hasTransactionsResults.every((c) => c.totalSpent > 0)).toBe(true);

      // Test no transactions filter
      const noTransactionsFilters: CustomerFilters = {
        hasTransactions: false,
      };
      const noTransactionsResults =
        await databaseService.getCustomersWithFilters(
          undefined,
          noTransactionsFilters
        );
      expect(noTransactionsResults).toHaveLength(1);
      expect(noTransactionsResults[0].id).toBe(noSpender.id);
      expect(noTransactionsResults[0].totalSpent).toBe(0);
    });

    it("should handle sorting correctly", async () => {
      // Create customers with different names and spending
      const alice = await databaseService.createCustomer({
        name: "Alice Business",
        phone: "+2348012345684",
        company: "Alice Corp",
      });

      const bob = await databaseService.createCustomer({
        name: "Bob Individual",
        phone: "+2348012345685",
      });

      const charlie = await databaseService.createCustomer({
        name: "Charlie Company",
        phone: "+2348012345686",
        company: "Charlie Inc",
      });

      // Add transactions with different amounts
      await databaseService.createTransaction({
        customerId: alice.id,
        amount: 50000,
        description: "Medium order",
        date: new Date().toISOString(),
        type: "sale",
      });

      await databaseService.createTransaction({
        customerId: charlie.id,
        amount: 200000,
        description: "Large order",
        date: new Date().toISOString(),
        type: "sale",
      });

      // Test name sorting (ascending)
      const nameSortedAsc = await databaseService.getCustomersWithFilters(
        undefined,
        undefined,
        { field: "name", direction: "asc" }
      );
      expect(nameSortedAsc[0].name).toBe("Alice Business");
      expect(nameSortedAsc[1].name).toBe("Bob Individual");
      expect(nameSortedAsc[2].name).toBe("Charlie Company");

      // Test spending sorting (descending)
      const spendingSortedDesc = await databaseService.getCustomersWithFilters(
        undefined,
        undefined,
        { field: "totalSpent", direction: "desc" }
      );
      expect(spendingSortedDesc[0].name).toBe("Charlie Company");
      expect(spendingSortedDesc[1].name).toBe("Alice Business");
      expect(spendingSortedDesc[2].name).toBe("Bob Individual");
    });

    it("should combine search with filters correctly", async () => {
      // Create test customers
      const techBusiness = await databaseService.createCustomer({
        name: "Tech Solutions Ltd",
        phone: "+2348012345687",
        company: "Tech Solutions",
        email: "contact@techsolutions.ng",
      });

      const techIndividual = await databaseService.createCustomer({
        name: "Tech Enthusiast John",
        phone: "+2348012345688",
        email: "john.tech@example.com",
      });

      const nonTechBusiness = await databaseService.createCustomer({
        name: "Fashion Store Ltd",
        phone: "+2348012345689",
        company: "Fashion Store",
      });

      // Test search + business filter
      const techBusinessResults = await databaseService.getCustomersWithFilters(
        "Tech",
        { customerType: "business" }
      );
      expect(techBusinessResults).toHaveLength(1);
      expect(techBusinessResults[0].id).toBe(techBusiness.id);

      // Test search only (should find both tech customers)
      const allTechResults = await databaseService.getCustomersWithFilters(
        "Tech"
      );
      expect(allTechResults).toHaveLength(2);
      expect(allTechResults.some((c) => c.id === techBusiness.id)).toBe(true);
      expect(allTechResults.some((c) => c.id === techIndividual.id)).toBe(true);

      // Test business filter only (should find both business customers)
      const allBusinessResults = await databaseService.getCustomersWithFilters(
        undefined,
        { customerType: "business" }
      );
      expect(allBusinessResults).toHaveLength(2);
      expect(allBusinessResults.some((c) => c.id === techBusiness.id)).toBe(
        true
      );
      expect(allBusinessResults.some((c) => c.id === nonTechBusiness.id)).toBe(
        true
      );
    });
  });

  describe("Customer Import Simulation", () => {
    it("should handle imported customers with proper contact source", async () => {
      // Simulate importing customers from contacts
      const importedCustomers = [
        {
          name: "Contact One",
          phone: "+2348011111111",
          contactSource: "imported" as const,
        },
        {
          name: "Contact Two",
          phone: "+2348022222222",
          contactSource: "imported" as const,
        },
        {
          name: "Business Contact",
          phone: "+2348033333333",
          company: "Imported Business",
          contactSource: "imported" as const,
        },
      ];

      // Create imported customers
      const createdCustomers: Customer[] = [];
      for (const customerData of importedCustomers) {
        const customer = await databaseService.createCustomer(customerData);
        createdCustomers.push(customer);
      }

      // Verify all customers were created
      expect(createdCustomers).toHaveLength(3);

      // Test filtering by contact source
      const importedResults = await databaseService.getCustomersWithFilters(
        undefined,
        { contactSource: "imported" }
      );
      expect(importedResults).toHaveLength(3);
      expect(importedResults.every((c) => c.contactSource === "imported")).toBe(
        true
      );

      // Test filtering imported business customers
      const importedBusinessResults =
        await databaseService.getCustomersWithFilters(undefined, {
          contactSource: "imported",
          customerType: "business",
        });
      expect(importedBusinessResults).toHaveLength(1);
      expect(importedBusinessResults[0].name).toBe("Business Contact");
      expect(importedBusinessResults[0].customerType).toBe("business");

      // Test filtering imported individual customers
      const importedIndividualResults =
        await databaseService.getCustomersWithFilters(undefined, {
          contactSource: "imported",
          customerType: "individual",
        });
      expect(importedIndividualResults).toHaveLength(2);
      expect(
        importedIndividualResults.every((c) => c.customerType === "individual")
      ).toBe(true);
    });

    it("should handle mixed manual and imported customers correctly", async () => {
      // Create manual customers
      const manualBusiness = await databaseService.createCustomer({
        name: "Manual Business",
        phone: "+2348044444444",
        company: "Manual Corp",
        contactSource: "manual",
      });

      const manualIndividual = await databaseService.createCustomer({
        name: "Manual Individual",
        phone: "+2348055555555",
        contactSource: "manual",
      });

      // Create imported customers
      const importedBusiness = await databaseService.createCustomer({
        name: "Imported Business",
        phone: "+2348066666666",
        company: "Imported Corp",
        contactSource: "imported",
      });

      const importedIndividual = await databaseService.createCustomer({
        name: "Imported Individual",
        phone: "+2348077777777",
        contactSource: "imported",
      });

      // Test filtering by source
      const manualResults = await databaseService.getCustomersWithFilters(
        undefined,
        { contactSource: "manual" }
      );
      expect(manualResults).toHaveLength(2);

      const importedResults = await databaseService.getCustomersWithFilters(
        undefined,
        { contactSource: "imported" }
      );
      expect(importedResults).toHaveLength(2);

      // Test filtering by type regardless of source
      const businessResults = await databaseService.getCustomersWithFilters(
        undefined,
        { customerType: "business" }
      );
      expect(businessResults).toHaveLength(2);

      const individualResults = await databaseService.getCustomersWithFilters(
        undefined,
        { customerType: "individual" }
      );
      expect(individualResults).toHaveLength(2);

      // Test combined filters
      const manualBusinessResults =
        await databaseService.getCustomersWithFilters(undefined, {
          contactSource: "manual",
          customerType: "business",
        });
      expect(manualBusinessResults).toHaveLength(1);
      expect(manualBusinessResults[0].id).toBe(manualBusiness.id);

      const importedIndividualResults =
        await databaseService.getCustomersWithFilters(undefined, {
          contactSource: "imported",
          customerType: "individual",
        });
      expect(importedIndividualResults).toHaveLength(1);
      expect(importedIndividualResults[0].id).toBe(importedIndividual.id);
    });
  });

  describe("Database Updates and Consistency", () => {
    it("should maintain data consistency when updating customers", async () => {
      // Create a customer
      const customer = await databaseService.createCustomer({
        name: "Test Customer",
        phone: "+2348088888888",
        contactSource: "manual",
      });

      // Update customer to add company (make it business)
      await databaseService.updateCustomer(customer.id, {
        company: "Updated Company",
        email: "updated@example.com",
      });

      // Verify update worked
      const updatedCustomer = await databaseService.getCustomerById(
        customer.id
      );
      expect(updatedCustomer).not.toBeNull();
      expect(updatedCustomer!.company).toBe("Updated Company");
      expect(updatedCustomer!.email).toBe("updated@example.com");

      // Verify filtering reflects the update
      const businessResults = await databaseService.getCustomersWithFilters(
        undefined,
        { customerType: "business" }
      );
      expect(businessResults).toHaveLength(1);
      expect(businessResults[0].id).toBe(customer.id);

      // Remove company (make it individual again)
      await databaseService.updateCustomer(customer.id, {
        company: undefined,
      });

      const revertedCustomer = await databaseService.getCustomerById(
        customer.id
      );
      expect(revertedCustomer!.company).toBeUndefined();

      // Verify filtering reflects the change
      const individualResults = await databaseService.getCustomersWithFilters(
        undefined,
        { customerType: "individual" }
      );
      expect(individualResults).toHaveLength(1);
      expect(individualResults[0].id).toBe(customer.id);

      const businessResultsAfter =
        await databaseService.getCustomersWithFilters(undefined, {
          customerType: "business",
        });
      expect(businessResultsAfter).toHaveLength(0);
    });

    it("should handle customer deletion and maintain filter consistency", async () => {
      // Create multiple customers
      const business1 = await databaseService.createCustomer({
        name: "Business One",
        phone: "+2348099999999",
        company: "Business Corp",
      });

      const business2 = await databaseService.createCustomer({
        name: "Business Two",
        phone: "+2348099999998",
        company: "Another Corp",
      });

      const individual = await databaseService.createCustomer({
        name: "Individual One",
        phone: "+2348099999997",
      });

      // Verify initial state
      const allCustomers = await databaseService.getCustomersWithFilters();
      expect(allCustomers).toHaveLength(3);

      const businessResults = await databaseService.getCustomersWithFilters(
        undefined,
        { customerType: "business" }
      );
      expect(businessResults).toHaveLength(2);

      // Delete one business customer
      await databaseService.deleteCustomer(business1.id);

      // Verify deletion
      const allCustomersAfter = await databaseService.getCustomersWithFilters();
      expect(allCustomersAfter).toHaveLength(2);

      const businessResultsAfter =
        await databaseService.getCustomersWithFilters(undefined, {
          customerType: "business",
        });
      expect(businessResultsAfter).toHaveLength(1);
      expect(businessResultsAfter[0].id).toBe(business2.id);

      const individualResults = await databaseService.getCustomersWithFilters(
        undefined,
        { customerType: "individual" }
      );
      expect(individualResults).toHaveLength(1);
      expect(individualResults[0].id).toBe(individual.id);
    });
  });
});
