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
 * Migration 4: Add audit log table for tracking data changes
 */
const migration004: Migration = {
  version: 4,
  name: "audit_log",
  up: async (db) => {
    await db.execAsync(`
      -- Create audit log table
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        tableName TEXT NOT NULL,
        operation TEXT NOT NULL CHECK(operation IN ('CREATE', 'UPDATE', 'DELETE')),
        recordId TEXT NOT NULL,
        oldValues TEXT, -- JSON string of old values
        newValues TEXT, -- JSON string of new values
        timestamp TEXT NOT NULL
      );

      -- Add indexes for audit log queries
      CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(tableName);
      CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(recordId);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_operation ON audit_log(operation);
    `);
  },
  down: async (db) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_audit_operation;
      DROP INDEX IF EXISTS idx_audit_timestamp;
      DROP INDEX IF EXISTS idx_audit_record;
      DROP INDEX IF EXISTS idx_audit_table;
      DROP TABLE IF EXISTS audit_log;
    `);
  },
};

// Add this to your migrations array
export const auditLogMigration = migration004;

// Usage example - add to your migrations.ts file:
/*
export const migrations: Migration[] = [
  migration000,
  migration001,
  migration002,
  migration003,
  migration004, // Add the audit log migration
];
*/

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
 * Migration 3: Add products and store configuration tables
 */
const migration003: Migration = {
  version: 3,
  name: "products_and_store",
  up: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        costPrice REAL NOT NULL DEFAULT 0,
        sku TEXT UNIQUE,
        categoryId TEXT,
        imageUrl TEXT,
        stockQuantity INTEGER NOT NULL DEFAULT 0,
        lowStockThreshold INTEGER NOT NULL DEFAULT 5,
        isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1)),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES product_categories(id) ON DELETE SET NULL
      );

      -- Create store configuration table
      CREATE TABLE IF NOT EXISTS store_config (
        id TEXT PRIMARY KEY DEFAULT 'main',
        storeName TEXT NOT NULL,
        description TEXT,
        logoUrl TEXT,
        primaryColor TEXT DEFAULT '#059669',
        secondaryColor TEXT DEFAULT '#FFA726',
        currency TEXT DEFAULT 'NGN',
        isActive INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      -- Create product categories table
      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        parentId TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (parentId) REFERENCES product_categories (id) ON DELETE SET NULL
      );

      -- Add indexes for products
      CREATE INDEX IF NOT EXISTS idx_product_categoryId ON products(categoryId);
      CREATE INDEX IF NOT EXISTS idx_product_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_product_active ON products(isActive);
      CREATE INDEX IF NOT EXISTS idx_product_price ON products(price);
      CREATE INDEX IF NOT EXISTS idx_product_stock ON products(stockQuantity);
      CREATE INDEX IF NOT EXISTS idx_product_name ON products(name);

      -- Add indexes for categories
      CREATE INDEX IF NOT EXISTS idx_category_parent ON product_categories(parentId);
      CREATE INDEX IF NOT EXISTS idx_category_active ON product_categories(isActive);

      -- Insert default store config if none exists
      INSERT OR IGNORE INTO store_config (id, storeName, createdAt, updatedAt) 
      VALUES ('main', 'My Store', datetime('now'), datetime('now'));
    `);
  },
  down: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_category_active;
      DROP INDEX IF EXISTS idx_category_parent;
      DROP INDEX IF EXISTS idx_product_name;
      DROP INDEX IF EXISTS idx_product_stock;
      DROP INDEX IF EXISTS idx_product_price;
      DROP INDEX IF EXISTS idx_product_active;
      DROP INDEX IF EXISTS idx_product_sku;
      DROP INDEX IF EXISTS idx_product_category;
      DROP TABLE IF EXISTS product_categories;
      DROP TABLE IF EXISTS store_config;
      DROP TABLE IF EXISTS products;
    `);
  },
};

/**
 * Migration 5: Add performance indexes for repository pattern
 */
const migration005: Migration = {
  version: 5,
  name: "repository_performance_indexes",
  up: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      -- Composite indexes for customer queries
      CREATE INDEX IF NOT EXISTS idx_customer_last_contact ON customers(lastContactDate DESC, createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_customer_company_name ON customers(company, name);
      CREATE INDEX IF NOT EXISTS idx_customer_total_spent_desc ON customers(totalSpent DESC);
      CREATE INDEX IF NOT EXISTS idx_customer_contact_source_name ON customers(contactSource, name);
      CREATE INDEX IF NOT EXISTS idx_customer_preferred_method_name ON customers(preferredContactMethod, name);
      
      -- Transaction indexes for analytics
      CREATE INDEX IF NOT EXISTS idx_transaction_customer_date ON transactions(customerId, date DESC);
      CREATE INDEX IF NOT EXISTS idx_transaction_type_date ON transactions(type, date);
      CREATE INDEX IF NOT EXISTS idx_transaction_amount ON transactions(amount);
      
      -- Product indexes for analytics
      CREATE INDEX IF NOT EXISTS idx_product_name_active ON products(name, isActive);
      CREATE INDEX IF NOT EXISTS idx_product_price_active ON products(price, isActive);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_customer_last_contact;
      DROP INDEX IF EXISTS idx_customer_company_name;
      DROP INDEX IF EXISTS idx_customer_total_spent_desc;
      DROP INDEX IF EXISTS idx_customer_contact_source_name;
      DROP INDEX IF EXISTS idx_customer_preferred_method_name;
      DROP INDEX IF EXISTS idx_transaction_customer_date;
      DROP INDEX IF EXISTS idx_transaction_type_date;
      DROP INDEX IF EXISTS idx_transaction_amount;
      DROP INDEX IF EXISTS idx_product_name_active;
      DROP INDEX IF EXISTS idx_product_price_active;
    `);
  },
};

