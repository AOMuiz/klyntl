import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createDatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import { CreateCustomerInput, UpdateCustomerInput } from "../types/customer";
import { CustomerFilters, SortOptions } from "../types/filters";

export function useCustomers(
  searchQuery?: string,
  filters?: CustomerFilters,
  sort?: SortOptions,
  pageSize: number = 20
) {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const databaseService = db ? createDatabaseService(db) : undefined;

  // Use infinite query for pagination
  const infiniteQuery = useInfiniteQuery({
    queryKey: [
      "customers",
      { searchQuery, filters, sort, pageSize },
      db ? "main" : "default",
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const customers = await databaseService!.customers.findWithFilters(
        filters,
        searchQuery,
        pageParam,
        pageSize
      );
      return {
        customers,
        nextPage: customers.length === pageSize ? pageParam + 1 : undefined,
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
      "customers",
      "count",
      { searchQuery, filters },
      db ? "main" : "default",
    ],
    queryFn: () =>
      databaseService!.getCustomersCountWithFilters(searchQuery, filters),
    enabled: Boolean(databaseService),
    staleTime: 2 * 60 * 1000,
  });

  // Flatten all pages into a single array
  const customers =
    infiniteQuery.data?.pages.flatMap((page) => page.customers) || [];

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: (customerData: CreateCustomerInput) =>
      databaseService!.customers.createCustomer(customerData),
    onSuccess: (newCustomer) => {
      // Add to first page
      queryClient.setQueryData(
        ["customers", { searchQuery, filters, sort, pageSize }],
        (old: any) => {
          if (!old)
            return {
              pages: [{ customers: [newCustomer], nextPage: undefined }],
              pageParams: [0],
            };

          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                customers: [newCustomer, ...firstPage.customers],
              },
              ...old.pages.slice(1),
            ],
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["customers", "count"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateCustomerInput;
    }) => databaseService!.customers.update(id, updates),
    onSuccess: (_, { id, updates }) => {
      // Update across all pages
      queryClient.setQueryData(
        ["customers", { searchQuery, filters, sort, pageSize }],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              customers: page.customers.map((customer: any) =>
                customer.id === id ? { ...customer, ...updates } : customer
              ),
            })),
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["customers", "count"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => databaseService!.customers.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from all pages
      queryClient.setQueryData(
        ["customers", { searchQuery, filters, sort, pageSize }],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              customers: page.customers.filter(
                (customer: any) => customer.id !== deletedId
              ),
            })),
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["customers", "count"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return {
    // Data
    customers,
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
    createCustomer: createMutation.mutate,
    updateCustomer: updateMutation.mutate,
    deleteCustomer: deleteMutation.mutate,

    // Utilities
    refetch: () => {
      infiniteQuery.refetch();
      countQuery.refetch();
    },
  };
}

// Hook for getting a single customer - INDEPENDENT of pagination
export function useCustomer(id?: string) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["customer", id, db ? "main" : "default"],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      const customer = await databaseService!.customers.findById(id);
      if (!customer) {
        throw new Error("Customer not found");
      }
      return customer;
    },
    enabled: Boolean(databaseService) && Boolean(id),
    staleTime: 30 * 1000, // Cache for 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if customer truly doesn't exist
      if (error instanceof Error && error.message === "Customer not found") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Hook for searching customers by phone
export function useCustomerByPhone(phone?: string) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: ["customers", "phone", phone, db ? "main" : "default"],
    queryFn: async () => {
      if (!phone) throw new Error("No phone provided");
      return databaseService!.customers.findByPhone(phone);
    },
    enabled: Boolean(databaseService) && Boolean(phone),
    staleTime: 1 * 60 * 1000, // Phone searches should be relatively fresh
    retry: 2,
  });
}
