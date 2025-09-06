import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys";
import { createDatabaseService } from "../services/database";
import { useDatabase } from "../services/database/hooks";
import {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "../types/transaction";

export function useTransactions(customerId?: string) {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const databaseService = db ? createDatabaseService(db) : undefined;

  const transactionsQuery = useQuery({
    queryKey: QUERY_KEYS.transactions.list(customerId),
    queryFn: async () => {
      if (!databaseService) throw new Error("Database not available");
      return customerId
        ? databaseService.transactions.findByCustomer(customerId)
        : databaseService.transactions.getAllTransactions();
    },
    enabled: !!db,
    staleTime: 1 * 60 * 1000, // Transaction data should be fresh for 1 minute
    gcTime: 3 * 60 * 1000, // Keep in cache for 3 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      if (!databaseService) throw new Error("Database not available");
      return databaseService.transactions.create(data);
    },
    onSuccess: (newTransaction) => {
      // Update transactions cache
      queryClient.setQueryData(
        QUERY_KEYS.transactions.list(customerId),
        (old: Transaction[]) =>
          old ? [newTransaction, ...old] : [newTransaction]
      );

      // Invalidate customer data since totals changed
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.all() });

      // If creating for specific customer, also invalidate all transactions
      if (!customerId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.transactions.all(),
        });
      }
    },
    onError: (error) => {
      console.error("Failed to create transaction:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateTransactionInput;
    }) => {
      if (!databaseService) throw new Error("Database not available");
      await databaseService.transactions.update(id, updates);
      return { id, updates };
    },
    onSuccess: ({ id, updates }) => {
      queryClient.setQueryData(
        QUERY_KEYS.transactions.list(customerId),
        (old: Transaction[]) =>
          old?.map((txn) => (txn.id === id ? { ...txn, ...updates } : txn))
      );

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.all() });
    },
    onError: (error) => {
      console.error("Failed to update transaction:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!databaseService) throw new Error("Database not available");
      await databaseService.transactions.delete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(
        QUERY_KEYS.transactions.list(customerId),
        (old: Transaction[]) => old?.filter((txn) => txn.id !== deletedId)
      );

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.all() });
    },
    onError: (error) => {
      console.error("Failed to delete transaction:", error);
    },
  });

  return {
    // Data
    transactions: transactionsQuery.data || [],

    // Loading states
    isLoading: transactionsQuery.isLoading,
    isFetching: transactionsQuery.isFetching,

    // Error states
    error: transactionsQuery.error,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Actions
    createTransaction: createMutation.mutate,
    createTransactionAsync: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutate,
    updateTransactionAsync: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutate,

    // Success states
    createSuccess: createMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    deleteSuccess: deleteMutation.isSuccess,

    // Reset mutation states
    resetCreateState: createMutation.reset,
    resetUpdateState: updateMutation.reset,
    resetDeleteState: deleteMutation.reset,

    // Utilities
    refetch: transactionsQuery.refetch,
  };
}

// Hook for getting a single transaction
export function useTransaction(id?: string) {
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  return useQuery({
    queryKey: QUERY_KEYS.transactions.detail(id),
    queryFn: async () => {
      if (!databaseService || !id)
        throw new Error("Database not available or no ID provided");
      return databaseService.transactions.findById(id);
    },
    enabled: !!db && !!id,
    staleTime: 5 * 60 * 1000, // Individual transaction data can be stale for 5 minutes
    retry: 3,
  });
}
