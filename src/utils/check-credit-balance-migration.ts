import { openDatabaseSync } from "expo-sqlite";
import { runMigrations } from "../services/database/migrations";

export async function checkAndFixCreditBalanceColumn() {
  console.log("Checking credit_balance column...");

  try {
    const db = openDatabaseSync("klyntl.db");

    // Check if credit_balance column exists
    const tableInfo = await db.getAllAsync("PRAGMA table_info(customers)");
    const hasCreditBalance = tableInfo.some(
      (col: any) => col.name === "credit_balance"
    );

    console.log(`credit_balance column exists: ${hasCreditBalance}`);

    if (!hasCreditBalance) {
      console.log("Column missing, running migrations...");
      await runMigrations(db);
      console.log("Migrations completed");
    } else {
      console.log("Column exists, no action needed");
    }

    // Note: expo-sqlite doesn't have a close method, database is automatically managed
  } catch (error) {
    console.error("Error checking credit_balance column:", error);
  }
}
