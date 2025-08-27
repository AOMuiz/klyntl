import {
  executeQueryForFirstResult,
  executeQueryForResults,
} from "../../services/database/helper";
import { DatabaseService } from "../database/oldIndex";

describe("Simple Debug Customer Filtering", () => {
  let testDatabaseService: DatabaseService;

  beforeAll(async () => {
    testDatabaseService = new DatabaseService(":memory:"); // Use in-memory database for test
    await testDatabaseService.initialize();
  });

  afterEach(async () => {
    await testDatabaseService.clearAllData();
  });

  afterAll(async () => {
    await testDatabaseService.closeDatabase();
  });

  it("should create and filter customers correctly", async () => {
    console.log("=== Checking database schema ===");

    // Check the customers table schema
    const db = await (testDatabaseService as any).getDatabase(); // Access database for debugging
    const schemaResult = await executeQueryForResults(
      db,
      "PRAGMA table_info(customers)"
    );
    console.log("Customers table schema:", schemaResult);

    console.log("=== Creating customers ===");

    // Create a business customer
    const businessCustomer = await testDatabaseService.createCustomer({
      name: "Acme Corp",
      phone: "+2348012345678",
      company: "Acme Corporation",
    });
    console.log("Business customer created");

    // Directly check if the record exists
    const directCheck = await executeQueryForFirstResult(
      db,
      "SELECT * FROM customers WHERE id = ?",
      [businessCustomer.id]
    );
    console.log("Direct check result:", directCheck);

    // Check all records in the table
    const allRecords = await executeQueryForResults(
      db,
      "SELECT * FROM customers"
    );
    console.log("All records in customers table:", allRecords);

    console.log("=== Testing service methods ===");

    // Get all customers
    const allCustomers = await testDatabaseService.getCustomersWithFilters();
    console.log(`All customers count: ${allCustomers.length}`);
    expect(allCustomers).toHaveLength(1);
  });
});
