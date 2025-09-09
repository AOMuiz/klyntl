import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";

/**
 * Test to reproduce the CHECK constraint issue with SimplePaymentService
 */
export async function testSimplePaymentAudit(db: SQLiteDatabase) {
  console.log("=== Testing SimplePaymentService Audit ===");

  try {
    // First check if simple_payment_audit table exists
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='simple_payment_audit'"
    );

    if (tables.length === 0) {
      console.log("❌ simple_payment_audit table does not exist");
      return;
    }

    console.log("✅ simple_payment_audit table exists");

    // Check the table schema
    const columns = await db.getAllAsync<{ name: string, type: string }>(
      "PRAGMA table_info(simple_payment_audit)"
    );
    console.log("Table schema:", columns);

    // Try to insert different types to see which ones work
    const testTypes = ['payment', 'overpayment', 'credit_used', 'over_payment', 'credit_note'];

    for (const type of testTypes) {
      try {
        const auditId = generateId("audit");
        const now = new Date().toISOString();

        await db.runAsync(
          `INSERT INTO simple_payment_audit (id, customer_id, type, amount, created_at, description)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [auditId, 'test-customer', type, 1000, now, `Test ${type}`]
        );

        console.log(`✅ Type '${type}' inserted successfully`);
      } catch (error) {
        console.log(`❌ Type '${type}' failed:`, error.message);
      }
    }

  } catch (error) {
    console.error("Test failed:", error);
  }
}