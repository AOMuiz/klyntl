import { Analytics } from "@/types/analytics";
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "@/types/customer";
import { CreateTransactionInput, Transaction } from "@/types/transaction";
import { generateId } from "@/utils/helpers";
import * as SQLite from "expo-sqlite";
import {
  executeQuery,
  executeQueryForFirstResult,
  executeQueryForResults,
  executeTransaction,
  getDatabaseInstance,
} from "./helper";

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private databaseName: string;

  constructor(databaseName = "klyntl.db") {
    this.databaseName = databaseName;
  }

  private async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await getDatabaseInstance(this.databaseName);
    }
    return this.db;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const db = await this.getDatabase();

    try {
      // Create tables and indexes using transaction for better performance
      const initQueries = [
        {
          query: "PRAGMA journal_mode = WAL;",
        },
        {
          query: `CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            email TEXT,
            address TEXT,
            totalSpent REAL DEFAULT 0,
            lastPurchase TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );`,
        },
        {
          query: `CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            customerId TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            FOREIGN KEY (customerId) REFERENCES customers (id)
          );`,
        },
        {
          query:
            "CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);",
        },
        {
          query:
            "CREATE INDEX IF NOT EXISTS idx_customer_name ON customers(name);",
        },
        {
          query:
            "CREATE INDEX IF NOT EXISTS idx_transaction_customer ON transactions(customerId);",
        },
        {
          query:
            "CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);",
        },
      ];

      await executeTransaction(db, initQueries);
      this.isInitialized = true;
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  // CRUD Operations for Customers
  async createCustomer(customerData: CreateCustomerInput): Promise<Customer> {
    await this.initialize();
    const db = await this.getDatabase();
    const id = generateId("cust");
    const now = new Date().toISOString();

    const customer: Customer = {
      id,
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || undefined,
      address: customerData.address || undefined,
      totalSpent: 0,
      lastPurchase: undefined,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await executeQuery(
        db,
        `INSERT INTO customers (id, name, phone, email, address, totalSpent, lastPurchase, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.name,
          customer.phone,
          customer.email,
          customer.address,
          customer.totalSpent,
          customer.lastPurchase,
          customer.createdAt,
          customer.updatedAt,
        ]
      );

      return customer;
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    }
  }

  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      let sql = "SELECT * FROM customers ORDER BY name ASC";
      let params: any[] = [];

      if (searchQuery) {
        sql =
          "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC";
        params = [`%${searchQuery}%`, `%${searchQuery}%`];
      }

      const customers = await executeQueryForResults<Customer>(db, sql, params);
      return customers;
    } catch (error) {
      console.error("Failed to get customers:", error);
      throw error;
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      const customer = await executeQueryForFirstResult<Customer>(
        db,
        "SELECT * FROM customers WHERE id = ?",
        [id]
      );

      return customer || null;
    } catch (error) {
      console.error("Failed to get customer by ID:", error);
      throw error;
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      const customer = await executeQueryForFirstResult<Customer>(
        db,
        "SELECT * FROM customers WHERE phone = ?",
        [phone]
      );

      return customer || null;
    } catch (error) {
      console.error("Failed to get customer by phone:", error);
      throw error;
    }
  }

  async updateCustomer(
    id: string,
    updates: UpdateCustomerInput
  ): Promise<void> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      const updatedAt = new Date().toISOString();
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(updates), updatedAt, id];

      await executeQuery(
        db,
        `UPDATE customers SET ${setClause}, updatedAt = ? WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      // Delete transactions first due to foreign key constraint
      await executeQuery(db, "DELETE FROM transactions WHERE customerId = ?", [
        id,
      ]);

      // Then delete the customer
      await executeQuery(db, "DELETE FROM customers WHERE id = ?", [id]);
    } catch (error) {
      console.error("Failed to delete customer:", error);
      throw error;
    }
  }

  // CRUD Operations for Transactions
  async createTransaction(
    transactionData: CreateTransactionInput
  ): Promise<Transaction> {
    await this.initialize();
    const db = await this.getDatabase();
    const id = generateId("txn");

    const transaction: Transaction = {
      id,
      customerId: transactionData.customerId,
      amount: transactionData.amount,
      description: transactionData.description || undefined,
      date: transactionData.date,
      type: transactionData.type,
    };

    try {
      await executeQuery(
        db,
        `INSERT INTO transactions (id, customerId, amount, description, date, type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.customerId,
          transaction.amount,
          transaction.description,
          transaction.date,
          transaction.type,
        ]
      );

      // Update customer's total spent and last purchase date
      await this.updateCustomerTotals(transaction.customerId);

      return transaction;
    } catch (error) {
      console.error("Failed to create transaction:", error);
      throw error;
    }
  }

  async getTransactionsByCustomer(customerId: string): Promise<Transaction[]> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      const transactions = await executeQueryForResults<Transaction>(
        db,
        "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC",
        [customerId]
      );

      return transactions;
    } catch (error) {
      console.error("Failed to get transactions by customer:", error);
      throw error;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      const transactions = await executeQueryForResults<Transaction>(
        db,
        "SELECT * FROM transactions ORDER BY date DESC"
      );

      return transactions;
    } catch (error) {
      console.error("Failed to get all transactions:", error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      // Get the transaction to update customer totals after deletion
      const transaction = await executeQueryForFirstResult<Transaction>(
        db,
        "SELECT * FROM transactions WHERE id = ?",
        [id]
      );

      if (transaction) {
        await executeQuery(db, "DELETE FROM transactions WHERE id = ?", [id]);
        await this.updateCustomerTotals(transaction.customerId);
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      throw error;
    }
  }

  // Helper method to update customer totals
  private async updateCustomerTotals(customerId: string): Promise<void> {
    const db = await this.getDatabase();

    try {
      // Calculate total spent
      const totalResult = await executeQueryForFirstResult<{ total: number }>(
        db,
        "SELECT SUM(amount) as total FROM transactions WHERE customerId = ? AND type = 'sale'",
        [customerId]
      );

      // Get last purchase date
      const lastPurchaseResult = await executeQueryForFirstResult<{
        date: string;
      }>(
        db,
        "SELECT date FROM transactions WHERE customerId = ? AND type = 'sale' ORDER BY date DESC LIMIT 1",
        [customerId]
      );

      const totalSpent = totalResult?.total || 0;
      const lastPurchase = lastPurchaseResult?.date || null;

      await executeQuery(
        db,
        "UPDATE customers SET totalSpent = ?, lastPurchase = ?, updatedAt = ? WHERE id = ?",
        [totalSpent, lastPurchase, new Date().toISOString(), customerId]
      );
    } catch (error) {
      console.error("Failed to update customer totals:", error);
      throw error;
    }
  }

  // Analytics methods
  async getAnalytics(): Promise<Analytics> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      // Get total customers
      const customerCountResult = await executeQueryForFirstResult<{
        count: number;
      }>(db, "SELECT COUNT(*) as count FROM customers");

      // Get total revenue
      const revenueResult = await executeQueryForFirstResult<{ total: number }>(
        db,
        "SELECT SUM(amount) as total FROM transactions WHERE type = 'sale'"
      );

      // Get total transactions
      const transactionCountResult = await executeQueryForFirstResult<{
        count: number;
      }>(db, "SELECT COUNT(*) as count FROM transactions");

      // Get top customers
      const topCustomers = await executeQueryForResults<Customer>(
        db,
        "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 5"
      );

      return {
        totalCustomers: customerCountResult?.count || 0,
        totalRevenue: revenueResult?.total || 0,
        totalTransactions: transactionCountResult?.count || 0,
        topCustomers,
      };
    } catch (error) {
      console.error("Failed to get analytics:", error);
      throw error;
    }
  }

  // Database utility methods
  async clearAllData(): Promise<void> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      await executeTransaction(db, [
        { query: "DELETE FROM transactions" },
        { query: "DELETE FROM customers" },
      ]);
    } catch (error) {
      console.error("Failed to clear all data:", error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      try {
        await this.db.closeAsync();
        this.db = null;
        this.isInitialized = false;
      } catch (error) {
        console.error("Failed to close database:", error);
        throw error;
      }
    }
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();
