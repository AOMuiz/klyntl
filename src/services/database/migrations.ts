import type { SQLiteDatabase } from "expo-sqlite";

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
  down?: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * Get the current database version
 */
export async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version"
    );
    return result?.user_version || 0;
  } catch (error) {
    console.warn("Could not get database version:", error);
    return 0;
  }
}

/**
 * Set the database version
 */
export async function setVersion(
  db: SQLiteDatabase,
  version: number
): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

/**
 * Migration 0: Handle transition from legacy system
 * This migration detects existing tables and sets the appropriate version
 */
const migration000: Migration = {
  version: 0,
  name: "legacy_detection",
  up: async (db: SQLiteDatabase) => {
    // Check if tables already exist (from legacy system)
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('customers', 'transactions')"
    );

    const hasCustomers = tables.some((t) => t.name === "customers");
    const hasTransactions = tables.some((t) => t.name === "transactions");

    if (hasCustomers && hasTransactions) {
      console.log("Detected existing database from legacy system");

      // Check if extended fields exist to determine which version we're at
      const customerInfo = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(customers)"
      );

      const hasExtendedFields = customerInfo.some(
        (col) => col.name === "company"
      );

      if (hasExtendedFields) {
        console.log("Extended fields detected, setting version to 2");
        await setVersion(db, 2);
      } else {
        console.log("Basic schema detected, setting version to 1");
        await setVersion(db, 1);
      }
    } else {
      console.log("No existing tables found, will create fresh schema");
    }
  },
  down: async (db: SQLiteDatabase) => {
    // Reset to fresh state
    await setVersion(db, 0);
  },
};

/**
 * Migration 1: Initial database schema
 */
const migration001: Migration = {
  version: 1,
  name: "initial_schema",
  up: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      -- Enable WAL mode for better performance
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      
      -- Create customers table
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        address TEXT,
        totalSpent REAL DEFAULT 0,
        lastPurchase TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- Create transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        customerId TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        FOREIGN KEY (customerId) REFERENCES customers (id) ON DELETE CASCADE
      );

      -- Basic indexes for performance
      CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customer_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_transaction_customer ON transactions(customerId);
      CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_transaction_date;
      DROP INDEX IF EXISTS idx_transaction_customer;
      DROP INDEX IF EXISTS idx_customer_name;
      DROP INDEX IF EXISTS idx_customer_phone;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS customers;
    `);
  },
};

/**
 * Helper function to safely add columns that may already exist
 */
async function addColumnIfNotExists(
  db: SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnType: string
): Promise<void> {
  try {
    // Check if column exists by getting table info
    const tableInfo = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(${tableName})`
    );

    const columnExists = tableInfo.some((col) => col.name === columnName);

    if (!columnExists) {
      await db.runAsync(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`
      );
      console.log(`Added column ${columnName} to ${tableName}`);
    } else {
      console.log(`Column ${columnName} already exists in ${tableName}`);
    }
  } catch (error) {
    console.error(`Failed to add column ${columnName} to ${tableName}:`, error);
    throw error;
  }
}

/**
 * Migration 2: Add extended customer fields
 */
const migration002: Migration = {
  version: 2,
  name: "extended_customer_fields",
  up: async (db: SQLiteDatabase) => {
    // Add columns safely, checking if they exist first
    const columnsToAdd = [
      { name: "company", type: "TEXT" },
      { name: "jobTitle", type: "TEXT" },
      { name: "birthday", type: "TEXT" },
      { name: "notes", type: "TEXT" },
      { name: "nickname", type: "TEXT" },
      { name: "photoUri", type: "TEXT" },
      { name: "contactSource", type: "TEXT DEFAULT 'manual'" },
      { name: "lastContactDate", type: "TEXT" },
      { name: "preferredContactMethod", type: "TEXT" },
    ];

    for (const column of columnsToAdd) {
      await addColumnIfNotExists(db, "customers", column.name, column.type);
    }

    // Add indexes for new fields (these are safe with IF NOT EXISTS)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_customer_company ON customers(company);
      CREATE INDEX IF NOT EXISTS idx_customer_contact_source ON customers(contactSource);
      CREATE INDEX IF NOT EXISTS idx_customer_created ON customers(createdAt);
      CREATE INDEX IF NOT EXISTS idx_customer_total_spent ON customers(totalSpent);
      CREATE INDEX IF NOT EXISTS idx_customer_last_purchase ON customers(lastPurchase);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    // Note: SQLite doesn't support DROP COLUMN, so we'd need to recreate the table
    // For simplicity, we'll leave the columns but could implement table recreation if needed
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_customer_last_purchase;
      DROP INDEX IF EXISTS idx_customer_total_spent;
      DROP INDEX IF EXISTS idx_customer_created;
      DROP INDEX IF EXISTS idx_customer_contact_source;
      DROP INDEX IF EXISTS idx_customer_company;
    `);
  },
};

