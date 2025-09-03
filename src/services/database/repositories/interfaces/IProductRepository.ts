import {
  CreateProductInput,
  Product,
  ProductFilters,
  ProductSortOptions,
  UpdateProductInput,
} from "@/types/product";
import {
  IBaseRepository,
  IFilteredRepository,
  IPaginatedRepository,
  ISortableRepository,
} from "./IBaseRepository";

// ===== PRODUCT REPOSITORY INTERFACE =====
// Defines the contract for product-specific operations

export interface IProductRepository
  extends IBaseRepository<Product>,
    IFilteredRepository<Product, ProductFilters>,
    IPaginatedRepository<Product>,
    ISortableRepository<Product, ProductSortOptions> {
  // Product-specific query methods
  findBySku(sku: string): Promise<Product | null>;
  findByCategory(categoryId: string): Promise<Product[]>;
  findByName(name: string): Promise<Product[]>;
  findActiveProducts(): Promise<Product[]>;
  findInactiveProducts(): Promise<Product[]>;

  // Inventory management
  findLowStockProducts(threshold?: number): Promise<Product[]>;
  findOutOfStockProducts(): Promise<Product[]>;
  findOverStockedProducts(threshold?: number): Promise<Product[]>;
  updateStock(productId: string, quantity: number): Promise<Product>;
  adjustStock(productId: string, adjustment: number): Promise<Product>;

  // Price and cost operations
  findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]>;
  findByCostRange(minCost: number, maxCost: number): Promise<Product[]>;
  updatePrice(productId: string, newPrice: number): Promise<Product>;
  updateCostPrice(productId: string, newCostPrice: number): Promise<Product>;

  // Product analytics
  getProductStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalInventoryValue: number;
    averagePrice: number;
  }>;

  // Inventory value calculations
  getTotalInventoryValue(): Promise<number>;
  getInventoryValueByCategory(categoryId: string): Promise<number>;
  getCostOfGoodsSold(startDate: string, endDate: string): Promise<number>;

  // Product performance
  getTopSellingProducts(limit?: number): Promise<Product[]>;
  getSlowMovingProducts(days?: number): Promise<Product[]>;
  getProfitableProducts(): Promise<Product[]>;

  // Bulk operations
  createBulk(products: CreateProductInput[]): Promise<Product[]>;
  updateBulk(
    updates: { id: string; data: UpdateProductInput }[]
  ): Promise<void>;
  deleteBulk(productIds: string[]): Promise<void>;
  updatePricesBulk(updates: { id: string; price: number }[]): Promise<void>;
  updateStockBulk(updates: { id: string; quantity: number }[]): Promise<void>;

  // Advanced queries
  findProductsRequiringReorder(): Promise<Product[]>;
  findProductsBySupplier(supplierId: string): Promise<Product[]>;
  findProductsWithImages(): Promise<Product[]>;
  findProductsWithoutImages(): Promise<Product[]>;

  // Search functionality
  search(query: string): Promise<Product[]>;
  searchByDescription(description: string): Promise<Product[]>;
}
