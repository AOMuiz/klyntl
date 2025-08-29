import { Product, ProductFilters, ProductSortOptions } from "@/types/product";
import { IBaseRepository } from "./IBaseRepository";

export interface IProductRepository extends IBaseRepository<Product> {
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
}
