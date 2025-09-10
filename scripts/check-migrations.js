const { openDatabaseSync } = require("expo-sqlite");
const { runMigrations } = require("../src/services/database/migrations");

async function checkAndRunMigrations() {
  console.log("Checking database version and running migrations...");

  try {
    const db = openDatabaseSync("klyntl.db");

    // Check current version
    const versionResult = await db.getFirstAsync("PRAGMA user_version");
    const currentVersion = versionResult?.user_version || 0;
    console.log(`Current database version: ${currentVersion}`);

    // Run migrations
    await runMigrations(db);

    // Check version after migration
    const newVersionResult = await db.getFirstAsync("PRAGMA user_version");
    const newVersion = newVersionResult?.user_version || 0;
    console.log(`Database version after migration: ${newVersion}`);

    // Check if credit_balance column exists
    const tableInfo = await db.getAllAsync("PRAGMA table_info(customers)");
    const hasCreditBalance = tableInfo.some(
      (col) => col.name === "credit_balance"
    );
    console.log(`credit_balance column exists: ${hasCreditBalance}`);

    db.close();
    console.log("Migration check completed successfully");
  } catch (error) {
    console.error("Migration check failed:", error);
  }
}

checkAndRunMigrations();
