import { openDatabaseSync } from "expo-sqlite";

/**
 * Quick fix for credit_balance column issue
 * This script checks if the column exists and adds it if missing
 */
export async function quickFixCreditBalanceColumn() {
  console.log("Running quick fix for credit_balance column...");

  try {
    const db = openDatabaseSync("klyntl.db");

    // Check if credit_balance column exists
    const tableInfo = await db.getAllAsync("PRAGMA table_info(customers)");
    const hasCreditBalance = tableInfo.some(
      (col: any) => col.name === "credit_balance"
    );

    if (!hasCreditBalance) {
      console.log("Adding credit_balance column...");
      await db.runAsync(
        "ALTER TABLE customers ADD COLUMN credit_balance INTEGER DEFAULT 0"
      );
      console.log("✅ credit_balance column added successfully");
    } else {
      console.log("✅ credit_balance column already exists");
    }

    // Also check if outstandingBalance exists
    const hasOutstandingBalance = tableInfo.some(
      (col: any) => col.name === "outstandingBalance"
    );

    if (!hasOutstandingBalance) {
      console.log("Adding outstandingBalance column...");
      await db.runAsync(
        "ALTER TABLE customers ADD COLUMN outstandingBalance INTEGER DEFAULT 0"
      );
      console.log("✅ outstandingBalance column added successfully");
    } else {
      console.log("✅ outstandingBalance column already exists");
    }
  } catch (error) {
    console.error("❌ Error fixing credit_balance column:", error);
    throw error;
  }
}

// Auto-run if this script is executed directly
if (typeof window === "undefined") {
  quickFixCreditBalanceColumn()
    .then(() => console.log("Quick fix completed"))
    .catch((error) => console.error("Quick fix failed:", error));
}