/**
 * Migration 6: Add product tracking to transactions for inventory management
 */
const migration006: Migration = {
  version: 6,
  name: "transaction_product_tracking",
  up: async (db: SQLiteDatabase) => {
    // Add productId to transactions table
    await addColumnIfNotExists(db, "transactions", "productId", "TEXT");

    // Add foreign key constraint
    try {
      await db.runAsync(
        "ALTER TABLE transactions ADD CONSTRAINT fk_transaction_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL"
      );
    } catch {
      // Constraint might already exist or not be supported in all SQLite versions
      console.log(
        "Foreign key constraint for productId may not be supported in this SQLite version"
      );
    }

    // Add index for product queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transaction_product ON transactions(productId);
      CREATE INDEX IF NOT EXISTS idx_transaction_customer_product ON transactions(customerId, productId);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    // Note: SQLite doesn't support DROP COLUMN, so we leave the column
    // but remove the indexes
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_transaction_product;
      DROP INDEX IF EXISTS idx_transaction_customer_product;
    `);
  },
};

/**
 * Migration 7: Add debt management and enhanced transaction fields
 */
const migration007: Migration = {
  version: 7,
  name: "debt_management_enhancement",
  up: async (db: SQLiteDatabase) => {
    // Add new columns to transactions table
    const transactionColumns = [
      { name: "paymentMethod", type: "TEXT DEFAULT 'cash'" },
      { name: "paidAmount", type: "INTEGER DEFAULT 0" },
      { name: "remainingAmount", type: "INTEGER DEFAULT 0" },
      { name: "status", type: "TEXT DEFAULT 'completed'" },
      { name: "linkedTransactionId", type: "TEXT" },
      { name: "dueDate", type: "TEXT" },
      { name: "currency", type: "TEXT DEFAULT 'NGN'" },
      { name: "exchangeRate", type: "REAL DEFAULT 1" },
      { name: "metadata", type: "TEXT" },
      { name: "isDeleted", type: "INTEGER DEFAULT 0" },
    ];

    for (const column of transactionColumns) {
      await addColumnIfNotExists(db, "transactions", column.name, column.type);
    }

    // Add outstandingBalance to customers table
    await addColumnIfNotExists(
      db,
      "customers",
      "outstandingBalance",
      "INTEGER DEFAULT 0"
    );

    // Update existing transactions to use kobo precision (multiply by 100)
    await db.runAsync(`
      UPDATE transactions 
      SET amount = CAST(amount * 100 AS INTEGER),
          paidAmount = CAST(amount * 100 AS INTEGER),
          remainingAmount = 0
      WHERE amount > 0
    `);

    // Update customers totalSpent to kobo precision
    await db.runAsync(`
      UPDATE customers 
      SET totalSpent = CAST(totalSpent * 100 AS INTEGER),
          outstandingBalance = 0
    `);

    // Add indexes for debt management
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_customerId ON transactions(customerId);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_linked ON transactions(linkedTransactionId);
      CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(dueDate);
      CREATE INDEX IF NOT EXISTS idx_customers_outstanding ON customers(outstandingBalance);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    // Note: SQLite doesn't support DROP COLUMN, so we leave the columns
    // but remove the indexes
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_customers_outstanding;
      DROP INDEX IF EXISTS idx_transactions_due_date;
      DROP INDEX IF EXISTS idx_transactions_linked;
      DROP INDEX IF EXISTS idx_transactions_status;
      DROP INDEX IF EXISTS idx_transactions_type;
      DROP INDEX IF EXISTS idx_transactions_date;
      DROP INDEX IF EXISTS idx_transactions_customerId;
    `);
  },
};

