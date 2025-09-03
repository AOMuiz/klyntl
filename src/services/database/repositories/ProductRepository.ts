import {
  CreateProductInput,
  Product,
  ProductFilters,
  ProductSortOptions,
  UpdateProductInput,
} from "@/types/product";
import { generateId } from "@/utils/helpers";
import { SQLiteDatabase } from "expo-sqlite";
import { AuditLogService } from "../service/AuditLogService";
import { QueryBuilderService } from "../service/QueryBuilderService";
import {
  DatabaseError,
  DuplicateError,
  NotFoundError,
  ValidationError,
} from "../service/utilService";
import { ValidationService } from "../service/ValidationService";
import { DatabaseConfig } from "../types";

// ===== PRODUCT REPOSITORY =====
export class ProductRepository {
  constructor(
    private db: SQLiteDatabase,
    private config: DatabaseConfig,
    private auditService: AuditLogService,
    private queryBuilder: QueryBuilderService
  ) {}

  async create(productData: CreateProductInput): Promise<Product> {
    ValidationService.validateProductInput(productData);

    try {
      // Check for duplicate SKU if provided
      if (productData.sku) {
        const existingProduct = await this.getBySku(productData.sku);
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
        ].map((value) => value ?? null)
      );

      await this.auditService.logEntry({
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
      throw new DatabaseError("create", error as Error);
    }
  }

  async findWithFilters(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page: number = 0,
    pageSize: number = this.config.defaultPageSize
  ): Promise<Product[]> {
    try {
      let sql = "SELECT * FROM products";
      const params: any[] = [];
      const conditions: string[] = [];

      if (filters) {
        const { sql: filterSql, params: filterParams } =
          this.queryBuilder.buildProductFilterQuery(filters);
        if (filterSql) {
          const filterConditions = filterSql.replace(" WHERE ", "");
          conditions.push(`(${filterConditions})`);
          params.push(...filterParams);
        }
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      const validSortFields = [
        "name",
        "price",
        "stockQuantity",
        "createdAt",
        "updatedAt",
      ];
      sql += ` ${this.buildProductSortClause(sort, validSortFields)}`;

      if (pageSize > 0) {
        const offset = page * pageSize;
        sql += ` LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);
      }

      const results = await this.db.getAllAsync<any>(sql, params);
      return results.map((result) => this.augmentProductData(result));
    } catch (error) {
      throw new DatabaseError("findWithFilters", error as Error);
    }
  }

  async count(filters?: ProductFilters): Promise<number> {
    try {
      let sql = "SELECT COUNT(*) as count FROM products";
      const params: any[] = [];

      if (filters) {
        const { sql: filterSql, params: filterParams } =
          this.queryBuilder.buildProductFilterQuery(filters);
        sql += filterSql;
        params.push(...filterParams);
      }

      const result = await this.db.getFirstAsync<{ count: number }>(
        sql,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new DatabaseError("count", error as Error);
    }
  }

  async findById(id: string): Promise<Product | null> {
    if (!id?.trim()) {
      throw new ValidationError("Product ID is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );
      return result ? this.augmentProductData(result) : null;
    } catch (error) {
      throw new DatabaseError("findById", error as Error);
    }
  }

  async getBySku(sku: string): Promise<Product | null> {
    if (!sku?.trim()) {
      throw new ValidationError("SKU is required");
    }

    try {
      const result = await this.db.getFirstAsync<any>(
        "SELECT * FROM products WHERE sku = ?",
        [sku]
      );
      return result ? this.augmentProductData(result) : null;
    } catch (error) {
      throw new DatabaseError("getBySku", error as Error);
    }
  }

  async update(id: string, updates: UpdateProductInput): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Product ID is required");
    }

    ValidationService.validateProductInput(updates);

    try {
      const currentProduct = await this.findById(id);
      if (!currentProduct) {
        throw new NotFoundError("Product", id);
      }

      // Check for duplicate SKU if SKU is being updated
      if (updates.sku && updates.sku !== currentProduct.sku) {
        const existingProduct = await this.getBySku(updates.sku);
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

      await this.auditService.logEntry({
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
      throw new DatabaseError("update", error as Error);
    }
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new ValidationError("Product ID is required");
    }

    try {
      const product = await this.findById(id);
      if (!product) {
        throw new NotFoundError("Product", id);
      }

      await this.db.runAsync("DELETE FROM products WHERE id = ?", [id]);

      await this.auditService.logEntry({
        tableName: "products",
        operation: "DELETE",
        recordId: id,
        oldValues: product,
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError("delete", error as Error);
    }
  }

  async getLowStockProducts(): Promise<Product[]> {
    try {
      const results = await this.db.getAllAsync<any>(
        "SELECT * FROM products WHERE stockQuantity <= lowStockThreshold AND isActive = 1 ORDER BY stockQuantity ASC"
      );

      return results.map((result) => this.augmentProductData(result));
    } catch (error) {
      throw new DatabaseError("getLowStockProducts", error as Error);
    }
  }

  private augmentProductData(product: any): Product {
    return {
      ...product,
      isActive: product.isActive === 1,
    };
  }

  private buildProductSortClause(
    sort?: ProductSortOptions,
    validFields: string[] = ["name"]
  ): string {
    if (!sort) return `ORDER BY ${validFields[0]} ASC`;

    if (!validFields.includes(sort.field)) {
      console.warn(
        `Invalid sort field: ${sort.field}, defaulting to ${validFields[0]}`
      );
      return `ORDER BY ${validFields[0]} ASC`;
    }

    const direction = sort.direction.toUpperCase() === "DESC" ? "DESC" : "ASC";
    return `ORDER BY ${sort.field} ${direction}`;
  }
}
