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
import { SQLiteDatabase } from "expo-sqlite";
import { SimpleTransactionCalculator } from "../../calculations/SimpleTransactionCalculator";
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
import { SimplePaymentService } from "./SimplePaymentService";
import { DatabaseError } from "./utilService";
import { ValidationService } from "./ValidationService";

// ===== MAIN DATABASE SERVICE (ORCHESTRATOR) =====
export class DatabaseService {
  private readonly config: DatabaseConfig;
  private readonly auditService: AuditLogService;
  private readonly queryBuilder: QueryBuilderService;
  private readonly validationService: ValidationService;
  public readonly paymentService: PaymentService;
  public readonly simplePaymentService: SimplePaymentService;
  public readonly customers: CustomerRepository;
  public readonly transactions: TransactionRepository;
  public readonly products: ProductRepository;
  public readonly productCategories: ProductCategoryRepository;
  public readonly storeConfig: StoreConfigRepository;
  public get analytics(): AnalyticsRepository {
    if (!this._analytics) {
      this._analytics = new AnalyticsRepository(
        this.db,
        this.config,
        this.auditService
      );
    }
    return this._analytics;
  }

  // ===== LAZY-LOADED REPOSITORIES =====
  private _analytics?: AnalyticsRepository;

  // ===== CENTRALIZED CALCULATION SERVICE =====
  public readonly calculationService: typeof SimpleTransactionCalculator;

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
    this.simplePaymentService = new SimplePaymentService(
      this.db,
      this.customers
    );
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
    // AnalyticsRepository - lazy loaded
    // this.analytics = new AnalyticsRepository(
    //   this.db,
    //   this.config,
    //   this.auditService
    // );

    // ===== INITIALIZE CENTRALIZED CALCULATION SERVICE =====
    this.calculationService = SimpleTransactionCalculator;
  }

  // ===== COMMON DATABASE OPERATIONS =====

  /**
   * Execute raw SQL query (for complex operations)
   */
  async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return await this.db.getAllAsync<T>(sql, params);
  }

  /**
   * Execute raw SQL command
   */
  async executeCommand(sql: string, params: any[] = []): Promise<void> {
    await this.db.runAsync(sql, params);
  }

  /**
   * Execute operations within a database transaction
   */
  async withTransaction(callback: () => Promise<void>): Promise<void> {
    return await this.db.withTransactionAsync(callback);
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

  // Simple payment service access
  get simplePayment() {
    return this.simplePaymentService;
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

  // ===== MISSING METHODS FOR TEST COMPATIBILITY =====
  // These methods are added to fix failing tests and maintain backward compatibility

  /**
   * Update customer balance - for test compatibility
   */
  async updateBalance(customerId: string, newBalance: number): Promise<void> {
    try {
      await this.db.runAsync(
        "UPDATE customers SET outstandingBalance = ?, updatedAt = ? WHERE id = ?",
        [newBalance, new Date().toISOString(), customerId]
      );
    } catch (error) {
      throw new DatabaseError("updateBalance", error as Error);
    }
  }

  /**
   * Update transaction status - for test compatibility
   */
  async updateStatus(transactionId: string, newStatus: string): Promise<void> {
    try {
      await this.db.runAsync(
        "UPDATE transactions SET status = ?, updatedAt = ? WHERE id = ?",
        [newStatus, new Date().toISOString(), transactionId]
      );
    } catch (error) {
      throw new DatabaseError("updateStatus", error as Error);
    }
  }

  /**
   * Get transactions by customer - for test compatibility
   */
  async getByCustomer(customerId: string): Promise<Transaction[]> {
    return this.transactions.findByCustomer(customerId);
  }

  /**
   * Get all transactions - for test compatibility
   */
  async getAll(): Promise<Transaction[]> {
    return this.transactions.getAllTransactions();
  }

  /**
   * Create transaction with balance handling - for test compatibility
   */
  async createWithBalance(
    transactionData: CreateTransactionInput
  ): Promise<Transaction> {
    return this.transactions.create(transactionData);
  }
}

// ===== FACTORY FUNCTION =====
export function createDatabaseService(
  db: SQLiteDatabase,
  config?: Partial<DatabaseConfig>
): DatabaseService {
  return new DatabaseService(db, config);
}

/**
 * Service Locator Pattern - For accessing services throughout the app
 *
 * This provides a centralized way to access all services without
 * passing dependencies everywhere.
 */
export class ServiceLocator {
  private static instance: ServiceLocator;
  private services: Map<string, any> = new Map();

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not registered`);
    }
    return service as T;
  }

  has(key: string): boolean {
    return this.services.has(key);
  }
}

// ===== USAGE EXAMPLES =====

/**
 * How to use the pragmatic approach:
 */

// 1. Initialize services once at app startup
export function initializeServices(db: SQLiteDatabase) {
  const config: DatabaseConfig = {
    customerActiveDays: 90,
    defaultLowStockThreshold: 10,
    defaultPageSize: 20,
    enableAuditLog: true,
    maxBatchSize: 100,
  };

  // Create main database service
  const databaseService = new DatabaseService(db, config);

  // Register in service locator
  const locator = ServiceLocator.getInstance();
  locator.register("database", databaseService);

  return { databaseService };
}

// 2. Use services throughout the app
export function useServices() {
  const locator = ServiceLocator.getInstance();
  const db = locator.get<DatabaseService>("database");

  return {
    // Only load repositories when actually needed
    customers: db.customers,
    transactions: db.transactions,

    // Access to raw database operations if needed
    executeQuery: db.executeQuery.bind(db),
    withTransaction: db.withTransaction.bind(db),
  };
}

/*
STRATEGY BENEFITS:

✅ SOLID Principles Maintained:
- Single Responsibility: Each repository/service has one clear purpose
- Open/Closed: Easy to extend without modifying existing code
- Liskov Substitution: All repositories follow same interface
- Interface Segregation: Clean separation of concerns
- Dependency Inversion: Depends on abstractions

✅ Pragmatic Approach:
- Lazy loading prevents unnecessary instantiation
- Service locator provides centralized access
- Only load what you actually use
- Easy to add new repositories when needed

✅ Avoids Fragmentation:
- Single DatabaseService as main entry point
- Related functionality grouped together
- Clear boundaries between concerns
- No unnecessary service proliferation

✅ Future-Proof:
- Easy to add new repositories as app grows
- Maintains clean architecture
- Scales well with additional features
- Backward compatible
*/
