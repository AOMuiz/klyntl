import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createDatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import {
  CreateProductInput,
  ProductFilters,
  ProductSortOptions,
  UpdateProductInput,
} from "../types/product";

export function useProducts(
  searchQuery?: string,
  filters?: ProductFilters,
  sort?: ProductSortOptions,
  pageSize: number = 20
) {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const databaseService = db ? createDatabaseService(db) : undefined;

  // Use infinite query for pagination
  const infiniteQuery = useInfiniteQuery({
    queryKey: [
      "products",
      { searchQuery, filters, sort, pageSize },
      db ? "main" : "default",
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const productFilters = {
        ...filters,
        searchQuery,
      };

      const products = await databaseService!.products.findWithFilters(
        productFilters,
        sort,
        pageParam, // page number
        pageSize
      );
      return {
        products,
        nextPage: products.length === pageSize ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: Boolean(databaseService),
    staleTime: 2 * 60 * 1000,
  });

  // Separate query for total count
  const countQuery = useQuery({
    queryKey: [
      "products",
      "count",
      { searchQuery, filters },
      db ? "main" : "default",
    ],
    queryFn: () => {
      const productFilters = {
        ...filters,
        searchQuery,
      };
      return databaseService!.products.count(productFilters);
    },
    enabled: Boolean(databaseService),
    staleTime: 2 * 60 * 1000,
  });

  // Flatten all pages into a single array
  const products =
    infiniteQuery.data?.pages.flatMap((page) => page.products) || [];

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: (productData: CreateProductInput) => {
      return databaseService!.products.create(productData);
    },
    onSuccess: (newProduct) => {
      // Add to first page
      queryClient.setQueryData(
        ["products", { searchQuery, filters, sort, pageSize }],
        (old: any) => {
          if (!old)
            return {
              pages: [{ products: [newProduct], nextPage: undefined }],
              pageParams: [0],
            };

          const firstPage = old.pages[0];
          const updatedProducts = [newProduct, ...firstPage.products];
          const trimmedProducts = updatedProducts.slice(0, pageSize);

          return {
            ...old,
            pages: [
              {
                ...firstPage,
                products: trimmedProducts,
                nextPage: trimmedProducts.length === pageSize ? 1 : undefined,
              },
              ...old.pages.slice(1),
            ],
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["products", "count"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateProductInput;
    }) => {
      return databaseService!.products.update(id, updates);
    },
    onSuccess: (updatedProduct, { id, updates }) => {
      // Update across all pages
      queryClient.setQueryData(
        ["products", { searchQuery, filters, sort, pageSize }],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              products: page.products.map((product: any) =>
                // use the full updatedProduct instead of shallow-spreading `updates`
                product.id === id ? updatedProduct : product
              ),
            })),
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["products", "count"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return databaseService!.products.delete(id);
    },
    onSuccess: (_, deletedId) => {
      // Remove from all pages
      queryClient.setQueryData(
        ["products", { searchQuery, filters, sort, pageSize }],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              products: page.products.filter(
                (product: any) => product.id !== deletedId
              ),
            })),
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["products", "count"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  return {
    // Data
    products,
    totalCount: countQuery.data || 0,

    // Loading states
    isLoading: infiniteQuery.isLoading || countQuery.isLoading,
    isFetching: infiniteQuery.isFetching || countQuery.isFetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,

    // Error states
    error: infiniteQuery.error || countQuery.error,

    // Pagination
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Actions
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,

    // Utilities
    refetch: () => {
      return Promise.all([infiniteQuery.refetch(), countQuery.refetch()]);
    },
  };
}

// Hook for getting a single product
export function useProduct(id?: string) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["products", "detail", id, db ? "main" : "default"],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      return databaseService!.products.findById(id);
    },
    enabled: Boolean(databaseService) && Boolean(id),
    staleTime: 5 * 60 * 1000, // Individual product data can be stale for 5 minutes
    retry: 3,
  });
}

// Hook for searching products by SKU
export function useProductBySku(sku?: string) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["products", "sku", sku, db ? "main" : "default"],
    queryFn: async () => {
      if (!sku) throw new Error("No SKU provided");
      return databaseService!.products.getBySku(sku);
    },
    enabled: Boolean(databaseService) && Boolean(sku),
    staleTime: 1 * 60 * 1000, // SKU searches should be relatively fresh
    retry: 2,
  });
}

// Hook for getting low stock products
export function useLowStockProducts() {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["products", "low-stock", db ? "main" : "default"],
    queryFn: async () => {
      return databaseService!.products.getLowStockProducts();
    },
    enabled: Boolean(databaseService),
    staleTime: 1 * 60 * 1000, // Low stock alerts should be fresh
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 3,
  });
}
