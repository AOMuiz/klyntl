// Enhanced ProductRepository Implementation
import {
  CreateProductInput,
  Product,
  ProductFilters,
  ProductSortOptions,
  UpdateProductInput,
} from "@/types/product";
import { SQLiteDatabase } from "expo-sqlite";
import {
  BusinessRuleError,
  DatabaseError,
  DuplicateError,
  NotFoundError,
  ValidationError,
} from "../../service/utilService";
import { IProductRepository } from "../interfaces/IProductRepository";
import { BaseRepository } from "./BaseRepository";

// Enhanced TransactionRepository Implementation
import { ValidationService } from "../../service/ValidationService";

export class ProductRepository
  extends BaseRepository<Product>
  implements IProductRepository
{
  private validationService: ValidationService;

  constructor(db: SQLiteDatabase, config?: any) {
    super(db, "products", config);
    this.validationService = new ValidationService(db);
  }

  protected mapToEntity(record: any): Product {
    return {
      id: record.id,
      name: record.name,
      description: record.description || undefined,
      price: record.price,
      costPrice: record.costPrice || 0,
      sku: record.sku || undefined,
      category: record.category || undefined,
      imageUrl: record.imageUrl || undefined,
      stockQuantity: record.stockQuantity || 0,
      lowStockThreshold: record.lowStockThreshold || 5,
      isActive: record.isActive === 1,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected generateId(): string {
    return `prod_${crypto.randomUUID()}`;
  }

  protected async validateCreateData(
    entity: Omit<Product, "id">
  ): Promise<void> {
    await this.validationService.validateProduct(entity as CreateProductInput);

    // Check for duplicate SKU
    if (entity.sku) {
      const existing = await this.findBySku(entity.sku);
      if (existing) {
        throw new DuplicateError("sku", entity.sku);
      }
    }
  }

  protected async validateUpdateData(
    id: string,
    entity: Partial<Product>
  ): Promise<void> {
    // Check for SKU uniqueness if SKU is being updated
    if (entity.sku) {
      const existing = await this.findBySku(entity.sku);
      if (existing && existing.id !== id) {
        throw new DuplicateError("sku", entity.sku);
      }
    }
    await this.validationService.validateProduct(entity as UpdateProductInput);
  }

  protected getCreateQuery(): string {
    return `
      INSERT INTO products (
        id, name, description, price, costPrice, sku, category,
        imageUrl, stockQuantity, lowStockThreshold, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  }

  protected getUpdateQuery(): string {
    return `
      UPDATE products SET
        name = ?, description = ?, price = ?, costPrice = ?, sku = ?,
        category = ?, imageUrl = ?, stockQuantity = ?, lowStockThreshold = ?,
        isActive = ?, updatedAt = ?
      WHERE id = ?
    `;
  }

  protected getCreateParams(product: Omit<Product, "id">): any[] {
    const now = new Date().toISOString();
    const id = this.generateId();

    return [
      id,
      product.name,
      product.description ?? null,
      product.price,
      product.costPrice || 0,
      product.sku ?? null,
      product.category ?? null,
      product.imageUrl ?? null,
      product.stockQuantity || 0,
      product.lowStockThreshold || 5,
      product.isActive ? 1 : 0,
      now,
      now,
    ];
  }

  protected getUpdateParams(product: Partial<Product>): any[] {
    return [
      product.name,
      product.description ?? null,
      product.price,
      product.costPrice,
      product.sku ?? null,
      product.category ?? null,
      product.imageUrl ?? null,
      product.stockQuantity,
      product.lowStockThreshold,
      product.isActive ? 1 : 0,
      new Date().toISOString(),
    ];
  }

  // Existing interface methods
  async findBySku(sku: string): Promise<Product | null> {
    if (!sku?.trim()) {
      throw new ValidationError("SKU is required", "sku");
    }

    try {
      const result = await this.db.getFirstAsync(
        "SELECT * FROM products WHERE sku = ? LIMIT 1",
        [sku]
      );
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new DatabaseError("findBySku", error as Error);
    }
  }

  async findWithFilters(
    searchQuery?: string,
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page: number = 0,
    pageSize: number = 20
  ): Promise<Product[]> {
    try {
      const { sql: whereClause, params } = this.buildProductFilters(
        searchQuery,
        filters
      );
      const orderClause = this.buildOrderClause(
        sort?.field,
        sort?.direction,
        ["name", "price", "stockQuantity", "createdAt", "updatedAt"],
        "name ASC"
      );
      const { sql: paginationClause, params: paginationParams } =
        this.buildPaginationClause(page, pageSize);

      const query = `SELECT * FROM products${whereClause}${orderClause}${paginationClause}`;
      const results = await this.db.getAllAsync(query, [
        ...params,
        ...paginationParams,
      ]);

      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("findWithFilters", error as Error);
    }
  }

  async getCount(
    searchQuery?: string,
    filters?: ProductFilters
  ): Promise<number> {
    try {
      const { sql: whereClause, params } = this.buildProductFilters(
        searchQuery,
        filters
      );
      const query = `SELECT COUNT(*) as count FROM products${whereClause}`;

      const result = await this.db.getFirstAsync<{ count: number }>(
        query,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new DatabaseError("getCount", error as Error);
    }
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    if (quantity < 0) {
      throw new ValidationError(
        "Stock quantity cannot be negative",
        "quantity"
      );
    }

    try {
      await this.update(productId, {
        stockQuantity: quantity,
        updatedAt: new Date().toISOString(),
      } as Partial<Product>);
    } catch (error) {
      throw new DatabaseError("updateStock", error as Error);
    }
  }

  async getLowStockProducts(): Promise<Product[]> {
    try {
      const query = `
        SELECT * FROM products 
        WHERE stockQuantity <= lowStockThreshold 
        AND stockQuantity > 0 
        AND isActive = 1 
        ORDER BY stockQuantity ASC
      `;

      const results = await this.db.getAllAsync(query);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("getLowStockProducts", error as Error);
    }
  }

  // New validation methods
  async validateCreate(data: CreateProductInput): Promise<void> {
    await this.validationService.validateProduct(data);
  }

  async validateUpdate(id: string, data: UpdateProductInput): Promise<void> {
    if (!(await this.exists(id))) {
      throw new NotFoundError("Product", id);
    }
    await this.validateUpdateData(id, data as Partial<Product>);
  }

  async createWithValidation(data: CreateProductInput): Promise<Product> {
    await this.validateCreate(data);
    return this.create(data as Omit<Product, "id">);
  }

  async updateWithValidation(
    id: string,
    data: UpdateProductInput
  ): Promise<void> {
    await this.validateUpdate(id, data);
    return this.update(id, data as Partial<Product>);
  }

  // Enhanced stock management
  async adjustStock(
    productId: string,
    adjustment: number,
    reason: string
  ): Promise<void> {
    if (!reason?.trim()) {
      throw new ValidationError("Adjustment reason is required", "reason");
    }

    try {
      const product = await this.findById(productId);
      if (!product) {
        throw new NotFoundError("Product", productId);
      }

      const newQuantity = product.stockQuantity + adjustment;
      if (newQuantity < 0) {
        throw new BusinessRuleError(
          "Stock adjustment would result in negative stock",
          "negative_stock_adjustment",
          { currentStock: product.stockQuantity, adjustment }
        );
      }

      await this.db.withTransactionAsync(async () => {
        await this.updateStock(productId, newQuantity);

        // Log stock adjustment in audit
        await this.logAudit("UPDATE", productId, product, {
          ...product,
          stockQuantity: newQuantity,
          stockAdjustment: {
            adjustment,
            reason,
            previousQuantity: product.stockQuantity,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof BusinessRuleError
      ) {
        throw error;
      }
      throw new DatabaseError("adjustStock", error as Error);
    }
  }

  async setStock(productId: string, quantity: number): Promise<void> {
    await this.updateStock(productId, quantity);
  }

  async getStockHistory(productId: string): Promise<
    {
      date: string;
      previousQuantity: number;
      newQuantity: number;
      adjustment: number;
      reason: string;
    }[]
  > {
    // This would require a more sophisticated audit log structure
    // For now, return empty array - implement based on actual audit log schema
    return [];
  }

  // Business logic methods
  async getOutOfStockProducts(): Promise<Product[]> {
    try {
      const query =
        "SELECT * FROM products WHERE stockQuantity = 0 AND isActive = 1 ORDER BY name ASC";
      const results = await this.db.getAllAsync(query);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("getOutOfStockProducts", error as Error);
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    if (!category?.trim()) {
      throw new ValidationError("Category is required", "category");
    }

    try {
      const query =
        "SELECT * FROM products WHERE category = ? AND isActive = 1 ORDER BY name ASC";
      const results = await this.db.getAllAsync(query, [category]);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("getProductsByCategory", error as Error);
    }
  }

  async searchProducts(
    searchQuery: string,
    limit: number = 50
  ): Promise<Product[]> {
    if (!searchQuery?.trim()) {
      return [];
    }

    try {
      const searchPattern = `%${searchQuery.trim()}%`;
      const query = `
        SELECT * FROM products 
        WHERE (name LIKE ? OR description LIKE ? OR sku LIKE ?) AND isActive = 1
        ORDER BY 
          CASE 
            WHEN name LIKE ? THEN 1
            WHEN sku = ? THEN 2
            WHEN sku LIKE ? THEN 3
            ELSE 4
          END,
          name ASC
        LIMIT ?
      `;

      const results = await this.db.getAllAsync(query, [
        searchPattern,
        searchPattern,
        searchPattern,
        `${searchQuery.trim()}%`,
        searchQuery.trim(),
        `${searchQuery.trim()}%`,
        limit,
      ]);

      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError("searchProducts", error as Error);
    }
  }

  async getProductStats(id: string): Promise<{
    totalSold: number;
    revenue: number;
    averageSellingPrice: number;
    stockTurnover: number;
  }> {
    try {
      // This would need transaction_items table for real implementation
      // For now, return default values
      const product = await this.findById(id);
      if (!product) {
        throw new NotFoundError("Product", id);
      }

      return {
        totalSold: 0, // Would calculate from transaction_items
        revenue: 0, // Would calculate from transaction_items
        averageSellingPrice: product.price,
        stockTurnover: 0, // Would calculate based on sales data
      };
    } catch (error) {
      throw new DatabaseError("getProductStats", error as Error);
    }
  }

  // Category management
  async createCategory(
    name: string,
    description?: string,
    parentId?: string
  ): Promise<void> {
    if (!name?.trim()) {
      throw new ValidationError("Category name is required", "name");
    }

    try {
      const id = `cat_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      await this.db.runAsync(
        `INSERT INTO product_categories (id, name, description, parentId, isActive, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, description ?? null, parentId ?? null, 1, now]
      );

      await this.logAudit("CREATE", id, undefined, {
        id,
        name,
        description,
        parentId,
      });
    } catch (error) {
      throw new DatabaseError("createCategory", error as Error);
    }
  }

  async getCategories(): Promise<
    { id: string; name: string; description?: string; parentId?: string }[]
  > {
    try {
      const results = await this.db.getAllAsync<any>(
        "SELECT id, name, description, parentId FROM product_categories WHERE isActive = 1 ORDER BY name ASC"
      );

      return results.map((result) => ({
        id: result.id,
        name: result.name,
        description: result.description || undefined,
        parentId: result.parentId || undefined,
      }));
    } catch (error) {
      throw new DatabaseError("getCategories", error as Error);
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    if (!categoryId?.trim()) {
      throw new ValidationError("Category ID is required", "categoryId");
    }

    try {
      await this.db.withTransactionAsync(async () => {
        // Check if category exists
        const category = await this.db.getFirstAsync(
          "SELECT * FROM product_categories WHERE id = ?",
          [categoryId]
        );

        if (!category) {
          throw new NotFoundError("Category", categoryId);
        }

        // Check if any products use this category
        const productCount = await this.db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM products WHERE category = ? AND isActive = 1",
          [categoryId]
        );

        if (productCount && productCount.count > 0) {
          throw new BusinessRuleError(
            "Cannot delete category with associated products",
            "category_has_products",
            { categoryId, productCount: productCount.count }
          );
        }

        // Soft delete
        await this.db.runAsync(
          "UPDATE product_categories SET isActive = 0 WHERE id = ?",
          [categoryId]
        );

        await this.logAudit("DELETE", categoryId, category, undefined);
      });
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof BusinessRuleError
      ) {
        throw error;
      }
      throw new DatabaseError("deleteCategory", error as Error);
    }
  }

  private buildProductFilters(
    searchQuery?: string,
    filters?: ProductFilters
  ): { sql: string; params: any[] } {
    const conditions: { field: string; operator: string; value: any }[] = [];

    if (filters) {
      if (filters.category && filters.category !== "all") {
        conditions.push({
          field: "category",
          operator: "=",
          value: filters.category,
        });
      }

      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          conditions.push({
            field: "price",
            operator: ">=",
            value: filters.priceRange.min,
          });
        }
        if (filters.priceRange.max !== undefined) {
          conditions.push({
            field: "price",
            operator: "<=",
            value: filters.priceRange.max,
          });
        }
      }

      if (filters.stockStatus && filters.stockStatus !== "all") {
        switch (filters.stockStatus) {
          case "in_stock":
            conditions.push({
              field: "stockQuantity",
              operator: ">",
              value: 0,
            });
            break;
          case "low_stock":
            conditions.push({
              field: "stockQuantity",
              operator: "<=",
              value: "lowStockThreshold",
            });
            conditions.push({
              field: "stockQuantity",
              operator: ">",
              value: 0,
            });
            break;
          case "out_of_stock":
            conditions.push({
              field: "stockQuantity",
              operator: "=",
              value: 0,
            });
            break;
        }
      }

      if (filters.isActive !== undefined) {
        conditions.push({
          field: "isActive",
          operator: "=",
          value: filters.isActive ? 1 : 0,
        });
      }
    }

    return this.buildWhereClause(
      conditions,
      ["name", "description", "sku"],
      searchQuery
    );
  }
}
