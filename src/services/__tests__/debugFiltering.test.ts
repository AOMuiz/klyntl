import {
  executeQueryForResults,
  getDatabaseInstance,
} from "../../services/database/helper";
import { DatabaseService } from "../database/oldIndex";

describe("Debug Customer Filtering", () => {
  let testDatabaseService: DatabaseService;

  beforeAll(async () => {
    // Create a new database instance for testing
    testDatabaseService = new DatabaseService("test-klyntl.db");
    await testDatabaseService.initialize();
  });

  afterEach(async () => {
    await testDatabaseService.clearAllData();
  });

  afterAll(async () => {
    await testDatabaseService.closeDatabase();
  });

  it("should debug customer creation and filtering", async () => {
    console.log("=== Starting debug test ===");

    // Create a business customer
    console.log("Creating business customer...");
    const businessCustomer = await testDatabaseService.createCustomer({
      name: "Acme Corp",
      phone: "+2348012345678",
      company: "Acme Corporation",
    });
    console.log("Business customer created:", businessCustomer);

    // Check directly from database using raw SQL
    console.log("Checking database directly...");
    const db = await getDatabaseInstance("test-klyntl.db");
    const rawCustomers = await executeQueryForResults(
      db,
      "SELECT * FROM customers"
    );
    console.log("Raw SQL query results:", rawCustomers);

    // Get all customers to verify creation
    console.log("Getting all customers...");
    const allCustomers = await testDatabaseService.getCustomersWithFilters();
    console.log("All customers via service:", allCustomers);

    // Test business customer filter
    console.log("Testing business filter...");
    const businessResults = await testDatabaseService.getCustomersWithFilters(
      undefined,
      { customerType: "business" }
    );
    console.log("Business filter results:", businessResults);

    console.log("=== Debug test complete ===");
  });
});
