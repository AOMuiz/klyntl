import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../types/customer";
import { CustomerFilters, SortOptions } from "../types/filters";

export function useCustomers(
  searchQuery?: string,
  filters?: CustomerFilters,
  sort?: SortOptions,
  page?: number,
  pageSize?: number
) {
  const { db, isReady } = useDatabase();
  const queryClient = useQueryClient();

  // Create database service instance
  const databaseService = new DatabaseService();

  // Query for customers with automatic caching
  const customersQuery = useQuery({
    queryKey: ["customers", { searchQuery, filters, sort, page, pageSize }],
    queryFn: async () => {
      if (!db || !isReady) throw new Error("Database not ready");
      // Initialize the service with the current db instance
      await databaseService.initialize();
      return databaseService.getCustomersWithFilters(
        searchQuery,
        filters,
        sort,
        page,
        pageSize
      );
    },
    enabled: isReady && !!db,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query for customer count
  const countQuery = useQuery({
    queryKey: ["customers", "count", { searchQuery, filters }],
    queryFn: async () => {
      if (!db || !isReady) throw new Error("Database not ready");
      await databaseService.initialize();
      return databaseService.getCustomersCountWithFilters(searchQuery, filters);
    },
    enabled: isReady && !!db,
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (customerData: CreateCustomerInput) => {
      if (!db || !isReady) throw new Error("Database not ready");
      await databaseService.initialize();
      return databaseService.createCustomer(customerData);
    },
    onSuccess: (newCustomer) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["customers", { searchQuery, filters, sort, page, pageSize }],
        (old: Customer[]) => (old ? [newCustomer, ...old] : [newCustomer])
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      console.error("Failed to create customer:", error);
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateCustomerInput;
    }) => {
      if (!db || !isReady) throw new Error("Database not ready");
      await databaseService.initialize();
      await databaseService.updateCustomer(id, updates);
      return { id, updates };
    },
    onSuccess: ({ id, updates }) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["customers", { searchQuery, filters, sort, page, pageSize }],
        (old: Customer[]) =>
          old?.map((customer) =>
            customer.id === id
              ? { ...customer, ...updates, updatedAt: new Date().toISOString() }
              : customer
          )
      );

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      console.error("Failed to update customer:", error);
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!db || !isReady) throw new Error("Database not ready");
      await databaseService.initialize();
      await databaseService.deleteCustomer(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Optimistically remove from cache
      queryClient.setQueryData(
        ["customers", { searchQuery, filters, sort, page, pageSize }],
        (old: Customer[]) =>
          old?.filter((customer) => customer.id !== deletedId)
      );

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error) => {
      console.error("Failed to delete customer:", error);
    },
  });

  return {
    // Data
    customers: customersQuery.data || [],
    totalCount: countQuery.data || 0,

    // Loading states
    isLoading: customersQuery.isLoading || countQuery.isLoading,
    isFetching: customersQuery.isFetching || countQuery.isFetching,

    // Error states
    error: customersQuery.error || countQuery.error,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Actions
    createCustomer: createMutation.mutate,
    updateCustomer: updateMutation.mutate,
    deleteCustomer: deleteMutation.mutate,

    // Utilities
    refetch: () => {
      customersQuery.refetch();
      countQuery.refetch();
    },

    // Success states for UI feedback
    createSuccess: createMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    deleteSuccess: deleteMutation.isSuccess,

    // Reset mutation states
    resetCreateState: createMutation.reset,
    resetUpdateState: updateMutation.reset,
    resetDeleteState: deleteMutation.reset,
  };
}

// Hook for getting a single customer
export function useCustomer(id?: string) {
  const { db, isReady } = useDatabase();
  const databaseService = new DatabaseService();

  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: async () => {
      if (!db || !isReady || !id)
        throw new Error("Database not ready or no ID provided");
      await databaseService.initialize();
      return databaseService.getCustomerById(id);
    },
    enabled: isReady && !!db && !!id,
    staleTime: 5 * 60 * 1000, // Individual customer data can be stale for 5 minutes
    retry: 3,
  });
}

// Hook for searching customers by phone
export function useCustomerByPhone(phone?: string) {
  const { db, isReady } = useDatabase();
  const databaseService = new DatabaseService();

  return useQuery({
    queryKey: ["customers", "phone", phone],
    queryFn: async () => {
      if (!db || !isReady || !phone)
        throw new Error("Database not ready or no phone provided");
      await databaseService.initialize();
      return databaseService.getCustomerByPhone(phone);
    },
    enabled: isReady && !!db && !!phone,
    staleTime: 1 * 60 * 1000, // Phone searches should be relatively fresh
    retry: 2,
  });
}
