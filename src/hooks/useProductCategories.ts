import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import { CreateCategoryInput } from "../types/product";

export function useProductCategories() {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const databaseService = db ? createDatabaseService(db) : undefined;

  const categoriesQuery = useQuery({
    queryKey: ["product-categories", db ? "main" : "default"],
    queryFn: async () => {
      return databaseService!.productCategories.findAll();
    },
    enabled: Boolean(databaseService),
    staleTime: 5 * 60 * 1000, // Categories can be stale for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
  });

  const createMutation = useMutation({
    mutationFn: async (categoryData: CreateCategoryInput) => {
      return databaseService!.productCategories.create(categoryData);
    },
    onSuccess: (newCategory) => {
      // Add to categories cache
      queryClient.setQueryData(["product-categories"], (old: any[]) =>
        old ? [newCategory, ...old] : [newCategory]
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Failed to create category:", error);
    },
  });

  return {
    // Data
    categories: categoriesQuery.data || [],

    // Loading states
    isLoading: categoriesQuery.isLoading,
    isFetching: categoriesQuery.isFetching,

    // Error states
    error: categoriesQuery.error,

    // Mutation states
    isCreating: createMutation.isPending,

    // Actions
    createCategory: createMutation.mutate,

    // Success states
    createSuccess: createMutation.isSuccess,

    // Reset mutation state
    resetCreateState: createMutation.reset,

    // Utilities
    refetch: categoriesQuery.refetch,
  };
}

// Hook for getting a single category
export function useProductCategory(id?: string) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["product-categories", "detail", id, db ? "main" : "default"],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      return databaseService!.productCategories.findById(id);
    },
    enabled: Boolean(databaseService) && Boolean(id),
    staleTime: 5 * 60 * 1000, // Individual category data can be stale for 5 minutes
    retry: 3,
  });
}
