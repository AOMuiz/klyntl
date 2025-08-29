// // Complete Enhanced RepositoryFactory Implementation
import { Customer } from "@/types/customer";
import { CreateProductInput, Product } from "@/types/product";
import { CreateTransactionInput, Transaction } from "@/types/transaction";
import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseError, ValidationError } from "../service/utilService";
import { RepositoryConfig } from "./implementations/BaseRepository";
import { CustomerRepository } from "./implementations/CustomerRepository";
import { ProductRepository } from "./implementations/ProductRepository";
import { StoreConfigRepository } from "./implementations/StoreConfigRepository";
import { TransactionRepository } from "./implementations/TransactionRepository";
import { ICustomerRepository } from "./interfaces/ICustomerRepository";
import { IProductRepository } from "./interfaces/IProductRepository";
import { IStoreConfigRepository } from "./interfaces/IStoreConfigRepository";
import { ITransactionRepository } from "./interfaces/ITransactionRepository";
// import { RepositoryConfig } from "./implementations/BaseRepository";

// export class RepositoryFactory {
//   private static customerRepository: ICustomerRepository | null = null;
//   private static productRepository: IProductRepository | null = null;
//   private static transactionRepository: ITransactionRepository | null = null;
//   private static storeConfigRepository: IStoreConfigRepository | null = null;

//   static getCustomerRepository(db: SQLiteDatabase): ICustomerRepository {
//     if (!this.customerRepository) {
//       this.customerRepository = new CustomerRepository(db);
//     }
//     return this.customerRepository;
//   }

//   static getProductRepository(db: SQLiteDatabase): IProductRepository {
//     if (!this.productRepository) {
//       this.productRepository = new ProductRepository(db);
//     }
//     return this.productRepository;
//   }

//   static getTransactionRepository(db: SQLiteDatabase): ITransactionRepository {
//     if (!this.transactionRepository) {
//       this.transactionRepository = new TransactionRepository(db);
//     }
//     return this.transactionRepository;
//   }

//   static getStoreConfigRepository(db: SQLiteDatabase): IStoreConfigRepository {
//     if (!this.storeConfigRepository) {
//       this.storeConfigRepository = new StoreConfigRepository(db);
//     }
//     return this.storeConfigRepository;
//   }
// }

export class EnhancedRepositoryFactory {
  private static instances = new Map<string, any>();
  private static dbInstanceKeys = new WeakMap<SQLiteDatabase, string>();
  private static dbInstanceCounter = 0;
  private static config: RepositoryConfig = {
    enableAuditLog: false,
    maxBatchSize: 100,
    customerActiveDays: 60,
    defaultLowStockThreshold: 5,
    enableValidation: true,
    enableBusinessRules: true,
  };

  /**
   * Configure the factory with repository settings
   */
  static configure(config: Partial<RepositoryConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Clear existing instances when config changes
    this.instances.clear();
  }

  /**
   * Get current configuration
   */
  static getConfig(): RepositoryConfig {
    return { ...this.config };
  }

  /**
   * Clear all cached repository instances
   */
  static clearInstances(): void {
    this.instances.clear();
  }

  /**
   * Get CustomerRepository instance
   */
  static getCustomerRepository(db: SQLiteDatabase): ICustomerRepository {
    const key = `customer_${this.getDbKey(db)}`;
    if (!this.instances.has(key)) {
      this.instances.set(key, new CustomerRepository(db, this.config));
    }
    return this.instances.get(key);
  }

  /**
   * Get ProductRepository instance
   */
  static getProductRepository(db: SQLiteDatabase): IProductRepository {
    const key = `product_${this.getDbKey(db)}`;
    if (!this.instances.has(key)) {
      this.instances.set(key, new ProductRepository(db, this.config));
    }
    return this.instances.get(key);
  }

  /**
   * Get TransactionRepository instance
   */
  static getTransactionRepository(db: SQLiteDatabase): ITransactionRepository {
    const key = `transaction_${this.getDbKey(db)}`;
    if (!this.instances.has(key)) {
      this.instances.set(key, new TransactionRepository(db, this.config));
    }
    return this.instances.get(key);
  }

