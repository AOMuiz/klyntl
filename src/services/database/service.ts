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

interface FilterQueryParts {
  whereClause: string;
  params: any[];
}

/**
 * Modern database service using the new Expo SQLite API
 * This service assumes the database is already initialized via the provider
 */
export class DatabaseService {
  constructor(private db: SQLiteDatabase) {}

  // Helper method to build filter query parts
  private buildFilterQuery(filters: CustomerFilters): FilterQueryParts {
    const conditions: string[] = [];
    const params: any[] = [];

    // Customer type filter (business vs individual)
    if (filters.customerType && filters.customerType !== "all") {
      if (filters.customerType === "business") {
        conditions.push("company IS NOT NULL AND company != ''");
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
        conditions.push("id IN (SELECT DISTINCT customerId FROM transactions)");
      } else {
        conditions.push(
          "id NOT IN (SELECT DISTINCT customerId FROM transactions)"
        );
      }
    }

    // Active customer filter (based on recent purchases)
    if (filters.isActive !== undefined) {
      const sixtyDaysAgo = new Date(
        Date.now() - 60 * 24 * 60 * 60 * 1000
      ).toISOString();
      if (filters.isActive) {
        conditions.push("lastPurchase >= ?");
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
        return `ORDER BY lastPurchase ${direction}`;
      case "lastContactDate":
        return `ORDER BY lastContactDate ${direction}`;
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

  // CRUD Operations for Customers
  async createCustomer(customerData: CreateCustomerInput): Promise<Customer> {
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
          customer.email || null,
          customer.address || null,
          customer.company || null,
          customer.jobTitle || null,
          customer.birthday || null,
          customer.notes || null,
          customer.nickname || null,
          customer.photoUri || null,
          customer.contactSource || "manual",
          customer.lastContactDate || null,
          customer.preferredContactMethod || null,
          customer.totalSpent,
          customer.lastPurchase || null,
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

  async getCustomersWithFilters(
    searchQuery?: string,
    filters?: CustomerFilters,
    sort?: SortOptions,
    page?: number,
    pageSize?: number
  ): Promise<Customer[]> {
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

      // Add pagination
      if (page != null && pageSize != null && pageSize > 0) {
        const offset = page * pageSize;
        baseSql += ` LIMIT ? OFFSET ?`;
        allParams.push(pageSize, offset);
      }

      const results = await this.db.getAllAsync<any>(baseSql, allParams);

      // Augment results with computed fields
      return results.map((result) => this.augmentCustomerData(result));
    } catch (error) {
      console.error("Failed to get customers with filters:", error);
      throw error;
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
      let baseSql = "SELECT COUNT(*) as count FROM customers";
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
          const filterConditions = whereClause.replace("WHERE ", "");
          allConditions.push(filterConditions);
          allParams.push(...params);
        }
      }

      // Combine all conditions
      if (allConditions.length > 0) {
        baseSql += ` WHERE ${allConditions.join(" AND ")}`;
      }

      const result = await this.db.getFirstAsync<{ count: number }>(
        baseSql,
        allParams
      );
      return result?.count || 0;
    } catch (error) {
      console.error("Failed to get customers count:", error);
      throw error;
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM customers WHERE id = ?",
        [id]
      );
      return result ? this.augmentCustomerData(result) : null;
    } catch (error) {
      console.error("Failed to get customer by id:", error);
      throw error;
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM customers WHERE phone = ?",
        [phone]
      );
      return result ? this.augmentCustomerData(result) : null;
    } catch (error) {
      console.error("Failed to get customer by phone:", error);
      throw error;
    }
  }

  async updateCustomer(
    id: string,
    updates: UpdateCustomerInput
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const fields = Object.keys(updates).filter((key) => key !== "id");
      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => (updates as any)[field]);

      await this.db.runAsync(
        `UPDATE customers SET ${setClause}, updatedAt = ? WHERE id = ?`,
        [...values, now, id]
      );

      // Update customer totals if needed
      await this.updateCustomerTotals(id);
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await this.db.withTransactionAsync(async () => {
        // Delete associated transactions first (if not using CASCADE)
        await this.db.runAsync(
          "DELETE FROM transactions WHERE customerId = ?",
          [id]
        );

        // Delete the customer
        await this.db.runAsync("DELETE FROM customers WHERE id = ?", [id]);
      });
    } catch (error) {
      console.error("Failed to delete customer:", error);
      throw error;
    }
  }

  // CRUD Operations for Transactions
  async createTransaction(
    transactionData: CreateTransactionInput
  ): Promise<Transaction> {
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
      await this.db.withTransactionAsync(async () => {
        // Insert the transaction
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

        // Update customer totals
        await this.updateCustomerTotals(transaction.customerId);
      });

      return transaction;
    } catch (error) {
      console.error("Failed to create transaction:", error);
      throw error;
    }
  }

  async getTransactionsByCustomer(customerId: string): Promise<Transaction[]> {
    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE customerId = ? ORDER BY date DESC",
        [customerId]
      );
    } catch (error) {
      console.error("Failed to get transactions by customer:", error);
      throw error;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await this.db.getAllAsync<Transaction>(
        "SELECT * FROM transactions ORDER BY date DESC"
      );
    } catch (error) {
      console.error("Failed to get all transactions:", error);
      throw error;
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      return await this.db.getFirstAsync<Transaction>(
        "SELECT * FROM transactions WHERE id = ?",
        [id]
      );
    } catch (error) {
      console.error("Failed to get transaction by id:", error);
      throw error;
    }
  }

  async updateTransaction(
    id: string,
    updates: UpdateTransactionInput
  ): Promise<void> {
    try {
      const fields = Object.keys(updates).filter((key) => key !== "id");
      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => (updates as any)[field]);

      await this.db.withTransactionAsync(async () => {
        // Get the current transaction to find the customer
        const currentTransaction = await this.db.getFirstAsync<Transaction>(
          "SELECT customerId FROM transactions WHERE id = ?",
          [id]
        );

        if (!currentTransaction) {
          throw new Error("Transaction not found");
        }

        // Update the transaction
        await this.db.runAsync(
          `UPDATE transactions SET ${setClause} WHERE id = ?`,
          [...values, id]
        );

        // Update customer totals
        await this.updateCustomerTotals(currentTransaction.customerId);
      });
    } catch (error) {
      console.error("Failed to update transaction:", error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await this.db.withTransactionAsync(async () => {
        // Get the transaction to find the customer
        const transaction = await this.db.getFirstAsync<Transaction>(
          "SELECT customerId FROM transactions WHERE id = ?",
          [id]
        );

        if (!transaction) {
          throw new Error("Transaction not found");
        }

        // Delete the transaction
        await this.db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);

        // Update customer totals
        await this.updateCustomerTotals(transaction.customerId);
      });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      throw error;
    }
  }

  // Helper method to update customer totals
  private async updateCustomerTotals(customerId: string): Promise<void> {
    try {
      const totals = await this.db.getFirstAsync<{
        totalSpent: number;
        lastPurchase: string;
      }>(
        `SELECT 
          COALESCE(SUM(amount), 0) as totalSpent,
          MAX(date) as lastPurchase
        FROM transactions 
        WHERE customerId = ? AND type = 'sale'`,
        [customerId]
      );

      await this.db.runAsync(
        `UPDATE customers 
         SET totalSpent = ?, lastPurchase = ?, updatedAt = ?
         WHERE id = ?`,
        [
          totals?.totalSpent || 0,
          totals?.lastPurchase || null,
          new Date().toISOString(),
          customerId,
        ]
      );
    } catch (error) {
      console.error("Failed to update customer totals:", error);
      throw error;
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
      console.error("Failed to get analytics:", error);
      throw error;
    }
  }

  // Helper method to build product filter query parts
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
      if (filters.searchQuery && filters.searchQuery.trim()) {
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
      lowStockThreshold: productData.lowStockThreshold || 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
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
        ]
      );

      return product;
    } catch (error) {
      console.error("Failed to create product:", error);
      throw error;
    }
  }

  async getProducts(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page?: number,
    pageSize?: number
  ): Promise<Product[]> {
    try {
      let baseSql = "SELECT * FROM products";

      // Apply filters
      const { sql: filterSql, params } = this.buildProductFilters(filters);
      baseSql += filterSql;

      // Add sorting
      if (sort) {
        const direction = sort.direction.toUpperCase();
        switch (sort.field) {
          case "name":
            baseSql += ` ORDER BY name ${direction}`;
            break;
          case "price":
            baseSql += ` ORDER BY price ${direction}`;
            break;
          case "stockQuantity":
            baseSql += ` ORDER BY stockQuantity ${direction}`;
            break;
          case "createdAt":
            baseSql += ` ORDER BY createdAt ${direction}`;
            break;
          case "updatedAt":
            baseSql += ` ORDER BY updatedAt ${direction}`;
            break;
          default:
            baseSql += " ORDER BY name ASC";
        }
      } else {
        baseSql += " ORDER BY name ASC";
      }

      // Add pagination
      if (page != null && pageSize != null && pageSize > 0) {
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
      console.error("Failed to get products:", error);
      throw error;
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
      console.error("Failed to get products count:", error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
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
      console.error("Failed to get product by id:", error);
      throw error;
    }
  }

  async getProductBySku(sku: string): Promise<Product | null> {
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
      console.error("Failed to get product by SKU:", error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: UpdateProductInput): Promise<void> {
    try {
      const now = new Date().toISOString();
      const fields = Object.keys(updates).filter((key) => key !== "id");
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
    } catch (error) {
      console.error("Failed to update product:", error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.db.runAsync("DELETE FROM products WHERE id = ?", [id]);
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw error;
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
      console.error("Failed to get low stock products:", error);
      throw error;
    }
  }

  // Product Categories CRUD
  async createCategory(
    categoryData: CreateCategoryInput
  ): Promise<ProductCategory> {
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

    try {
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

      return category;
    } catch (error) {
      console.error("Failed to create category:", error);
      throw error;
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
      console.error("Failed to get categories:", error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<ProductCategory | null> {
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
      console.error("Failed to get category by id:", error);
      throw error;
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
      console.error("Failed to get store config:", error);
      throw error;
    }
  }

  async updateStoreConfig(updates: UpdateStoreConfigInput): Promise<void> {
    try {
      const now = new Date().toISOString();
      const fields = Object.keys(updates);
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
    } catch (error) {
      console.error("Failed to update store config:", error);
      throw error;
    }
  }

  // Database utility methods
  async clearAllData(): Promise<void> {
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync("DELETE FROM transactions");
        await this.db.runAsync("DELETE FROM customers");
      });
    } catch (error) {
      console.error("Failed to clear all data:", error);
      throw error;
    }
  }
}

/**
 * Factory function to create a database service instance
 * Use this with the useDatabase hook
 */
export function createDatabaseService(db: SQLiteDatabase): DatabaseService {
  return new DatabaseService(db);
}
