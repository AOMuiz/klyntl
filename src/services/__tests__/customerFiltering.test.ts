import { databaseService } from "../../services/database";
import { CustomerFilters } from "../../types/filters";

describe("Customer Filtering", () => {
  beforeAll(async () => {
    await databaseService.initialize();
  });

  afterEach(async () => {
    await databaseService.clearAllData();
  });

  afterAll(async () => {
    await databaseService.closeDatabase();
  });

  it("should filter customers by customer type", async () => {
    // Create test customers
    const businessCustomer = await databaseService.createCustomer({
      name: "Acme Corp",
      phone: "+2348012345678",
      company: "Acme Corporation",
    });

    const individualCustomer = await databaseService.createCustomer({
      name: "John Doe",
      phone: "+2348012345679",
    });

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

    expect(individualResults).toHaveLength(1);
    expect(individualResults[0].id).toBe(individualCustomer.id);
    expect(individualResults[0].customerType).toBe("individual");
  });

  it("should filter customers by spending range", async () => {
    // Create customers with different spending levels
    const highSpender = await databaseService.createCustomer({
      name: "High Spender",
      phone: "+2348012345680",
    });

    const lowSpender = await databaseService.createCustomer({
      name: "Low Spender",
      phone: "+2348012345681",
    });

    // Create transactions to set spending levels
    await databaseService.createTransaction({
      customerId: highSpender.id,
      amount: 100000,
      description: "High value transaction",
      date: new Date().toISOString(),
      type: "sale",
    });

    await databaseService.createTransaction({
      customerId: lowSpender.id,
      amount: 5000,
      description: "Low value transaction",
      date: new Date().toISOString(),
      type: "sale",
    });

    // Test spending range filter
    const spendingFilters: CustomerFilters = {
      spendingRange: {
        min: 50000,
        max: Number.MAX_SAFE_INTEGER,
      },
    };

    const results = await databaseService.getCustomersWithFilters(
      undefined,
      spendingFilters
    );

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(highSpender.id);
    expect(results[0].totalSpent).toBeGreaterThanOrEqual(50000);
  });

  it("should filter customers by transaction status", async () => {
    // Create customers with and without transactions
    const customerWithTransaction = await databaseService.createCustomer({
      name: "Has Transactions",
      phone: "+2348012345682",
    });

    const customerWithoutTransaction = await databaseService.createCustomer({
      name: "No Transactions",
      phone: "+2348012345683",
    });

    // Add transaction for first customer
    await databaseService.createTransaction({
      customerId: customerWithTransaction.id,
      amount: 25000,
      description: "Test transaction",
      date: new Date().toISOString(),
      type: "sale",
    });

    // Test has transactions filter
    const hasTransactionsFilter: CustomerFilters = {
      hasTransactions: true,
    };

    const withTransactionsResults =
      await databaseService.getCustomersWithFilters(
        undefined,
        hasTransactionsFilter
      );

    expect(withTransactionsResults).toHaveLength(1);
    expect(withTransactionsResults[0].id).toBe(customerWithTransaction.id);

    // Test no transactions filter
    const noTransactionsFilter: CustomerFilters = {
      hasTransactions: false,
    };

    const withoutTransactionsResults =
      await databaseService.getCustomersWithFilters(
        undefined,
        noTransactionsFilter
      );

    expect(withoutTransactionsResults).toHaveLength(1);
    expect(withoutTransactionsResults[0].id).toBe(
      customerWithoutTransaction.id
    );
  });

  it("should sort customers correctly", async () => {
    // Create customers with different data
    const customerA = await databaseService.createCustomer({
      name: "Alice Johnson",
      phone: "+2348012345684",
    });

    const customerB = await databaseService.createCustomer({
      name: "Bob Wilson",
      phone: "+2348012345685",
    });

    // Add different spending amounts
    await databaseService.createTransaction({
      customerId: customerA.id,
      amount: 10000,
      description: "Test",
      date: new Date().toISOString(),
      type: "sale",
    });

    await databaseService.createTransaction({
      customerId: customerB.id,
      amount: 50000,
      description: "Test",
      date: new Date().toISOString(),
      type: "sale",
    });

    // Test sort by name ascending
    const nameAscResults = await databaseService.getCustomersWithFilters(
      undefined,
      undefined,
      { field: "name", direction: "asc" }
    );

    expect(nameAscResults[0].name).toBe("Alice Johnson");
    expect(nameAscResults[1].name).toBe("Bob Wilson");

    // Test sort by total spent descending
    const spentDescResults = await databaseService.getCustomersWithFilters(
      undefined,
      undefined,
      { field: "totalSpent", direction: "desc" }
    );

    expect(spentDescResults[0].name).toBe("Bob Wilson");
    expect(spentDescResults[1].name).toBe("Alice Johnson");
  });

  it("should combine search with filters", async () => {
    // Create test customers
    const businessCustomer = await databaseService.createCustomer({
      name: "Tech Solutions Ltd",
      phone: "+2348012345686",
      company: "Tech Solutions",
    });

    const individualCustomer = await databaseService.createCustomer({
      name: "Tech Enthusiast",
      phone: "+2348012345687",
    });

    // Test search + filter combination
    const searchResults = await databaseService.getCustomersWithFilters(
      "Tech",
      { customerType: "business" }
    );

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].id).toBe(businessCustomer.id);

    // Verify individual customer exists but is filtered out
    const allTechResults = await databaseService.getCustomersWithFilters(
      "Tech"
    );
    expect(allTechResults).toHaveLength(2);
    expect(allTechResults.some((c) => c.id === individualCustomer.id)).toBe(
      true
    );
  });
});