/**
 * All migrations in order
 */
export const migrations: Migration[] = [
  migration000,
  migration001,
  migration002,
];

/**
 * Run migrations to bring database up to target version
 */
export async function runMigrations(
  db: SQLiteDatabase,
  targetVersion?: number
): Promise<void> {
  const currentVersion = await getCurrentVersion(db);
  const maxVersion =
    targetVersion || Math.max(...migrations.map((m) => m.version));

  console.log(
    `Database migration: current version ${currentVersion}, target version ${maxVersion}`
  );

  if (currentVersion >= maxVersion) {
    console.log("Database is already up to date");
    return;
  }

  // Filter migrations that need to be run
  const migrationsToRun = migrations
    .filter(
      (migration) =>
        migration.version > currentVersion && migration.version <= maxVersion
    )
    .sort((a, b) => a.version - b.version);

  if (migrationsToRun.length === 0) {
    console.log("No migrations to run");
    return;
  }

  console.log(
    `Running ${migrationsToRun.length} migrations:`,
    migrationsToRun.map((m) => m.name)
  );

  // Run migrations in a transaction for safety
  await db.withTransactionAsync(async () => {
    for (const migration of migrationsToRun) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      try {
        await migration.up(db);
        await setVersion(db, migration.version);
        console.log(`✓ Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`✗ Migration ${migration.version} failed:`, error);
        throw error; // This will rollback the transaction
      }
    }
  });

  console.log("All migrations completed successfully");
}

/**
 * Rollback to a specific version (useful for development/testing)
 */
export async function rollbackToVersion(
  db: SQLiteDatabase,
  targetVersion: number
): Promise<void> {
  const currentVersion = await getCurrentVersion(db);

  if (targetVersion >= currentVersion) {
    console.log("Target version is not lower than current version");
    return;
  }

  // Find migrations to rollback (in reverse order)
  const migrationsToRollback = migrations
    .filter(
      (migration) =>
        migration.version > targetVersion && migration.version <= currentVersion
    )
    .sort((a, b) => b.version - a.version); // Reverse order

  console.log(`Rolling back ${migrationsToRollback.length} migrations`);

  await db.withTransactionAsync(async () => {
    for (const migration of migrationsToRollback) {
      if (migration.down) {
        console.log(
          `Rolling back migration ${migration.version}: ${migration.name}`
        );
        await migration.down(db);
      }
    }
    await setVersion(db, targetVersion);
  });

  console.log(`Rollback completed to version ${targetVersion}`);
}

/**
 * Reset database (drop all tables and reset version)
 */
export async function resetDatabase(db: SQLiteDatabase): Promise<void> {
  console.log("Resetting database...");

  await db.withTransactionAsync(async () => {
    // Get all table names
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    // Drop all tables
    for (const table of tables) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table.name}`);
    }

    // Reset version
    await setVersion(db, 0);
  });

  console.log("Database reset completed");
}
