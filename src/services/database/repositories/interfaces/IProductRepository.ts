// Enhanced IProductRepository
import {
  CreateProductInput,
  Product,
  ProductFilters,
  ProductSortOptions,
  UpdateProductInput,
} from "@/types/product";
import { IBaseRepository } from "./IBaseRepository";

export interface IProductRepository extends IBaseRepository<Product> {
  // Existing methods
  findBySku(sku: string): Promise<Product | null>;
  findWithFilters(
    searchQuery?: string,
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page?: number,
    pageSize?: number
  ): Promise<Product[]>;
  getCount(searchQuery?: string, filters?: ProductFilters): Promise<number>;
  updateStock(productId: string, quantity: number): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;

  // New validation methods
  validateCreate(data: CreateProductInput): Promise<void>;
  validateUpdate(id: string, data: UpdateProductInput): Promise<void>;
  createWithValidation(data: CreateProductInput): Promise<Product>;
  updateWithValidation(id: string, data: UpdateProductInput): Promise<void>;

  // Enhanced stock management
  adjustStock(
    productId: string,
    adjustment: number,
    reason: string
  ): Promise<void>;
  setStock(productId: string, quantity: number): Promise<void>;
  getStockHistory(productId: string): Promise<
    {
      date: string;
      previousQuantity: number;
      newQuantity: number;
      adjustment: number;
      reason: string;
    }[]
  >;

  // Business logic methods
  getOutOfStockProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  searchProducts(searchQuery: string, limit?: number): Promise<Product[]>;
  getProductStats(id: string): Promise<{
    totalSold: number;
    revenue: number;
    averageSellingPrice: number;
    stockTurnover: number;
  }>;

  // Category management
  createCategory(
    name: string,
    description?: string,
    parentId?: string
  ): Promise<void>;
  getCategories(): Promise<
    { id: string; name: string; description?: string; parentId?: string }[]
  >;
  deleteCategory(categoryId: string): Promise<void>;
}