/**
 * Migration 8: Add appliedToDebt column for debt management
 */
const migration008: Migration = {
  version: 8,
  name: "add_applied_to_debt_column",
  up: async (db: SQLiteDatabase) => {
    // Add appliedToDebt column to transactions table
    await addColumnIfNotExists(
      db,
      "transactions",
      "appliedToDebt",
      "INTEGER DEFAULT 0"
    );

    // Add index for debt queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_applied_to_debt ON transactions(appliedToDebt);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    // Note: SQLite doesn't support DROP COLUMN, so we leave the column
    // but remove the index
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_transactions_applied_to_debt;
    `);
  },
};

/**
 * Migration 9: Add credit balance and payment audit for over-payment handling
 */
const migration009: Migration = {
  version: 9,
  name: "credit_balance_and_payment_audit",
  up: async (db: SQLiteDatabase) => {
    // Add credit_balance to customers table
    await addColumnIfNotExists(
      db,
      "customers",
      "credit_balance",
      "INTEGER DEFAULT 0"
    );

    // Create payment_audit table for tracking over-payments and credit allocations
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payment_audit (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        source_transaction_id TEXT,
        type TEXT NOT NULL CHECK(type IN ('payment', 'over_payment', 'refund', 'credit_note', 'payment_allocation', 'credit_applied_to_sale', 'credit_used', 'payment_applied', 'credit_usage', 'status_change', 'partial_payment', 'full_payment')),
        amount INTEGER NOT NULL,
        currency TEXT DEFAULT 'NGN',
        metadata TEXT, -- JSON string for additional data
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (source_transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      );
    `);

    // Add indexes for payment_audit
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_payment_audit_customer ON payment_audit(customer_id);
      CREATE INDEX IF NOT EXISTS idx_payment_audit_source_tx ON payment_audit(source_transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payment_audit_type ON payment_audit(type);
      CREATE INDEX IF NOT EXISTS idx_payment_audit_created ON payment_audit(created_at);
    `);

    // Add index for credit_balance queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_customers_credit_balance ON customers(credit_balance);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    // Note: SQLite doesn't support DROP COLUMN, so we leave the columns
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_customers_credit_balance;
      DROP INDEX IF EXISTS idx_payment_audit_created;
      DROP INDEX IF EXISTS idx_payment_audit_type;
      DROP INDEX IF EXISTS idx_payment_audit_source_tx;
      DROP INDEX IF EXISTS idx_payment_audit_customer;
      DROP TABLE IF EXISTS payment_audit;
    `);
  },
};

/**
 * Migration 10: Reconcile outstanding balances, transaction statuses and generate legacy payment_audit records
 */
