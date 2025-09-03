// ===== BASE REPOSITORY INTERFACE =====
// Generic interface that all repositories must implement
// Provides common CRUD operations with type safety

export interface IBaseRepository<T, TId = string> {
  // Core CRUD operations
  findById(id: TId): Promise<T | null>;
  findAll(searchQuery?: string): Promise<T[]>;
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  update(id: TId, data: Partial<T>): Promise<void>;
  delete(id: TId): Promise<void>;

  // Additional common operations
  exists(id: TId): Promise<boolean>;
  count(searchQuery?: string): Promise<number>;
}

// Paginated query interface for repositories that support pagination
export interface IPaginatedRepository<T> {
  findWithPagination(
    searchQuery?: string,
    page?: number,
    pageSize?: number
  ): Promise<{
    items: T[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }>;
}

// Filtered query interface for repositories that support advanced filtering
export interface IFilteredRepository<T, TFilters> {
  findWithFilters(
    filters?: TFilters,
    searchQuery?: string,
    page?: number,
    pageSize?: number
  ): Promise<T[]>;

  countWithFilters(filters?: TFilters, searchQuery?: string): Promise<number>;
}

// Sortable repository interface
export interface ISortableRepository<T, TSortOptions> {
  findWithSort(
    sort?: TSortOptions,
    searchQuery?: string,
    page?: number,
    pageSize?: number
  ): Promise<T[]>;
}