  /**
   * Get StoreConfigRepository instance
   */
  static getStoreConfigRepository(db: SQLiteDatabase): IStoreConfigRepository {
    const key = `storeconfig_${this.getDbKey(db)}`;
    if (!this.instances.has(key)) {
      this.instances.set(key, new StoreConfigRepository(db, this.config));
    }
    return this.instances.get(key);
  }

  /**
   * Get all repository instances for a given database
   */
  static getAllRepositories(db: SQLiteDatabase): {
    customerRepository: ICustomerRepository;
    productRepository: IProductRepository;
    transactionRepository: ITransactionRepository;
    storeConfigRepository: IStoreConfigRepository;
  } {
    return {
      customerRepository: this.getCustomerRepository(db),
      productRepository: this.getProductRepository(db),
      transactionRepository: this.getTransactionRepository(db),
      storeConfigRepository: this.getStoreConfigRepository(db),
    };
  }

  /**
   * Create a new repository instance without caching
   */
  static createCustomerRepository(
    db: SQLiteDatabase,
    config?: Partial<RepositoryConfig>
  ): ICustomerRepository {
    const repositoryConfig = { ...this.config, ...config };
    return new CustomerRepository(db, repositoryConfig);
  }

  static createProductRepository(
    db: SQLiteDatabase,
    config?: Partial<RepositoryConfig>
  ): IProductRepository {
    const repositoryConfig = { ...this.config, ...config };
    return new ProductRepository(db, repositoryConfig);
  }

  static createTransactionRepository(
    db: SQLiteDatabase,
    config?: Partial<RepositoryConfig>
  ): ITransactionRepository {
    const repositoryConfig = { ...this.config, ...config };
    return new TransactionRepository(db, repositoryConfig);
  }

  static createStoreConfigRepository(
    db: SQLiteDatabase,
    config?: Partial<RepositoryConfig>
  ): IStoreConfigRepository {
    const repositoryConfig = { ...this.config, ...config };
    return new StoreConfigRepository(db, repositoryConfig);
  }

  /**
   * Initialize all repositories with database schema validation
   */
  static async initializeRepositories(db: SQLiteDatabase): Promise<{
    customerRepository: ICustomerRepository;
    productRepository: IProductRepository;
    transactionRepository: ITransactionRepository;
    storeConfigRepository: IStoreConfigRepository;
  }> {
    try {
      // Validate database schema exists
      await this.validateDatabaseSchema(db);

      // Get all repository instances
      const repositories = this.getAllRepositories(db);

      // Initialize default store config if none exists
      const storeConfig =
        await repositories.storeConfigRepository.getActiveConfig();
      if (!storeConfig) {
        await repositories.storeConfigRepository.initializeDefaultConfig();
      }

      return repositories;
    } catch (error) {
      throw new DatabaseError("initializeRepositories", error as Error);
    }
  }

  /**
   * Validate that required database tables exist
   */
  private static async validateDatabaseSchema(
    db: SQLiteDatabase
  ): Promise<void> {
    const requiredTables = [
      "customers",
      "products",
      "transactions",
      "store_config",
      "product_categories",
    ];

    try {
      const existingTables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const tableNames = existingTables.map((t) => t.name);
      const missingTables = requiredTables.filter(
        (table) => !tableNames.includes(table)
      );

      if (missingTables.length > 0) {
        throw new DatabaseError(
          "validateDatabaseSchema",
          new Error(`Missing required tables: ${missingTables.join(", ")}`)
        );
      }

      // Validate audit_log table if audit logging is enabled
      if (this.config.enableAuditLog && !tableNames.includes("audit_log")) {
        throw new DatabaseError(
          "validateDatabaseSchema",
          new Error("Audit log table is required when audit logging is enabled")
        );
      }
    } catch (error) {
      throw new DatabaseError("validateDatabaseSchema", error as Error);
    }
  }

  /**
   * Generate a unique key for database instance caching
   */
  private static getDbKey(db: SQLiteDatabase): string {
    // Use a WeakMap to assign a unique key to each db instance
    if (!this.dbInstanceKeys.has(db)) {
      const key = `db_${++this.dbInstanceCounter}`;
      this.dbInstanceKeys.set(db, key);
    }
    return this.dbInstanceKeys.get(db)!;
  }