const migration010: Migration = {
  version: 10,
  name: "reconcile_debt_and_audit",
  up: async (db: SQLiteDatabase) => {
    console.log(
      "Running reconciliation: updating customers.outstandingBalance from transactions, fixing transaction statuses, generating legacy payment_audit records"
    );

    // 1) Recompute paidAmount for transactions from payment_audit
    // We consider two ways an audit can reference a debt:
    // - metadata.debtId = transactions.id (when PaymentService inserted debtId)
    // - credit-related audits that use source_transaction_id = transaction.id (credit applied to sale)
    await db.runAsync(`
      UPDATE transactions
      SET paidAmount = COALESCE((
        SELECT COALESCE(SUM(pa.amount), 0)
        FROM payment_audit pa
        WHERE (json_extract(pa.metadata, '$.debtId') = transactions.id)
          OR (pa.type IN ('credit_applied_to_sale','credit_used') AND pa.source_transaction_id = transactions.id)
      ), 0)
    `);

    // 2) Recompute remainingAmount for debt-bearing transactions
    await db.runAsync(`
      UPDATE transactions
      SET remainingAmount = CASE
        WHEN type IN ('sale','credit') THEN MAX(0, amount - COALESCE((
          SELECT COALESCE(SUM(pa.amount), 0)
          FROM payment_audit pa
          WHERE (json_extract(pa.metadata, '$.debtId') = transactions.id)
            OR (pa.type IN ('credit_applied_to_sale','credit_used') AND pa.source_transaction_id = transactions.id)
        ), 0))
        ELSE 0
      END
    `);

    // 3) Normalize any negative remainingAmount just in case
    await db.runAsync(`
      UPDATE transactions SET remainingAmount = 0 WHERE remainingAmount < 0
    `);

    // 4) Set deterministic status for debt-bearing transactions
    await db.runAsync(`
      UPDATE transactions
      SET status = CASE
        WHEN type IN ('sale','credit') AND COALESCE(remainingAmount,0) = 0 THEN 'completed'
        WHEN type IN ('sale','credit') AND COALESCE(remainingAmount,0) = amount THEN 'pending'
        WHEN type IN ('sale','credit') AND COALESCE(remainingAmount,0) > 0 THEN 'partial'
        ELSE status
      END
      WHERE type IN ('sale','credit')
    `);

    // 5) Recompute outstandingBalance per customer from transactions (sale/credit)
    const customers = await db.getAllAsync<{ id: string }>(
      "SELECT id FROM customers"
    );

    for (const c of customers) {
      const res = await db.getFirstAsync<{ outstanding: number }>(
        `SELECT COALESCE(SUM(remainingAmount),0) as outstanding FROM transactions WHERE customerId = ? AND type IN ('sale','credit') AND isDeleted = 0`,
        [c.id]
      );
      const outstanding = res?.outstanding ?? 0;

      await db.runAsync(
        `UPDATE customers SET outstandingBalance = ?, updatedAt = ? WHERE id = ?`,
        [outstanding, new Date().toISOString(), c.id]
      );
    }

    // 6) Create payment_audit records for legacy payments that were applied to debt but lack an audit record
    await db.runAsync(`
      INSERT INTO payment_audit (id, customer_id, source_transaction_id, type, amount, currency, metadata, created_at)
      SELECT lower(hex(randomblob(8))), customerId, id, 'payment', amount, 'NGN', json_object('legacy_allocation', 1), datetime('now')
      FROM transactions t
      WHERE t.type = 'payment' AND t.appliedToDebt = 1
        AND NOT EXISTS (SELECT 1 FROM payment_audit p WHERE p.source_transaction_id = t.id)
    `);
  },
  down: async (db: SQLiteDatabase) => {
    // Remove only the legacy audit records created by this migration
    await db.runAsync(`
      DELETE FROM payment_audit
      WHERE metadata = json_object('legacy_allocation', 1)
    `);
  },
};

/**
 * Migration 11: Add simple_payment_audit table for SimplePaymentService
 */
const migration011: Migration = {
  version: 11,
  name: "simple_payment_audit_table",
  up: async (db: SQLiteDatabase) => {
    // Create simple_payment_audit table for SimplePaymentService
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS simple_payment_audit (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('payment', 'overpayment', 'credit_used')),
        amount INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        description TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
    `);

    // Add indexes for simple_payment_audit
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_simple_payment_audit_customer ON simple_payment_audit(customer_id);
      CREATE INDEX IF NOT EXISTS idx_simple_payment_audit_type ON simple_payment_audit(type);
      CREATE INDEX IF NOT EXISTS idx_simple_payment_audit_created ON simple_payment_audit(created_at);
    `);
  },
  down: async (db: SQLiteDatabase) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_simple_payment_audit_created;
      DROP INDEX IF EXISTS idx_simple_payment_audit_type;
      DROP INDEX IF EXISTS idx_simple_payment_audit_customer;
      DROP TABLE IF EXISTS simple_payment_audit;
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
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009, // Add credit balance and payment audit migration
  migration010, // Reconciliation for debt/audit
  migration011, // Add simple_payment_audit table migration
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
