import { Analytics } from "@/types/analytics";
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "@/types/customer";
import {
  CustomerFilters,
  FilterQueryParts,
  SortOptions,
} from "@/types/filters";
import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/types/transaction";
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

  // Database migration method to add missing columns
  private async runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
    try {
      // First ensure the base customers table exists
      await executeQuery(
        db,
        `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        address TEXT,
        totalSpent REAL DEFAULT 0,
        lastPurchase TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`
      );

      // Check if we need to add new columns to existing customers table
      const tableInfo = await executeQueryForResults<any>(
        db,
        "PRAGMA table_info(customers)"
      );

      const existingColumns = tableInfo.map((col: any) => col.name);
      console.log("Existing customer table columns:", existingColumns);

      // List of new columns that need to be added
      const newColumns = [
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

      // Add missing columns
      for (const column of newColumns) {
        if (!existingColumns.includes(column.name)) {
          console.log(`Adding missing column: ${column.name}`);
          await executeQuery(
            db,
            `ALTER TABLE customers ADD COLUMN ${column.name} ${column.type}`
          );
        }
      }
    } catch (error) {
      console.log("Migration check failed:", error);
      throw error;
    }
  }
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const db = await this.getDatabase();

    try {
      // First, run database migrations to add missing columns
      await this.runMigrations(db);

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
            company TEXT,
            jobTitle TEXT,
            birthday TEXT,
            notes TEXT,
            nickname TEXT,
            photoUri TEXT,
            contactSource TEXT DEFAULT 'manual',
            lastContactDate TEXT,
            preferredContactMethod TEXT,
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
        // Performance indexes
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
            "CREATE INDEX IF NOT EXISTS idx_customer_created ON customers(createdAt);",
        },
        {
          query:
            "CREATE INDEX IF NOT EXISTS idx_customer_total_spent ON customers(totalSpent);",
        },
        {
          query:
            "CREATE INDEX IF NOT EXISTS idx_customer_last_purchase ON customers(lastPurchase);",
        },
        {
          query:
            "CREATE INDEX IF NOT EXISTS idx_customer_company ON customers(company);",
        },
        {
          query:
            "CREATE INDEX IF NOT EXISTS idx_customer_contact_source ON customers(contactSource);",
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
      company: customerData.company || undefined,
      jobTitle: customerData.jobTitle || undefined,
      birthday: customerData.birthday || undefined,
      notes: customerData.notes || undefined,
      nickname: customerData.nickname || undefined,
      photoUri: customerData.photoUri || undefined,
      contactSource: customerData.contactSource || "manual",
      lastContactDate: undefined,
      preferredContactMethod: customerData.preferredContactMethod || undefined,
      totalSpent: 0,
      lastPurchase: undefined,
      createdAt: now,
      updatedAt: now,
      customerType:
        customerData.company && customerData.company.trim()
          ? "business"
          : "individual",
      isActive: false,
    };

    try {
      console.log("Inserting customer into database:", customer);
      const result = await executeQuery(
        db,
        `INSERT INTO customers (
          id, name, phone, email, address, company, jobTitle, birthday, 
          notes, nickname, photoUri, contactSource, lastContactDate, 
          preferredContactMethod, totalSpent, lastPurchase, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.name,
          customer.phone,
          customer.email,
          customer.address,
          customer.company,
          customer.jobTitle,
          customer.birthday,
          customer.notes,
          customer.nickname,
          customer.photoUri,
          customer.contactSource,
          customer.lastContactDate,
          customer.preferredContactMethod,
          customer.totalSpent,
          customer.lastPurchase,
          customer.createdAt,
          customer.updatedAt,
        ]
      );
      console.log("Insert result:", result);

      // Verify the insert worked by querying back
      const verifyResult = await executeQueryForFirstResult(
        db,
        "SELECT * FROM customers WHERE id = ?",
        [customer.id]
      );
      console.log("Verification query result:", verifyResult);

      return customer;
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    }
  }

  // Helper method to build filter query parts
  private buildFilterQuery(filters: CustomerFilters): FilterQueryParts {
    const conditions: string[] = [];
    const params: any[] = [];

    // Customer type filter (business vs individual)
    if (filters.customerType && filters.customerType !== "all") {
      if (filters.customerType === "business") {
        conditions.push("(company IS NOT NULL AND company != '')");
      } else {
        conditions.push("(company IS NULL OR company = '')");
      }
    }

    // Spending range filter
    if (filters.spendingRange) {
      if (filters.spendingRange.min > 0) {
        conditions.push("totalSpent >= ?");
        params.push(filters.spendingRange.min);
      }
      if (filters.spendingRange.max < Number.MAX_SAFE_INTEGER) {
        conditions.push("totalSpent <= ?");
        params.push(filters.spendingRange.max);
      }
    }

    // Date range filter (created date)
    if (filters.dateRange) {
      conditions.push("createdAt >= ?");
      params.push(filters.dateRange.startDate);
      conditions.push("createdAt <= ?");
      params.push(filters.dateRange.endDate);
    }

    // Has transactions filter
    if (filters.hasTransactions !== undefined) {
      if (filters.hasTransactions) {
        conditions.push("totalSpent > 0");
      } else {
        conditions.push("totalSpent = 0");
      }
    }

    // Active customer filter (based on recent purchases)
    if (filters.isActive !== undefined) {
      const sixtyDaysAgo = new Date(
        Date.now() - 60 * 24 * 60 * 60 * 1000
      ).toISOString();
      if (filters.isActive) {
        conditions.push("(lastPurchase IS NOT NULL AND lastPurchase >= ?)");
        params.push(sixtyDaysAgo);
      } else {
        conditions.push("(lastPurchase IS NULL OR lastPurchase < ?)");
        params.push(sixtyDaysAgo);
      }
    }

    // Contact source filter
    if (filters.contactSource && filters.contactSource !== "all") {
      conditions.push("contactSource = ?");
      params.push(filters.contactSource);
    }

    // Preferred contact method filter
    if (
      filters.preferredContactMethod &&
      filters.preferredContactMethod !== "all"
    ) {
      conditions.push("preferredContactMethod = ?");
      params.push(filters.preferredContactMethod);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    return { whereClause, params };
  }

  // Helper method to build sort clause
  private buildSortClause(sort?: SortOptions): string {
    if (!sort) {
      return "ORDER BY name ASC";
    }

    const direction = sort.direction.toUpperCase();

    switch (sort.field) {
      case "name":
        return `ORDER BY name ${direction}`;
      case "totalSpent":
        return `ORDER BY totalSpent ${direction}`;
      case "createdAt":
        return `ORDER BY createdAt ${direction}`;
      case "lastPurchase":
        return `ORDER BY lastPurchase ${direction} NULLS LAST`;
      case "lastContactDate":
        return `ORDER BY lastContactDate ${direction} NULLS LAST`;
      default:
        return "ORDER BY name ASC";
    }
  }

  // Helper method to augment customer data with computed fields
  private augmentCustomerData(customer: any): Customer {
    return {
      ...customer,
      customerType:
        customer.company && customer.company.trim() ? "business" : "individual",
      isActive: customer.lastPurchase
        ? new Date(customer.lastPurchase) >
          new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        : false,
    };
  }

  // Enhanced customer retrieval with filtering and sorting
  async getCustomersWithFilters(
    searchQuery?: string,
    filters?: CustomerFilters,
    sort?: SortOptions
  ): Promise<Customer[]> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      let baseSql = "SELECT * FROM customers";
      const allParams: any[] = [];
      const allConditions: string[] = [];

      // Add search query conditions
      if (searchQuery && searchQuery.trim()) {
        allConditions.push(
          "(name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?)"
        );
        const searchPattern = `%${searchQuery.trim()}%`;
        allParams.push(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern
        );
      }

      // Add filter conditions
      if (filters) {
        const { whereClause, params } = this.buildFilterQuery(filters);
        if (whereClause) {
          // Extract conditions from WHERE clause
          const filterConditions = whereClause.replace("WHERE ", "");
          allConditions.push(filterConditions);
          allParams.push(...params);
        }
      }

      // Combine all conditions
      if (allConditions.length > 0) {
        baseSql += ` WHERE ${allConditions.join(" AND ")}`;
      }

      // Add sorting
      baseSql += ` ${this.buildSortClause(sort)}`;

      console.log("Executing customer query:", baseSql, allParams);

      const results = await executeQueryForResults<any>(db, baseSql, allParams);

      // Augment results with computed fields
      const customers = results.map((result) =>
        this.augmentCustomerData(result)
      );

      return customers;
    } catch (error) {
      console.error("Failed to get customers with filters:", error);
      throw error;
    }
  }

  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    // Use the enhanced filtering method for backward compatibility
    return this.getCustomersWithFilters(searchQuery);
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      const customer = await executeQueryForFirstResult<any>(
        db,
        "SELECT * FROM customers WHERE id = ?",
        [id]
      );

      return customer ? this.augmentCustomerData(customer) : null;
    } catch (error) {
      console.error("Failed to get customer by ID:", error);
      throw error;
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      const customer = await executeQueryForFirstResult<any>(
        db,
        "SELECT * FROM customers WHERE phone = ?",
        [phone]
      );

      return customer ? this.augmentCustomerData(customer) : null;
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

  async getTransactionById(id: string): Promise<Transaction | null> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      const transaction = await executeQueryForFirstResult<Transaction>(
        db,
        "SELECT * FROM transactions WHERE id = ?",
        [id]
      );

      return transaction || null;
    } catch (error) {
      console.error("Failed to get transaction by ID:", error);
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

  async updateTransaction(
    id: string,
    updates: UpdateTransactionInput
  ): Promise<void> {
    await this.initialize();
    const db = await this.getDatabase();

    try {
      // Get the original transaction to update customer totals if needed
      const originalTransaction = await executeQueryForFirstResult<Transaction>(
        db,
        "SELECT * FROM transactions WHERE id = ?",
        [id]
      );

      if (!originalTransaction) {
        throw new Error("Transaction not found");
      }

      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(updates), id];

      await executeQuery(
        db,
        `UPDATE transactions SET ${setClause} WHERE id = ?`,
        values
      );

      // Update customer totals if the amount changed
      if (updates.amount !== undefined) {
        await this.updateCustomerTotals(originalTransaction.customerId);
      }
    } catch (error) {
      console.error("Failed to update transaction:", error);
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
      const topCustomersResults = await executeQueryForResults<any>(
        db,
        "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 5"
      );

      const topCustomers = topCustomersResults.map((result) =>
        this.augmentCustomerData(result)
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
