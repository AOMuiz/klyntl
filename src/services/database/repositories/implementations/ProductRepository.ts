import { Product, ProductFilters, ProductSortOptions } from "@/types/product";
// import * as Crypto from "expo-crypto";
import { SQLiteDatabase } from "expo-sqlite";
import { DatabaseError } from "../../service";
import { IProductRepository } from "../interfaces/IProductRepository";
import { BaseRepository } from "./BaseRepository";

export class ProductRepository
  extends BaseRepository<Product>
  implements IProductRepository
{
  constructor(db: SQLiteDatabase) {
    super(db, "products");
  }

  protected mapToEntity(record: any): Product {
    return {
      id: record.id,
      name: record.name,
      description: record.description || undefined,
      price: record.price,
      costPrice: record.costPrice,
      sku: record.sku || undefined,
      category: record.category || undefined,
      imageUrl: record.imageUrl || undefined,
      stockQuantity: record.stockQuantity,
      lowStockThreshold: record.lowStockThreshold,
      isActive: Boolean(record.isActive),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  protected getCreateQuery(): string {
    return `
      INSERT INTO products (
        id, name, description, price, costPrice, sku, category,
        imageUrl, stockQuantity, lowStockThreshold, isActive,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  }

  protected getUpdateQuery(): string {
    return `
      UPDATE products SET
        name = ?, description = ?, price = ?, costPrice = ?,
        sku = ?, category = ?, imageUrl = ?, stockQuantity = ?,
        lowStockThreshold = ?, isActive = ?, updatedAt = ?
      WHERE id = ?
    `;
  }

  protected getCreateParams(product: Omit<Product, "id">): any[] {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    return [
      id,
      product.name,
      product.description || null,
      product.price,
      product.costPrice,
      product.sku || null,
      product.category || null,
      product.imageUrl || null,
      product.stockQuantity || 0,
      product.lowStockThreshold || 5,
      product.isActive !== false ? 1 : 0,
      now,
      now,
    ];
  }

  protected getUpdateParams(product: Partial<Product>): any[] {
    const params = [
      product.name,
      product.description || null,
      product.price,
      product.costPrice,
      product.sku || null,
      product.category || null,
      product.imageUrl || null,
      product.stockQuantity,
      product.lowStockThreshold,
      product.isActive !== false ? 1 : 0,
      new Date().toISOString(),
    ];

    return params;
  }

  async findBySku(sku: string): Promise<Product | null> {
    try {
      const query = "SELECT * FROM products WHERE sku = ? LIMIT 1";
      const result = await this.db.getFirstAsync(query, [sku]);

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new DatabaseError(
        "findBySku",
        error instanceof Error ? error : new Error(String(error))
      );
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
      let query = "SELECT * FROM products WHERE 1=1";
      const params: any[] = [];

      if (searchQuery) {
        query += " AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)";
        const searchPattern = `%${searchQuery}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (filters) {
        if (filters.category) {
          query += " AND category = ?";
          params.push(filters.category);
        }

        if (filters.priceRange) {
          if (filters.priceRange.min !== undefined) {
            query += " AND price >= ?";
            params.push(filters.priceRange.min);
          }
          if (filters.priceRange.max !== undefined) {
            query += " AND price <= ?";
            params.push(filters.priceRange.max);
          }
        }

        if (filters.stockStatus && filters.stockStatus !== "all") {
          switch (filters.stockStatus) {
            case "in_stock":
              query += " AND stockQuantity > lowStockThreshold";
              break;
            case "low_stock":
              query +=
                " AND stockQuantity > 0 AND stockQuantity <= lowStockThreshold";
              break;
            case "out_of_stock":
              query += " AND stockQuantity = 0";
              break;
          }
        }

        if (filters.isActive !== undefined) {
          query += " AND isActive = ?";
          params.push(filters.isActive ? 1 : 0);
        }
      }

      if (sort) {
        const direction = sort.direction === "desc" ? "DESC" : "ASC";
        query += ` ORDER BY ${sort.field} ${direction}`;
      } else {
        query += " ORDER BY name ASC";
      }

      query += " LIMIT ? OFFSET ?";
      params.push(pageSize, page * pageSize);

      const results = await this.db.getAllAsync(query, params);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError(
        "findWithFilters",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getCount(
    searchQuery?: string,
    filters?: ProductFilters
  ): Promise<number> {
    try {
      let query = "SELECT COUNT(*) as count FROM products WHERE 1=1";
      const params: any[] = [];

      if (searchQuery) {
        query += " AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)";
        const searchPattern = `%${searchQuery}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (filters) {
        if (filters.category) {
          query += " AND category = ?";
          params.push(filters.category);
        }

        if (filters.priceRange) {
          if (filters.priceRange.min !== undefined) {
            query += " AND price >= ?";
            params.push(filters.priceRange.min);
          }
          if (filters.priceRange.max !== undefined) {
            query += " AND price <= ?";
            params.push(filters.priceRange.max);
          }
        }

        if (filters.stockStatus && filters.stockStatus !== "all") {
          switch (filters.stockStatus) {
            case "in_stock":
              query += " AND stockQuantity > lowStockThreshold";
              break;
            case "low_stock":
              query +=
                " AND stockQuantity > 0 AND stockQuantity <= lowStockThreshold";
              break;
            case "out_of_stock":
              query += " AND stockQuantity = 0";
              break;
          }
        }

        if (filters.isActive !== undefined) {
          query += " AND isActive = ?";
          params.push(filters.isActive ? 1 : 0);
        }
      }

      const result = await this.db.getFirstAsync<{ count: number }>(
        query,
        params
      );
      return result?.count || 0;
    } catch (error) {
      throw new DatabaseError(
        "getCount",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    try {
      const query = `
        UPDATE products
        SET stockQuantity = stockQuantity + ?,
            updatedAt = ?
        WHERE id = ?
      `;

      await this.db.runAsync(query, [
        quantity,
        new Date().toISOString(),
        productId,
      ]);
    } catch (error) {
      throw new DatabaseError(
        "updateStock",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getLowStockProducts(): Promise<Product[]> {
    try {
      const query = `
        SELECT * FROM products 
        WHERE stockQuantity <= lowStockThreshold 
          AND stockQuantity > 0 
          AND isActive = 1
        ORDER BY (stockQuantity * 1.0 / lowStockThreshold) ASC
      `;

      const results = await this.db.getAllAsync(query);
      return results.map((record) => this.mapToEntity(record));
    } catch (error) {
      throw new DatabaseError(
        "getLowStockProducts",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
