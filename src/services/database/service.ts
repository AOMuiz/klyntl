import type { Analytics } from "@/types/analytics";
import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "@/types/customer";
import type { CustomerFilters, SortOptions } from "@/types/filters";
import type {
  CreateCategoryInput,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductFilters,
  ProductSortOptions,
  UpdateProductInput,
} from "@/types/product";
import type { StoreConfig, UpdateStoreConfigInput } from "@/types/store";
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/types/transaction";
import { generateId } from "@/utils/helpers";
import type { SQLiteDatabase } from "expo-sqlite";

// Custom Error Types
export class DatabaseError extends Error {
  public readonly operation: string;
  public readonly cause?: Error;

  constructor(operation: string, cause?: Error) {
    super(
      `Database operation '${operation}' failed${
        cause ? `: ${cause.message}` : ""
      }`
    );
    this.name = "DatabaseError";
    this.operation = operation;
    this.cause = cause;
  }
}

export class ValidationError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export class NotFoundError extends Error {
  public readonly resource: string;
  public readonly identifier: string;

  constructor(resource: string, identifier: string) {
    super(`${resource} with identifier '${identifier}' not found`);
    this.name = "NotFoundError";
    this.resource = resource;
    this.identifier = identifier;
  }
}

export class DuplicateError extends Error {
  public readonly field: string;
  public readonly value: string;

  constructor(field: string, value: string) {
    super(`Duplicate value '${value}' for field '${field}'`);
    this.name = "DuplicateError";
    this.field = field;
    this.value = value;
  }
}

// Configuration interface
export interface DatabaseConfig {
  customerActiveDays: number;
  defaultLowStockThreshold: number;
  defaultPageSize: number;
  enableAuditLog: boolean;
  maxBatchSize: number;
}

// Audit log interface
interface AuditLogEntry {
  id: string;
  tableName: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  recordId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: string;
}

interface FilterQueryParts {
  whereClause: string;
  params: any[];
}

export // Moved to types/database.ts
type BatchOperation<T> = {
  operation: "create" | "update" | "delete";
  data: T;
  id?: string;
};

/**
 * Enhanced database service with improved error handling, validation, and performance
 */
export class DatabaseService {
  private readonly config: DatabaseConfig;

  constructor(
    private db: SQLiteDatabase,
    config: Partial<DatabaseConfig> = {}
  ) {
    this.config = {
      customerActiveDays: 60,
      defaultLowStockThreshold: 5,
      defaultPageSize: 20,
      enableAuditLog: false,
      maxBatchSize: 100,
      ...config,
    };
  }

