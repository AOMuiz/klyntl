import {
  Analytics,
  BusinessInsight,
  CustomerAnalytics,
  PurchaseBehaviorAnalytics,
  RevenueAnalytics,
} from "@/types/analytics";
import { Customer } from "@/types/customer";
import { CustomerFilters } from "@/types/filters";
import { StoreConfig, UpdateStoreConfigInput } from "@/types/store";
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/types/transaction";
import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { AnalyticsRepository } from "../repositories/AnalyticsRepository";
import { CustomerRepository } from "../repositories/CustomerRepository";
import { ProductCategoryRepository } from "../repositories/ProductCategoryRepository";
import { ProductRepository } from "../repositories/ProductRepository";
import { StoreConfigRepository } from "../repositories/StoreConfigRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { DatabaseConfig } from "../types";
import { AuditLogService } from "./AuditLogService";
import { PaymentService } from "./PaymentService";
import { QueryBuilderService } from "./QueryBuilderService";
import { DatabaseError, NotFoundError, ValidationError } from "./utilService";
import { ValidationService } from "./ValidationService";

// ===== MAIN DATABASE SERVICE (ORCHESTRATOR) =====
export class DatabaseService {
  private readonly config: DatabaseConfig;
  private readonly auditService: AuditLogService;
  private readonly queryBuilder: QueryBuilderService;
  private readonly validationService: ValidationService;
  public readonly paymentService: PaymentService;
  public readonly customers: CustomerRepository;
  public readonly transactions: TransactionRepository;
  public readonly products: ProductRepository;
  public readonly productCategories: ProductCategoryRepository;
  public readonly storeConfig: StoreConfigRepository;
  public readonly analytics: AnalyticsRepository;

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

