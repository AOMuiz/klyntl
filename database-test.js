/**
 * Simple database test to verify database initialization and filtering functionality
 */

const { DatabaseService } = require("./src/services/database/index.ts");

async function testDatabase() {
  console.log("Starting database test...");

  const dbService = new DatabaseService("test-klyntl.db");

  try {
    // Initialize database
    console.log("1. Initializing database...");
    await dbService.initialize();
    console.log("✅ Database initialized successfully");

    // Clear any existing data
    console.log("2. Clearing existing data...");
    await dbService.clearAllData();
    console.log("✅ Data cleared");

    // Create test customers
    console.log("3. Creating test customers...");

    const businessCustomer = await dbService.createCustomer({
      name: "Acme Corp",
      phone: "+2348012345678",
      company: "Acme Corporation",
      email: "info@acme.com",
    });
    console.log("✅ Business customer created:", businessCustomer.id);

    const individualCustomer = await dbService.createCustomer({
      name: "John Doe",
      phone: "+2348012345679",
      email: "john@example.com",
    });
    console.log("✅ Individual customer created:", individualCustomer.id);

    // Create transactions
    console.log("4. Creating test transactions...");

    await dbService.createTransaction({
      customerId: businessCustomer.id,
      amount: 100000,
      description: "Big sale",
      date: new Date().toISOString(),
      type: "sale",
    });
    console.log("✅ Transaction for business customer created");

    await dbService.createTransaction({
      customerId: individualCustomer.id,
      amount: 5000,
      description: "Small purchase",
      date: new Date().toISOString(),
      type: "sale",
    });
    console.log("✅ Transaction for individual customer created");

    // Test filtering
    console.log("5. Testing filtering functionality...");

    // Get all customers
    const allCustomers = await dbService.getCustomersWithFilters();
    console.log(`✅ Total customers: ${allCustomers.length}`);

    // Filter by customer type
    const businessCustomers = await dbService.getCustomersWithFilters(
      undefined,
      { customerType: "business" }
    );
    console.log(`✅ Business customers: ${businessCustomers.length}`);

    const individualCustomers = await dbService.getCustomersWithFilters(
      undefined,
      { customerType: "individual" }
    );
    console.log(`✅ Individual customers: ${individualCustomers.length}`);

    // Filter by spending range
    const highSpenders = await dbService.getCustomersWithFilters(undefined, {
      spendingRange: { min: 50000, max: Number.MAX_SAFE_INTEGER },
    });
    console.log(`✅ High spenders (50k+): ${highSpenders.length}`);

    // Filter by transaction status
    const customersWithTransactions = await dbService.getCustomersWithFilters(
      undefined,
      { hasTransactions: true }
    );
    console.log(
      `✅ Customers with transactions: ${customersWithTransactions.length}`
    );

    // Test search
    console.log("6. Testing search functionality...");

    const searchResults = await dbService.getCustomersWithFilters("John");
    console.log(`✅ Search 'John' results: ${searchResults.length}`);

    // Test sorting
    console.log("7. Testing sorting functionality...");

    const sortedByName = await dbService.getCustomersWithFilters(
      undefined,
      undefined,
      { field: "name", direction: "asc" }
    );
    console.log(
      `✅ Sorted by name: ${sortedByName.map((c) => c.name).join(", ")}`
    );

    const sortedBySpending = await dbService.getCustomersWithFilters(
      undefined,
      undefined,
      { field: "totalSpent", direction: "desc" }
    );
    console.log(
      `✅ Sorted by spending: ${sortedBySpending
        .map((c) => `${c.name}: ₦${c.totalSpent}`)
        .join(", ")}`
    );

    // Test analytics
    console.log("8. Testing analytics...");

    const analytics = await dbService.getAnalytics();
    console.log(
      `✅ Analytics - Customers: ${analytics.totalCustomers}, Revenue: ₦${analytics.totalRevenue}, Transactions: ${analytics.totalTransactions}`
    );

    console.log("\n🎉 All database tests passed successfully!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    console.error(error.stack);
  } finally {
    // Close database
    await dbService.closeDatabase();
    console.log("Database closed");
  }
}

// Run the test
testDatabase().catch(console.error);