  // Input validation methods
  private validateCustomerInput(
    data: CreateCustomerInput | UpdateCustomerInput
  ): void {
    if ("name" in data) {
      if (!data.name?.trim()) {
        throw new ValidationError(
          "Name is required and cannot be empty",
          "name"
        );
      }
      if (data.name.length > 100) {
        throw new ValidationError("Name cannot exceed 100 characters", "name");
      }
    }

    if ("phone" in data) {
      if (!data.phone?.trim()) {
        throw new ValidationError(
          "Phone is required and cannot be empty",
          "phone"
        );
      }
      // Basic phone validation - adjust regex based on your needs
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ""))) {
        throw new ValidationError("Invalid phone number format", "phone");
      }
    }

    if ("email" in data && data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new ValidationError("Invalid email format", "email");
      }
    }
  }

  private validateTransactionInput(
    data: CreateTransactionInput | UpdateTransactionInput
  ): void {
    if ("amount" in data) {
      if (typeof data.amount !== "number" || isNaN(data.amount)) {
        throw new ValidationError("Amount must be a valid number", "amount");
      }
      if (data.amount === 0) {
        throw new ValidationError("Amount cannot be zero", "amount");
      }
    }

    if ("type" in data && data.type) {
      if (!["sale", "refund", "payment", "adjustment"].includes(data.type)) {
        throw new ValidationError("Invalid transaction type", "type");
      }
    }

    if ("date" in data && data.date) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        throw new ValidationError("Invalid date format", "date");
      }
    }
  }

  private validateProductInput(
    data: CreateProductInput | UpdateProductInput
  ): void {
    if ("name" in data) {
      if (!data.name?.trim()) {
        throw new ValidationError("Product name is required", "name");
      }
      if (data.name.length > 200) {
        throw new ValidationError(
          "Product name cannot exceed 200 characters",
          "name"
        );
      }
    }

    if ("price" in data) {
      if (typeof data.price !== "number" || data.price < 0) {
        throw new ValidationError(
          "Price must be a non-negative number",
          "price"
        );
      }
    }

    if ("stockQuantity" in data) {
      if (typeof data.stockQuantity !== "number" || data.stockQuantity < 0) {
        throw new ValidationError(
          "Stock quantity must be a non-negative number",
          "stockQuantity"
        );
      }
    }
  }

  // Audit logging
  private async logAuditEntry(
    entry: Omit<AuditLogEntry, "id" | "timestamp">
  ): Promise<void> {
    if (!this.config.enableAuditLog) return;

    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        id: generateId("audit"),
        timestamp: new Date().toISOString(),
      };

      await this.db.runAsync(
        `INSERT INTO audit_log (id, tableName, operation, recordId, oldValues, newValues, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          auditEntry.id,
          auditEntry.tableName,
          auditEntry.operation,
          auditEntry.recordId,
          auditEntry.oldValues ? JSON.stringify(auditEntry.oldValues) : null,
          auditEntry.newValues ? JSON.stringify(auditEntry.newValues) : null,
          auditEntry.timestamp,
        ]
      );
    } catch (error) {
      console.warn("Failed to log audit entry:", error);
      // Don't throw - audit logging shouldn't break main operations
    }
  }

  // Enhanced filter query building with SQL injection prevention
  private buildFilterQuery(filters: CustomerFilters): FilterQueryParts {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.customerType && filters.customerType !== "all") {
      if (filters.customerType === "business") {
        conditions.push("company IS NOT NULL AND company != ''");
      } else {
        conditions.push("(company IS NULL OR company = '')");
      }
    }

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

    if (filters.dateRange) {
      conditions.push("createdAt >= ? AND createdAt <= ?");
      params.push(filters.dateRange.startDate, filters.dateRange.endDate);
    }

    if (filters.hasTransactions !== undefined) {
      if (filters.hasTransactions) {
        conditions.push(
          "EXISTS (SELECT 1 FROM transactions WHERE customerId = customers.id)"
        );
      } else {
        conditions.push(
          "NOT EXISTS (SELECT 1 FROM transactions WHERE customerId = customers.id)"
        );
      }
    }

    if (filters.isActive !== undefined) {
      const activeDays = this.config.customerActiveDays;
      const cutoffDate = new Date(
        Date.now() - activeDays * 24 * 60 * 60 * 1000
      ).toISOString();

      if (filters.isActive) {
        conditions.push("lastPurchase >= ?");
        params.push(cutoffDate);
      } else {
        conditions.push("(lastPurchase IS NULL OR lastPurchase < ?)");
        params.push(cutoffDate);
      }
    }

    if (filters.contactSource && filters.contactSource !== "all") {
      conditions.push("contactSource = ?");
      params.push(filters.contactSource);
    }

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

  private buildSortClause(sort?: SortOptions): string {
    if (!sort) return "ORDER BY name ASC";

    const validFields = [
      "name",
      "totalSpent",
      "createdAt",
      "lastPurchase",
      "lastContactDate",
    ];
    if (!validFields.includes(sort.field)) {
      console.warn(`Invalid sort field: ${sort.field}, defaulting to name`);
      return "ORDER BY name ASC";
    }

    const direction = sort.direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
    return `ORDER BY ${sort.field} ${direction}`;
  }

  private augmentCustomerData(customer: any): Customer {
    const activeDays = this.config.customerActiveDays;
    const cutoffDate = new Date(Date.now() - activeDays * 24 * 60 * 60 * 1000);

    return {
      ...customer,
      customerType:
        customer.company && customer.company.trim() ? "business" : "individual",
      isActive: customer.lastPurchase
        ? new Date(customer.lastPurchase) > cutoffDate
        : false,
    };
  }

  // Enhanced CRUD Operations for Customers
  async createCustomer(customerData: CreateCustomerInput): Promise<Customer> {
    this.validateCustomerInput(customerData);

    try {
      // Check for duplicate phone
      const existingCustomer = await this.getCustomerByPhone(
        customerData.phone
      );
      if (existingCustomer) {
        throw new DuplicateError("phone", customerData.phone);
      }

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
        birthday: customerData.birthday
          ? new Date(customerData.birthday).toISOString()
          : undefined,
        notes: customerData.notes || undefined,
        nickname: customerData.nickname || undefined,
        photoUri: customerData.photoUri || undefined,
        contactSource: customerData.contactSource || "manual",
        lastContactDate: undefined,
        preferredContactMethod:
          customerData.preferredContactMethod || undefined,
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

      await this.db.runAsync(
        `INSERT INTO customers (
          id, name, phone, email, address, company, jobTitle, birthday, 
          notes, nickname, photoUri, contactSource, lastContactDate, 
          preferredContactMethod, totalSpent, lastPurchase, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          customer.name,
          customer.phone,
          customer.email ?? null,
          customer.address ?? null,
          customer.company ?? null,
          customer.jobTitle ?? null,
          customer.birthday ?? null,
          customer.notes ?? null,
          customer.nickname ?? null,
          customer.photoUri ?? null,
          customer.contactSource || "manual",
          customer.lastContactDate ?? null,
          customer.preferredContactMethod ?? null,
          customer.totalSpent,
          customer.lastPurchase ?? null,
          customer.createdAt,
          customer.updatedAt,
        ]
      );

      await this.logAuditEntry({
        tableName: "customers",
        operation: "CREATE",
        recordId: customer.id,
        newValues: customer,
      });

      return customer;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DuplicateError) {
        throw error;
      }
      throw new DatabaseError("createCustomer", error as Error);
    }
  }

  async getCustomersWithFilters(
    searchQuery?: string,
    filters?: CustomerFilters,
    sort?: SortOptions,
    page: number = 0,
    pageSize: number = this.config.defaultPageSize
  ): Promise<Customer[]> {
    try {
      let sql = "SELECT * FROM customers";
      const params: any[] = [];
      const conditions: string[] = [];

      // Add search query conditions
      if (searchQuery?.trim()) {
        conditions.push(
          "(name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?)"
        );
        const searchPattern = `%${searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // Add filter conditions
      if (filters) {
        const { whereClause, params: filterParams } =
          this.buildFilterQuery(filters);
        if (whereClause) {
          const filterConditions = whereClause.replace("WHERE ", "");
          conditions.push(`(${filterConditions})`);
          params.push(...filterParams);
        }
      }

      // Combine conditions
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      // Add sorting
      sql += ` ${this.buildSortClause(sort)}`;

      // Add pagination
      if (pageSize > 0) {
        const offset = page * pageSize;
        sql += ` LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);
      }

      const results = await this.db.getAllAsync<any>(sql, params);
      return results.map((result) => this.augmentCustomerData(result));
    } catch (error) {
      throw new DatabaseError("getCustomersWithFilters", error as Error);
    }
  }

  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    return this.getCustomersWithFilters(searchQuery);
  }

  async getCustomersCountWithFilters(
    searchQuery?: string,
    filters?: CustomerFilters
  ): Promise<number> {
    try {
      let sql = "SELECT COUNT(*) as count FROM customers";
      const params: any[] = [];
      const conditions: string[] = [];

      if (searchQuery?.trim()) {
        conditions.push(
          "(name LIKE ? OR phone LIKE ? OR email LIKE ? OR company LIKE ?)"
        );
        const searchPattern = `%${searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (filters) {
        const { whereClause, params: filterParams } =
          this.buildFilterQuery(filters);
        if (whereClause) {
          const filterConditions = whereClause.replace("WHERE ", "");
          conditions.push(`(${filterConditions})`);
          params.push(...filterParams);
        }
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      const result = await this.db.getFirstAsync<{ count: number }>(
        sql,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new DatabaseError("getCustomersCountWithFilters", error as Error);
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    if (!id?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM customers WHERE id = ?",
        [id]
      );

      if (!result) {
        return null;
      }

      return this.augmentCustomerData(result);
    } catch (error) {
      throw new DatabaseError("getCustomerById", error as Error);
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    if (!phone?.trim()) {
      throw new ValidationError("Phone number is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM customers WHERE phone = ?",
        [phone]
      );
      return result ? this.augmentCustomerData(result) : null;
    } catch (error) {
      throw new DatabaseError("getCustomerByPhone", error as Error);
    }
  }

  async updateCustomer(
    id: string,
    updates: UpdateCustomerInput
  ): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    this.validateCustomerInput(updates);

    try {
      // Check if customer exists and get current data for audit
      const currentCustomer = await this.getCustomerById(id);
      if (!currentCustomer) {
        throw new NotFoundError("Customer", id);
      }

      // Check for duplicate phone if phone is being updated
      if (updates.phone && updates.phone !== currentCustomer.phone) {
        const existingCustomer = await this.getCustomerByPhone(updates.phone);
        if (existingCustomer && existingCustomer.id !== id) {
          throw new DuplicateError("phone", updates.phone);
        }
      }

      await this.db.withTransactionAsync(async () => {
        const now = new Date().toISOString();
        const fields = Object.keys(updates).filter((key) => key !== "id");

        if (fields.length === 0) return;

        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => (updates as any)[field]);

        await this.db.runAsync(
          `UPDATE customers SET ${setClause}, updatedAt = ? WHERE id = ?`,
          [...values, now, id]
        );

        // Update customer totals if needed
        await this.updateCustomerTotals(id);

        await this.logAuditEntry({
          tableName: "customers",
          operation: "UPDATE",
          recordId: id,
          oldValues: currentCustomer,
          newValues: { ...currentCustomer, ...updates, updatedAt: now },
        });
      });
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof DuplicateError
      ) {
        throw error;
      }
      throw new DatabaseError("updateCustomer", error as Error);
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      // Check if customer exists
      const customer = await this.getCustomerById(id);
      if (!customer) {
        throw new NotFoundError("Customer", id);
      }

      await this.db.withTransactionAsync(async () => {
        // Delete associated transactions first
        await this.db.runAsync(
          "DELETE FROM transactions WHERE customerId = ?",
          [id]
        );

        // Delete the customer
        await this.db.runAsync("DELETE FROM customers WHERE id = ?", [id]);

        await this.logAuditEntry({
          tableName: "customers",
          operation: "DELETE",
          recordId: id,
          oldValues: customer,
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("deleteCustomer", error as Error);
    }
  }

  // Batch operations for better performance
  async batchUpdateCustomerTotals(customerIds: string[]): Promise<void> {
    if (customerIds.length === 0) return;

    try {
      // Process in batches to avoid memory issues
      const batchSize = this.config.maxBatchSize;

      for (let i = 0; i < customerIds.length; i += batchSize) {
        const batch = customerIds.slice(i, i + batchSize);
        const placeholders = batch.map(() => "?").join(",");

        // Get totals for this batch
        const totals = await this.db.getAllAsync<{
          customerId: string;
          totalSpent: number;
          lastPurchase: string;
        }>(
          `SELECT 
            customerId,
            COALESCE(SUM(amount), 0) as totalSpent,
            MAX(date) as lastPurchase
          FROM transactions 
          WHERE customerId IN (${placeholders}) AND type = 'sale'
          GROUP BY customerId`,
          batch
        );

        // Update customers in batch
        for (const total of totals) {
          await this.db.runAsync(
            `UPDATE customers 
             SET totalSpent = ?, lastPurchase = ?, updatedAt = ?
             WHERE id = ?`,
            [
              total.totalSpent || 0,
              total.lastPurchase || null,
              new Date().toISOString(),
              total.customerId,
            ]
          );
        }
      }
    } catch (error) {
      throw new DatabaseError("batchUpdateCustomerTotals", error as Error);
    }
  }

  private async updateCustomerTotals(customerId: string): Promise<void> {
    return this.batchUpdateCustomerTotals([customerId]);
  }

  // Enhanced Transaction operations
  async createTransaction(
    transactionData: CreateTransactionInput
  ): Promise<Transaction> {
    this.validateTransactionInput(transactionData);

    try {
      // Verify customer exists
      const customer = await this.getCustomerById(transactionData.customerId);
      if (!customer) {
        throw new NotFoundError("Customer", transactionData.customerId);
      }

      const id = generateId("txn");
      const transaction: Transaction = {
        id,
        customerId: transactionData.customerId,
        amount: transactionData.amount,
        description: transactionData.description || undefined,
        date: transactionData.date,
        type: transactionData.type,
      };

      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
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

        await this.updateCustomerTotals(transaction.customerId);

        await this.logAuditEntry({
          tableName: "transactions",
          operation: "CREATE",
          recordId: transaction.id,
          newValues: transaction,
        });
      });

      return transaction;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("createTransaction", error as Error);
    }
  }

  async getTransactionsByCustomer(customerId: string): Promise<Transaction[]> {
    if (!customerId?.trim()) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC",
        [customerId]
      );
    } catch (error) {
      throw new DatabaseError("getTransactionsByCustomer", error as Error);
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions ORDER BY date DESC"
      );
    } catch (error) {
      throw new DatabaseError("getAllTransactions", error as Error);
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    try {
      return await this.db.getFirstAsync<Transaction>(
        "SELECT * FROM transactions WHERE id = ?",
        [id]
      );
    } catch (error) {
      throw new DatabaseError("getTransactionById", error as Error);
    }
  }

  async updateTransaction(
    id: string,
    updates: UpdateTransactionInput
  ): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    this.validateTransactionInput(updates);

    try {
      // Check if transaction exists
      const currentTransaction = await this.getTransactionById(id);
      if (!currentTransaction) {
        throw new NotFoundError("Transaction", id);
      }

      await this.db.withTransactionAsync(async () => {
        const fields = Object.keys(updates).filter((key) => key !== "id");

        if (fields.length === 0) return;

        const setClause = fields.map((field) => `${field} = ?`).join(", ");
        const values = fields.map((field) => {
          const value = (updates as any)[field];
          // Ensure dates are converted to ISO strings
          if (field === "date" && value) {
            return new Date(value).toISOString();
          }
          return value;
        });

        await this.db.runAsync(
          `UPDATE transactions SET ${setClause} WHERE id = ?`,
          [...values, id]
        );

        // Update customer totals
        await this.updateCustomerTotals(currentTransaction.customerId);

        await this.logAuditEntry({
          tableName: "transactions",
          operation: "UPDATE",
          recordId: id,
          oldValues: currentTransaction,
          newValues: { ...currentTransaction, ...updates },
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("updateTransaction", error as Error);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Transaction ID is required");
    }

    try {
      // Check if transaction exists
      const transaction = await this.getTransactionById(id);
      if (!transaction) {
        throw new NotFoundError("Transaction", id);
      }

      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
        await this.updateCustomerTotals(transaction.customerId);

        await this.logAuditEntry({
          tableName: "transactions",
          operation: "DELETE",
          recordId: id,
          oldValues: transaction,
        });
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("deleteTransaction", error as Error);
    }
  }

  // Product filter query building
  private buildProductFilters(filters?: ProductFilters): {
    sql: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters) {
      // Category filter
      if (filters.category) {
        conditions.push("category = ?");
        params.push(filters.category);
      }

      // Price range filter
      if (filters.priceRange) {
        if (filters.priceRange.min > 0) {
          conditions.push("price >= ?");
          params.push(filters.priceRange.min);
        }
        if (filters.priceRange.max < Number.MAX_SAFE_INTEGER) {
          conditions.push("price <= ?");
          params.push(filters.priceRange.max);
        }
      }

      // Stock status filter
      if (filters.stockStatus && filters.stockStatus !== "all") {
        switch (filters.stockStatus) {
          case "in_stock":
            conditions.push("stockQuantity > lowStockThreshold");
            break;
          case "low_stock":
            conditions.push(
              "stockQuantity > 0 AND stockQuantity <= lowStockThreshold"
            );
            break;
          case "out_of_stock":
            conditions.push("stockQuantity = 0");
            break;
        }
      }

      // Active status filter
      if (filters.isActive !== undefined) {
        conditions.push("isActive = ?");
        params.push(filters.isActive ? 1 : 0);
      }

      // Search query filter
      if (filters.searchQuery?.trim()) {
        conditions.push("(name LIKE ? OR description LIKE ? OR sku LIKE ?)");
        const searchPattern = `%${filters.searchQuery.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
    }

    return {
      sql: conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  // Product CRUD Operations
  async createProduct(productData: CreateProductInput): Promise<Product> {
    this.validateProductInput(productData);

    try {
      // Check for duplicate SKU if provided
      if (productData.sku) {
        const existingProduct = await this.getProductBySku(productData.sku);
        if (existingProduct) {
          throw new DuplicateError("sku", productData.sku);
        }
      }

      const id = generateId("prod");
      const now = new Date().toISOString();

      const product: Product = {
        id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        costPrice: productData.costPrice || 0,
        sku: productData.sku,
        category: productData.category,
        imageUrl: productData.imageUrl,
        stockQuantity: productData.stockQuantity || 0,
        lowStockThreshold:
          productData.lowStockThreshold || this.config.defaultLowStockThreshold,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await this.db.runAsync(
        `INSERT INTO products (
          id, name, description, price, costPrice, sku, category, 
          imageUrl, stockQuantity, lowStockThreshold, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.name,
          product.description || null,
          product.price,
          product.costPrice,
          product.sku || null,
          product.category || null,
          product.imageUrl || null,
          product.stockQuantity,
          product.lowStockThreshold,
          product.isActive ? 1 : 0,
          product.createdAt,
          product.updatedAt,
        ].map((value) => value ?? null) // Convert undefined to null for SQLite
      );

      await this.logAuditEntry({
        tableName: "products",
        operation: "CREATE",
        recordId: product.id,
        newValues: product,
      });

      return product;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DuplicateError) {
        throw error;
      }
      throw new DatabaseError("createProduct", error as Error);
    }
  }

  async getProducts(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page?: number,
    pageSize: number = this.config.defaultPageSize
  ): Promise<Product[]> {
    try {
      let baseSql = "SELECT * FROM products";

      // Apply filters
      const { sql: filterSql, params } = this.buildProductFilters(filters);
      baseSql += filterSql;

      // Add sorting
      if (sort) {
        const direction =
          sort.direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
        const validSortFields = [
          "name",
          "price",
          "stockQuantity",
          "createdAt",
          "updatedAt",
        ];

        if (validSortFields.includes(sort.field)) {
          baseSql += ` ORDER BY ${sort.field} ${direction}`;
        } else {
          console.warn(
            `Invalid sort field: ${sort.field}, defaulting to name ASC`
          );
          baseSql += " ORDER BY name ASC";
        }
      } else {
        baseSql += " ORDER BY name ASC";
      }

      // Add pagination
      if (page != null && pageSize > 0) {
        const offset = page * pageSize;
        baseSql += ` LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);
      }

      const results = await this.db.getAllAsync<any>(baseSql, params);

      return results.map((result) => ({
        ...result,
        isActive: result.isActive === 1,
      }));
    } catch (error) {
      throw new DatabaseError("getProducts", error as Error);
    }
  }

  async getProductsCount(filters?: ProductFilters): Promise<number> {
    try {
      let baseSql = "SELECT COUNT(*) as count FROM products";

      // Apply filters
      const { sql: filterSql, params } = this.buildProductFilters(filters);
      baseSql += filterSql;

      const result = await this.db.getFirstAsync<{ count: number }>(
        baseSql,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new DatabaseError("getProductsCount", error as Error);
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    if (!id?.trim()) {
      throw new ValidationError("Product ID is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (!result) return null;

      return {
        ...result,
        isActive: result.isActive === 1,
      };
    } catch (error) {
      throw new DatabaseError("getProductById", error as Error);
    }
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    if (!sku?.trim()) {
      throw new ValidationError("SKU is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM products WHERE sku = ?",
        [sku]
      );

      if (!result) return null;

      return {
        ...result,
        isActive: result.isActive === 1,
      };
    } catch (error) {
      throw new DatabaseError("getProductBySku", error as Error);
    }
  }

  async updateProduct(id: string, updates: UpdateProductInput): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Product ID is required");
    }

    this.validateProductInput(updates);

    try {
      // Check if product exists
      const currentProduct = await this.getProductById(id);
      if (!currentProduct) {
        throw new NotFoundError("Product", id);
      }

      // Check for duplicate SKU if SKU is being updated
      if (updates.sku && updates.sku !== currentProduct.sku) {
        const existingProduct = await this.getProductBySku(updates.sku);
        if (existingProduct && existingProduct.id !== id) {
          throw new DuplicateError("sku", updates.sku);
        }
      }

      const now = new Date().toISOString();
      const fields = Object.keys(updates).filter((key) => key !== "id");

      if (fields.length === 0) return;

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => {
        const value = (updates as any)[field];
        // Convert boolean to integer for SQLite
        if (field === "isActive" && typeof value === "boolean") {
          return value ? 1 : 0;
        }
        return value;
      });

      await this.db.runAsync(
        `UPDATE products SET ${setClause}, updatedAt = ? WHERE id = ?`,
        [...values, now, id]
      );

      await this.logAuditEntry({
        tableName: "products",
        operation: "UPDATE",
        recordId: id,
        oldValues: currentProduct,
        newValues: { ...currentProduct, ...updates, updatedAt: now },
      });
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof DuplicateError
      ) {
        throw error;
      }
      throw new DatabaseError("updateProduct", error as Error);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Product ID is required");
    }

    try {
      // Check if product exists
      const product = await this.getProductById(id);
      if (!product) {
        throw new NotFoundError("Product", id);
      }

      await this.db.runAsync("DELETE FROM products WHERE id = ?", [id]);

      await this.logAuditEntry({
        tableName: "products",
        operation: "DELETE",
        recordId: id,
        oldValues: product,
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("deleteProduct", error as Error);
    }
  }

  async getLowStockProducts(): Promise<Product[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        "SELECT * FROM products WHERE stockQuantity <= lowStockThreshold AND isActive = 1 ORDER BY stockQuantity ASC"
      );

      return results.map((result) => ({
        ...result,
        isActive: result.isActive === 1,
      }));
    } catch (error) {
      throw new DatabaseError("getLowStockProducts", error as Error);
    }
  }

  // Product Categories CRUD
  async createCategory(
    categoryData: CreateCategoryInput
  ): Promise<ProductCategory> {
    if (!categoryData.name?.trim()) {
      throw new ValidationError("Category name is required", "name");
    }

    try {
      const id = generateId("cat");
      const now = new Date().toISOString();

      const category: ProductCategory = {
        id,
        name: categoryData.name,
        description: categoryData.description,
        parentId: categoryData.parentId,
        isActive: true,
        createdAt: now,
      };

      await this.db.runAsync(
        `INSERT INTO product_categories (id, name, description, parentId, isActive, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.description || null,
          category.parentId || null,
          category.isActive ? 1 : 0,
          category.createdAt,
        ]
      );

      await this.logAuditEntry({
        tableName: "product_categories",
        operation: "CREATE",
        recordId: category.id,
        newValues: category,
      });

      return category;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("createCategory", error as Error);
    }
  }

  async getCategories(): Promise<ProductCategory[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        "SELECT * FROM product_categories WHERE isActive = 1 ORDER BY name ASC"
      );

      return results.map((result) => ({
        ...result,
        isActive: result.isActive === 1,
      }));
    } catch (error) {
      throw new DatabaseError("getCategories", error as Error);
    }
  }

  async getCategoryById(id: string): Promise<ProductCategory | null> {
    if (!id?.trim()) {
      throw new ValidationError("Category ID is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM product_categories WHERE id = ?",
        [id]
      );

      if (!result) return null;

      return {
        ...result,
        isActive: result.isActive === 1,
      };
    } catch (error) {
      throw new DatabaseError("getCategoryById", error as Error);
    }
  }

  // Store Configuration CRUD
  async getStoreConfig(): Promise<StoreConfig | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM store_config WHERE id = 'main'"
      );

      if (!result) return null;

      return {
        ...result,
        isActive: result.isActive === 1,
      };
    } catch (error) {
      throw new DatabaseError("getStoreConfig", error as Error);
    }
  }

  async updateStoreConfig(updates: UpdateStoreConfigInput): Promise<void> {
    try {
      // Check if store config exists
      const currentConfig = await this.getStoreConfig();
      if (!currentConfig) {
        throw new NotFoundError("StoreConfig", "main");
      }

      const now = new Date().toISOString();
      const fields = Object.keys(updates);

      if (fields.length === 0) return;

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => {
        const value = (updates as any)[field];
        // Convert boolean to integer for SQLite
        if (field === "isActive" && typeof value === "boolean") {
          return value ? 1 : 0;
        }
        return value;
      });

      await this.db.runAsync(
        `UPDATE store_config SET ${setClause}, updatedAt = ? WHERE id = 'main'`,
        [...values, now]
      );

      await this.logAuditEntry({
        tableName: "store_config",
        operation: "UPDATE",
        recordId: "main",
        oldValues: currentConfig,
        newValues: { ...currentConfig, ...updates, updatedAt: now },
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("updateStoreConfig", error as Error);
    }
  }

  // Analytics methods
  async getAnalytics(): Promise<Analytics> {
    try {
      const [customerCount, transactionCount, totalRevenue, topCustomers] =
        await Promise.all([
          this.db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM customers"
          ),
          this.db.getFirstAsync<{ count: number }>(
            "SELECT COUNT(*) as count FROM transactions"
          ),
          this.db.getFirstAsync<{ total: number }>(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'sale'"
          ),
          this.db.getAllAsync<any>(
            "SELECT * FROM customers ORDER BY totalSpent DESC LIMIT 5"
          ),
        ]);

      return {
        totalCustomers: customerCount?.count || 0,
        totalTransactions: transactionCount?.count || 0,
        totalRevenue: totalRevenue?.total || 0,
        topCustomers: (topCustomers || []).map((customer) =>
          this.augmentCustomerData(customer)
        ),
      };
    } catch (error) {
      throw new DatabaseError("getAnalytics", error as Error);
    }
  }

  // Batch operations for performance
  async batchCreateTransactions(
    transactions: CreateTransactionInput[]
  ): Promise<Transaction[]> {
    if (transactions.length === 0) return [];
    if (transactions.length > this.config.maxBatchSize) {
      throw new ValidationError(
        `Batch size cannot exceed ${this.config.maxBatchSize}`
      );
    }

    try {
      const results: Transaction[] = [];
      const customerIds = new Set<string>();

      await this.db.withTransactionAsync(async () => {
        for (const transactionData of transactions) {
          this.validateTransactionInput(transactionData);

          // Verify customer exists
          const customer = await this.getCustomerById(
            transactionData.customerId
          );
          if (!customer) {
            throw new NotFoundError("Customer", transactionData.customerId);
          }

          const id = generateId("txn");
          const transaction: Transaction = {
            id,
            customerId: transactionData.customerId,
            amount: transactionData.amount,
            description: transactionData.description || undefined,
            date: transactionData.date,
            type: transactionData.type,
          };

          await this.db.runAsync(
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

          results.push(transaction);
          customerIds.add(transaction.customerId);

          await this.logAuditEntry({
            tableName: "transactions",
            operation: "CREATE",
            recordId: transaction.id,
            newValues: transaction,
          });
        }

        // Update all affected customer totals
        await this.batchUpdateCustomerTotals(Array.from(customerIds));
      });

      return results;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("batchCreateTransactions", error as Error);
    }
  }

  // Audit log queries
  async getAuditLog(
    tableName?: string,
    recordId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    if (!this.config.enableAuditLog) {
      return [];
    }

    try {
      let sql = "SELECT * FROM audit_log";
      const params: any[] = [];
      const conditions: string[] = [];

      if (tableName) {
        conditions.push("tableName = ?");
        params.push(tableName);
      }

      if (recordId) {
        conditions.push("recordId = ?");
        params.push(recordId);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      sql += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const results = await this.db.getAllAsync<any>(sql, params);

      return results.map((result) => ({
        ...result,
        oldValues: result.oldValues ? JSON.parse(result.oldValues) : undefined,
        newValues: result.newValues ? JSON.parse(result.newValues) : undefined,
      }));
    } catch (error) {
      throw new DatabaseError("getAuditLog", error as Error);
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync("DELETE FROM transactions");
        await this.db.runAsync("DELETE FROM customers");
        await this.db.runAsync("DELETE FROM products");
        await this.db.runAsync("DELETE FROM product_categories");

        if (this.config.enableAuditLog) {
          await this.db.runAsync("DELETE FROM audit_log");
        }
      });

      await this.logAuditEntry({
        tableName: "all",
        operation: "DELETE",
        recordId: "all",
        oldValues: { action: "clearAllData" },
      });
    } catch (error) {
      throw new DatabaseError("clearAllData", error as Error);
    }
  }

  async getDatabaseHealth(): Promise<{
    isHealthy: boolean;
    tables: string[];
    indexCount: number;
    version: number;
    recordCounts: Record<string, number>;
  }> {
    try {
      const [tables, indexes, version] = await Promise.all([
        this.db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ),
        this.db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='index'"
        ),
        this.db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"),
      ]);

      const requiredTables = ["customers", "transactions"];
      const hasRequiredTables = requiredTables.every((table) =>
        tables.some((t) => t.name === table)
      );

      // Get record counts for each table
      const recordCounts: Record<string, number> = {};
      for (const table of tables) {
        try {
          const result = await this.db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM ${table.name}`
          );
          recordCounts[table.name] = result?.count || 0;
        } catch {
          recordCounts[table.name] = -1; // Error getting count
        }
      }

      return {
        isHealthy: hasRequiredTables,
        tables: tables.map((t) => t.name),
        indexCount: indexes.length,
        version: version?.user_version || 0,
        recordCounts,
      };
    } catch (error) {
      throw new DatabaseError("getDatabaseHealth", error as Error);
    }
  }
}

/**
 * Factory function to create an enhanced database service instance
 */
export function createDatabaseService(
  db: SQLiteDatabase,
  config?: Partial<DatabaseConfig>
): DatabaseService {
  return new DatabaseService(db, config);
}
