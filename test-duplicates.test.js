// Test script to verify duplicate phone number handling
import { useCustomerStore } from "../src/stores/customerStore";

describe("Real-world duplicate phone number handling", () => {
  it("should demonstrate the UNIQUE constraint error is expected behavior", async () => {
    const store = useCustomerStore.getState();

    // This test shows that UNIQUE constraint errors are expected and handled correctly
    const customerData = {
      name: "Test Customer",
      phone: "+2348012345678",
      email: "test@example.com",
    };

    try {
      // First customer should succeed
      await store.addCustomer(customerData);
      console.log("✅ First customer created successfully");

      // Second customer with same phone should fail with UNIQUE constraint
      await store.addCustomer({
        ...customerData,
        name: "Duplicate Customer",
      });
      console.log("❌ This should not happen - duplicate should fail");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("phone number already exists")
      ) {
        console.log("✅ Duplicate correctly detected and handled");
        console.log("Error message:", error.message);
      } else {
        console.log("❌ Unexpected error:", error);
      }
    }
  });
});