    this.auditService = new AuditLogService(this.db, this.config);
    this.queryBuilder = new QueryBuilderService(this.config);
    this.validationService = new ValidationService(this.db);
    this.customers = new CustomerRepository(
      this.db,
      this.config,
      this.auditService,
      this.queryBuilder
    );
    this.paymentService = new PaymentService(this.db, this.customers);
    this.transactions = new TransactionRepository(
      this.db,
      this.auditService,
      this.customers,
      this.paymentService
    );
    this.products = new ProductRepository(
      this.db,
      this.config,
      this.auditService,
      this.queryBuilder
    );
    this.productCategories = new ProductCategoryRepository(
      this.db,
      this.config,
      this.auditService
    );
    this.storeConfig = new StoreConfigRepository(
      this.db,
      this.config,
      this.auditService
    );
    this.analytics = new AnalyticsRepository(
      this.db,
      this.config,
      this.auditService
    );
  }

  // Analytics methods
  async getAnalytics(): Promise<Analytics> {
    return this.analytics.getBasicAnalytics();
  }

  // Enhanced analytics methods
  async getRevenueAnalytics(days: number = 30): Promise<RevenueAnalytics> {
    return this.analytics.getRevenueAnalytics(days);
  }

  async getCustomerAnalytics(days?: number): Promise<CustomerAnalytics> {
    const filters = days
      ? {
          dateRange: {
            startDate: new Date(
              Date.now() - days * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date().toISOString(),
          },
        }
      : undefined;
    return this.analytics.getCustomerAnalytics(filters);
  }

  async getPurchaseBehaviorAnalytics(): Promise<PurchaseBehaviorAnalytics> {
    return this.analytics.getPurchaseBehaviorAnalytics();
  }

  async getBusinessInsights(): Promise<BusinessInsight[]> {
    return this.analytics.generateBusinessInsights();
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

      await this.auditService.logEntry({
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

      const validTableNames = tables
        .map((t) => t.name)
        .filter((name) => /^[a-zA-Z0-9_]+$/.test(name));
      const recordCounts: Record<string, number> = {};

      for (const tableName of validTableNames) {
        try {
          const result = await this.db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          recordCounts[tableName] = result?.count || 0;
        } catch {
          recordCounts[tableName] = -1;
        }
      }

      return {
        isHealthy: hasRequiredTables,
        tables: validTableNames,
        indexCount: indexes.length,
        version: version?.user_version || 0,
        recordCounts,
      };
    } catch (error) {
      throw new DatabaseError("getDatabaseHealth", error as Error);
    }
  }

  // Audit log access
  get auditLog() {
    return this.auditService;
  }

  // Payment service access
  get payment() {
    return this.paymentService;
  }

  // Helper method for customer data augmentation
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

  // ===== BACKWARD COMPATIBILITY METHODS =====
  // These methods maintain the old monolithic service API while delegating
  // to the new repository pattern. This ensures existing code continues to work
  // without changes during the migration period.

  /**
   * @deprecated Use this.storeConfig.getConfig() instead
   * Maintained for backward compatibility with existing components
   */
  async getStoreConfig(): Promise<StoreConfig | null> {
    return this.storeConfig.getConfig();
  }

  /**
   * @deprecated Use this.storeConfig.updateConfig() instead
   * Maintained for backward compatibility with existing components
   */
  async updateStoreConfig(updates: UpdateStoreConfigInput): Promise<void> {
    return this.storeConfig.updateConfig(updates);
  }

  /**
   * @deprecated Use this.customers.findAll() instead
   * Simple customer search - maintained for backward compatibility
   * Used by: ContactImportButton.tsx, various test files
   */
  async getCustomers(searchQuery?: string): Promise<Customer[]> {
    return this.customers.findAll(searchQuery);
  }

  /**
   * @deprecated Use this.customers.count() method instead
   * Count customers with filters - maintained for backward compatibility
   * Used by: UI pagination components, analytics dashboards
   */
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
          this.queryBuilder.buildCustomerFilterQuery(filters);
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

  /**
   * @deprecated Use this.transactions.create() instead
   * Maintained for backward compatibility with existing components
   */
  async createTransaction(
    transactionData: CreateTransactionInput
  ): Promise<Transaction> {
    return this.transactions.create(transactionData);
  }

  /**
   * @deprecated Use this.transactions.update() instead
   * Maintained for backward compatibility with existing components
   */
  async updateTransaction(
    id: string,
    updates: UpdateTransactionInput
  ): Promise<void> {
    return this.transactions.update(id, updates);
  }

  /**
   * @deprecated Use this.transactions.delete() instead
   * Maintained for backward compatibility with existing components
   */
  async deleteTransaction(id: string): Promise<void> {
    return this.transactions.delete(id);
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
          ValidationService.validateTransactionInput(transactionData);

          // Verify customer exists
          const customer = await this.customers.findById(
            transactionData.customerId
          );
          if (!customer) {
            throw new NotFoundError("Customer", transactionData.customerId);
          }

          const id = generateId("txn");
          const transaction: Transaction = {
            id,
            customerId: transactionData.customerId,
            productId: transactionData.productId,
            amount: transactionData.amount,
            description: transactionData.description || undefined,
            date: transactionData.date,
            type: transactionData.type,
          };

          await this.db.runAsync(
            `INSERT INTO transactions (id, customerId, productId, amount, description, date, type) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              transaction.id,
              transaction.customerId,
              transaction.productId || null,
              transaction.amount,
              transaction.description || null,
              transaction.date,
              transaction.type,
            ]
          );

          results.push(transaction);
          customerIds.add(transaction.customerId);

          await this.auditService.logEntry({
            tableName: "transactions",
            operation: "CREATE",
            recordId: transaction.id,
            newValues: transaction,
          });
        }

        // Update all affected customer totals
        await this.customers.updateTotals(Array.from(customerIds));
      });

      return results;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("batchCreateTransactions", error as Error);
    }
  }
}

// ===== FACTORY FUNCTION =====
export function createDatabaseService(
  db: SQLiteDatabase,
  config?: Partial<DatabaseConfig>
): DatabaseService {
  return new DatabaseService(db, config);
}
