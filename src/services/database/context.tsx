import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from "expo-sqlite";
import React, { ReactNode } from "react";
import { Analytics } from "../../types/analytics";
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../../types/customer";
import { CreateTransactionInput, Transaction } from "../../types/transaction";

// Migration function that runs when the database is first created or updated
async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;

  try {
    // Check current database version - using getFirstSync as fallback if async not available
    let currentDbVersion = 0;
    try {
      const result = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version"
      );
      currentDbVersion = result?.user_version || 0;
    } catch {
      // Fallback to sync if async not available
      const result = (db as any).getFirstSync?.("PRAGMA user_version") as {
        user_version: number;
      } | null;
      currentDbVersion = result?.user_version || 0;
    }

    if (currentDbVersion >= DATABASE_VERSION) {
      return;
    }

    // Initialize database for the first time
    if (currentDbVersion === 0) {
      // Try to use execAsync, fallback to runAsync or sync methods
      const sqlCommands = `
        PRAGMA journal_mode = WAL;
        
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

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          customerId TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          FOREIGN KEY (customerId) REFERENCES customers (id)
        );

        CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customer_name ON customers(name);
        CREATE INDEX IF NOT EXISTS idx_transaction_customer ON transactions(customerId);
        CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);
      `;

      try {
        await db.execAsync(sqlCommands);
      } catch {
        // Fallback to individual commands
        const commands = sqlCommands.split(";").filter((cmd) => cmd.trim());
        for (const cmd of commands) {
          if (cmd.trim()) {
            try {
              await db.runAsync(cmd.trim());
            } catch {
              // Final fallback to sync if available
              (db as any).runSync?.(cmd.trim());
            }
          }
        }
      }

      currentDbVersion = 1;
    }

    // Update database version
    try {
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    } catch {
      try {
        await db.runAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
      } catch {
        (db as any).runSync?.(`PRAGMA user_version = ${DATABASE_VERSION}`);
      }
    }
  } catch (error) {
    console.error("Database migration failed:", error);
    throw error;
  }
}

// Database Provider Component
interface DatabaseProviderProps {
  children: ReactNode;
  databaseName?: string;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
  databaseName = "klyntl.db",
}) => {
  return (
    <SQLiteProvider
      databaseName={databaseName}
      onInit={migrateDbIfNeeded}
      onError={(error) => {
        console.error("SQLiteProvider error:", error);
      }}
    >
      {children}
    </SQLiteProvider>
  );
};

// Custom hooks for database operations
export const useDatabase = () => {
  return useSQLiteContext();
};

export const useCustomers = () => {
  const db = useSQLiteContext();

  const createCustomer = async (
    customerInput: CreateCustomerInput
  ): Promise<Customer> => {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const customer: Customer = {
      ...customerInput,
      id,
      totalSpent: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.runAsync(
        `INSERT INTO customers (id, name, phone, email, address, totalSpent, lastPurchase, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.name,
          customer.phone,
          customer.email || null,
          customer.address || null,
          customer.totalSpent,
          customer.lastPurchase || null,
          customer.createdAt,
          customer.updatedAt,
        ]
      );
      return customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  };

  const getCustomers = async (searchQuery?: string): Promise<Customer[]> => {
    try {
      let sql = "SELECT * FROM customers ORDER BY name ASC";
      let params: any[] = [];

      if (searchQuery) {
        sql =
          "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC";
        params = [`%${searchQuery}%`, `%${searchQuery}%`];
      }

      const rows = (await db.getAllAsync(sql, params)) as Customer[];
      return rows;
    } catch (error) {
      console.error("Error getting customers:", error);
      throw error;
    }
  };

  const getCustomerById = async (id: string): Promise<Customer | null> => {
    try {
      const row = (await db.getFirstAsync(
        "SELECT * FROM customers WHERE id = ?",
        [id]
      )) as Customer | null;
      return row;
    } catch (error) {
      console.error("Error getting customer by ID:", error);
      throw error;
    }
  };

  const updateCustomer = async (
    id: string,
    updates: UpdateCustomerInput
  ): Promise<void> => {
    const updatedAt = new Date().toISOString();
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), updatedAt, id];

    try {
      await db.runAsync(
        `UPDATE customers SET ${setClause}, updatedAt = ? WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      await db.withTransactionAsync(async () => {
        // First delete all transactions for this customer
        await db.runAsync("DELETE FROM transactions WHERE customerId = ?", [
          id,
        ]);
        // Then delete the customer
        await db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  };

  return {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
  };
};

export const useTransactions = () => {
  const db = useSQLiteContext();

  const createTransaction = async (
    transactionInput: CreateTransactionInput
  ): Promise<Transaction> => {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction: Transaction = { ...transactionInput, id };

    try {
      await db.withTransactionAsync(async () => {
        // Insert transaction
        await db.runAsync(
          `INSERT INTO transactions (id, customerId, amount, description, date, type) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            transaction.id,
            transaction.customerId,
            transaction.amount,
            transaction.description || null,
            transaction.date,
            transaction.type,
          ]
        );

        // Update customer total spent if it's a sale
        if (transaction.type === "sale") {
          await db.runAsync(
            "UPDATE customers SET totalSpent = totalSpent + ?, lastPurchase = ? WHERE id = ?",
            [transaction.amount, transaction.date, transaction.customerId]
          );
        }
      });

      return transaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  };

  const getTransactions = async (
    customerId?: string
  ): Promise<Transaction[]> => {
    try {
      let sql = "SELECT * FROM transactions ORDER BY date DESC";
      let params: any[] = [];

      if (customerId) {
        sql =
          "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC";
        params = [customerId];
      }

      const rows = (await db.getAllAsync(sql, params)) as Transaction[];
      return rows;
    } catch (error) {
      console.error("Error getting transactions:", error);
      throw error;
    }
  };

  return { createTransaction, getTransactions };
};

export const useAnalytics = () => {
  const db = useSQLiteContext();

  const getAnalytics = async (): Promise<Analytics> => {
    try {
      // Get total customers
      const customerCount = (await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM customers"
      )) as { count: number };

      // Get total revenue and transactions
      const revenueData = (await db.getFirstAsync(
        'SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE type = "sale"'
      )) as { count: number; total: number };

      // Get top customers
      const topCustomers = (await db.getAllAsync(
        "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 5"
      )) as Customer[];

      return {
        totalCustomers: customerCount?.count || 0,
        totalRevenue: revenueData?.total || 0,
        totalTransactions: revenueData?.count || 0,
        topCustomers,
      };
    } catch (error) {
      console.error("Error getting analytics:", error);
      throw error;
    }
  };

  return { getAnalytics };
};
