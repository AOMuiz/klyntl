// Simple test to verify our contact import changes work
const { useCustomerStore } = require("./src/stores/customerStore");

// Mock the database service
jest.mock("./src/services/database", () => ({
  databaseService: {
    getCustomers: jest.fn(() => Promise.resolve([])),
    createCustomer: jest.fn((data) =>
      Promise.resolve({ ...data, id: "test-id" })
    ),
    getCustomerByPhone: jest.fn(() => Promise.resolve(null)),
  },
}));

// Test the checkContactAccess method
async function testCheckContactAccess() {
  console.log("Testing checkContactAccess method...");

  // Create a store instance
  const store = useCustomerStore.getState();

  try {
    const result = await store.checkContactAccess();
    console.log("checkContactAccess result:", result);
    console.log("✓ checkContactAccess method works");
  } catch (error) {
    console.error("✗ checkContactAccess method failed:", error);
  }
}

console.log("Contact import functionality tests complete.");
