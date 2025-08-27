export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  sku?: string;
  category?: string;
  imageUrl?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
}

export interface ProductFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "all";
  isActive?: boolean;
  searchQuery?: string;
}

export interface ProductSortOptions {
  field: "name" | "price" | "stockQuantity" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}