  /**
   * Health check for all repositories
   */
  static async performHealthCheck(db: SQLiteDatabase): Promise<{
    isHealthy: boolean;
    repositories: {
      customer: boolean;
      product: boolean;
      transaction: boolean;
      storeConfig: boolean;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    const repositories = {
      customer: false,
      product: false,
      transaction: false,
      storeConfig: false,
    };

    try {
      // Test customer repository
      try {
        const customerRepo = this.getCustomerRepository(db);
        await customerRepo.count();
        repositories.customer = true;
      } catch (error) {
        errors.push(
          `Customer repository: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // Test product repository
      try {
        const productRepo = this.getProductRepository(db);
        await productRepo.count();
        repositories.product = true;
      } catch (error) {
        errors.push(
          `Product repository: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // Test transaction repository
      try {
        const transactionRepo = this.getTransactionRepository(db);
        await transactionRepo.count();
        repositories.transaction = true;
      } catch (error) {
        errors.push(
          `Transaction repository: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // Test store config repository
      try {
        const storeConfigRepo = this.getStoreConfigRepository(db);
        await storeConfigRepo.count();
        repositories.storeConfig = true;
      } catch (error) {
        errors.push(
          `Store config repository: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      const isHealthy = Object.values(repositories).every((status) => status);

      return {
        isHealthy,
        repositories,
        errors,
      };
    } catch (error) {
      return {
        isHealthy: false,
        repositories,
        errors: [
          ...errors,
          `Health check failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
  }

  /**
   * Bulk operations across multiple repositories
   */
  static async performBulkOperations(
    db: SQLiteDatabase,
    operations: {
      customers?: {
        operation: "create" | "update" | "delete";
        data: Partial<Customer>; // Import the Customer type
        id?: string;
      }[];
      products?: {
        operation: "create" | "update" | "delete";
        data: Partial<Product>;
        id?: string;
      }[];
      transactions?: {
        operation: "create" | "update" | "delete";
        data: Partial<Transaction>;
        id?: string;
      }[];
    }
  ): Promise<{
    success: boolean;
    results: {
      customers: any[];
      products: any[];
      transactions: any[];
    };
    errors: string[];
  }> {
    const results = {
      customers: [] as any[],
      products: [] as any[],
      transactions: [] as any[],
    };
    const errors: string[] = [];

    try {
      await db.withTransactionAsync(async () => {
        const repos = this.getAllRepositories(db);

        // Helper to throw on any error for rollback
        function throwOnError(err: any, context: string) {
          throw new ValidationError(
            `${context}: ${err instanceof Error ? err.message : String(err)}`
          );
        }

        // Process customer operations
        if (operations.customers) {
          for (const op of operations.customers) {
            try {
              switch (op.operation) {
                case "create":
                  const customer =
                    await repos.customerRepository.createWithValidation(
                      op.data as Customer
                    );
                  results.customers.push(customer);
                  break;
                case "update":
                  if (!op.id)
                    throw new ValidationError("ID required for update", "id");
                  await repos.customerRepository.updateWithValidation(
                    op.id,
                    op.data
                  );
                  results.customers.push({ id: op.id, ...op.data });
                  break;
                case "delete":
                  if (!op.id)
                    throw new ValidationError("ID required for delete", "id");
                  await repos.customerRepository.delete(op.id);
                  results.customers.push({ id: op.id, deleted: true });
                  break;
              }
            } catch (error) {
              throwOnError(error, `Customer ${op.operation}`);
            }
          }
        }

        // Process product operations
        if (operations.products) {
          for (const op of operations.products) {
            try {
              switch (op.operation) {
                case "create":
                  const product =
                    await repos.productRepository.createWithValidation(
                      op.data as CreateProductInput
                    );
                  results.products.push(product);
                  break;
                case "update":
                  if (!op.id)
                    throw new ValidationError("ID required for update", "id");
                  await repos.productRepository.updateWithValidation(
                    op.id,
                    op.data
                  );
                  results.products.push({ id: op.id, ...op.data });
                  break;
                case "delete":
                  if (!op.id)
                    throw new ValidationError("ID required for delete", "id");
                  await repos.productRepository.delete(op.id);
                  results.products.push({ id: op.id, deleted: true });
                  break;
              }
            } catch (error) {
              throwOnError(error, `Product ${op.operation}`);
            }
          }
        }

        // Process transaction operations
        if (operations.transactions) {
          for (const op of operations.transactions) {
            try {
              switch (op.operation) {
                case "create":
                  const transaction =
                    await repos.transactionRepository.createWithValidation(
                      op.data as CreateTransactionInput
                    );
                  results.transactions.push(transaction);
                  break;
                case "update":
                  if (!op.id)
                    throw new ValidationError("ID required for update", "id");
                  await repos.transactionRepository.updateWithValidation(
                    op.id,
                    op.data
                  );
                  results.transactions.push({ id: op.id, ...op.data });
                  break;
                case "delete":
                  if (!op.id)
                    throw new ValidationError("ID required for delete", "id");
                  await repos.transactionRepository.delete(op.id);
                  results.transactions.push({ id: op.id, deleted: true });
                  break;
              }
            } catch (error) {
              throwOnError(error, `Transaction ${op.operation}`);
            }
          }
        }
      });

      return {
        success: true,
        results,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        results,
        errors: [
          `Bulk operation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
  }

  /**
   * Get repository statistics
   */
  static async getRepositoryStats(db: SQLiteDatabase): Promise<{
    recordCounts: {
      customers: number;
      products: number;
      transactions: number;
      storeConfigs: number;
      categories: number;
      auditLogs?: number;
    };
    cacheStats: {
      cachedInstances: number;
      instanceTypes: string[];
    };
  }> {
    try {
      const repos = this.getAllRepositories(db);

      const [
        customerCount,
        productCount,
        transactionCount,
        storeConfigCount,
        categoryCount,
        auditLogCount,
      ] = await Promise.all([
        repos.customerRepository.count(),
        repos.productRepository.count(),
        repos.transactionRepository.count(),
        repos.storeConfigRepository.count(),
        this.getCategoryCount(db),
        this.config.enableAuditLog
          ? this.getAuditLogCount(db)
          : Promise.resolve(0),
      ]);

      const recordCounts: any = {
        customers: customerCount,
        products: productCount,
        transactions: transactionCount,
        storeConfigs: storeConfigCount,
        categories: categoryCount,
      };

      if (this.config.enableAuditLog) {
        recordCounts.auditLogs = auditLogCount;
      }

      return {
        recordCounts,
        cacheStats: {
          cachedInstances: this.instances.size,
          instanceTypes: Array.from(this.instances.keys()).map(
            (key) => key.split("_")[0]
          ),
        },
      };
    } catch (error) {
      throw new DatabaseError("getRepositoryStats", error as Error);
    }
  }

  private static async getCategoryCount(db: SQLiteDatabase): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM product_categories"
      );
      return result?.count || 0;
    } catch {
      return 0;
    }
  }

  private static async getAuditLogCount(db: SQLiteDatabase): Promise<number> {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM audit_log"
      );
      return result?.count || 0;
    } catch {
      return 0;
    }
  }

  // /**
  //  * Generate a simple key for database instance identification
  //  */
  // private static getDbKey(db: SQLiteDatabase): string {
  //   // Simple hash based on database object reference
  //   // In production, you might use database file path or connection string
  //   return Math.abs(
  //     db.toString().split('').reduce((a, b) => {
  //       a = ((a << 5) - a) + b.charCodeAt(0);
  //       return a & a;
  //     }, 0)
  //   ).toString(36);
  // }
}

// Factory convenience functions
export function createRepositoryFactory(
  config?: Partial<RepositoryConfig>
): typeof EnhancedRepositoryFactory {
  if (config) {
    EnhancedRepositoryFactory.configure(config);
  }
  return EnhancedRepositoryFactory;
}

export function getRepositories(db: SQLiteDatabase) {
  return EnhancedRepositoryFactory.getAllRepositories(db);
}

// Export types for consumers
export { EnhancedRepositoryFactory as RepositoryFactory };
export type { RepositoryConfig };
